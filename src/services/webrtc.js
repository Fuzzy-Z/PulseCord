// High-Performance WebRTC Manager with Full STUN + TURN Relay Support
const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
        'stun:global.stun.twilio.com:3478'
      ]
    },
    // Free Public Global TURN Relay Servers (Bypasses all symmetric NATs / CGNAT / ISP firewalls)
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelay',
      credential: 'openrelay'
    }
  ],
  iceCandidatePoolSize: 10
};

export class WebRTCManager {
  constructor(socket, { onRemoteStream, onRemoteStreamRemoved, onPeerDisconnected }) {
    this.socket = socket;
    this.onRemoteStream = onRemoteStream;
    this.onRemoteStreamRemoved = onRemoteStreamRemoved;
    this.onPeerDisconnected = onPeerDisconnected;

    // Map of peerSocketId -> RTCPeerConnection
    this.peers = new Map();
    // Map of peerSocketId -> Array of queued RTCIceCandidate
    this.iceCandidateQueues = new Map();
    // Local streams
    this.localAudioStream = null;
    this.localScreenStream = null;
  }

  setLocalAudioStream(stream) {
    this.localAudioStream = stream;
    // Add or replace audio track to all existing peers
    this.peers.forEach((pc, targetSocketId) => {
      if (stream) {
        stream.getAudioTracks().forEach((track) => {
          const senders = pc.getSenders();
          const existingSender = senders.find((s) => s.track && s.track.kind === 'audio');
          if (existingSender) {
            existingSender.replaceTrack(track);
          } else {
            pc.addTrack(track, stream);
            this.initiateOffer(targetSocketId, pc);
          }
        });
      }
    });
  }

  applyVideoQuality(sender) {
    try {
      const params = sender.getParameters();
      if (!params.encodings) params.encodings = [{}];
      // Force 15 Mbps max bitrate for 60fps Gaming without pixelation
      params.encodings[0].maxBitrate = 15000000;
      // Prioritize Framerate (60fps) over strict resolution scaling when under CPU load
      params.degradationPreference = 'maintain-framerate';
      sender.setParameters(params).catch(() => {});
    } catch (e) {
      console.warn('[WebRTC] Error setting video quality parameters:', e);
    }
  }

  setLocalScreenStream(stream) {
    this.localScreenStream = stream;
    // Update screen tracks for all peers and re-negotiate
    this.peers.forEach((pc, targetSocketId) => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          const senders = pc.getSenders();
          const existingSender = senders.find((s) => s.track && s.track.kind === track.kind && s.track.id === track.id);
          
          if (existingSender) {
            existingSender.replaceTrack(track);
            if (track.kind === 'video') this.applyVideoQuality(existingSender);
          } else {
            // Keep screen tracks in stream (never merge into microphone localAudioStream to prevent echo loopback)
            const sender = pc.addTrack(track, stream);
            if (track.kind === 'video') this.applyVideoQuality(sender);
          }
        });
        // Re-negotiate SDP offer so remote peers receive video track
        this.initiateOffer(targetSocketId, pc);
      } else {
        const senders = pc.getSenders();
        const micTrackIds = this.localAudioStream ? this.localAudioStream.getAudioTracks().map(t => t.id) : [];
        
        senders.forEach(sender => {
           if (!sender.track) return;
           if (sender.track.kind === 'video') {
               pc.removeTrack(sender);
           } else if (sender.track.kind === 'audio' && !micTrackIds.includes(sender.track.id)) {
               pc.removeTrack(sender);
           }
        });
        this.initiateOffer(targetSocketId, pc);
      }
    });
  }

  createPeerConnection(targetSocketId, isInitiator = false) {
    if (this.peers.has(targetSocketId)) {
      return this.peers.get(targetSocketId);
    }

    console.log(`[WebRTC] Creating RTCPeerConnection for ${targetSocketId} (initiator: ${isInitiator})`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(targetSocketId, pc);
    this.iceCandidateQueues.set(targetSocketId, []);

    // Add local microphone audio track ONLY to peer connection
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, this.localAudioStream);
      });
    }

    // Add local screen share track if already active (isolated in localScreenStream)
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, this.localScreenStream);
        if (track.kind === 'video') {
          this.applyVideoQuality(sender);
        }
      });
    }

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtc-ice-candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Remote Track received (Ensures MediaStream exists even if single track)
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track (${event.track.kind}) from ${targetSocketId}`);
      let stream = event.streams && event.streams[0];
      if (!stream) {
        stream = new MediaStream([event.track]);
      }

      // When a track (e.g. screen audio) is removed, trigger state update
      stream.onremovetrack = () => {
        if (this.onRemoteStream) {
          this.onRemoteStream(targetSocketId, stream, event.track.kind);
        }
      };

      if (this.onRemoteStream && stream) {
        this.onRemoteStream(targetSocketId, stream, event.track.kind);
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${targetSocketId}: ${pc.connectionState}`);
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        this.removePeer(targetSocketId);
        if (this.onPeerDisconnected) {
          this.onPeerDisconnected(targetSocketId);
        }
      }
    };

    if (isInitiator) {
      this.initiateOffer(targetSocketId, pc);
    }

    return pc;
  }

  async initiateOffer(targetSocketId, pc) {
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      this.socket.emit('webrtc-offer', {
        targetSocketId,
        offer
      });
    } catch (err) {
      console.error('[WebRTC] Error creating offer:', err);
    }
  }

  async handleOffer(senderSocketId, offer) {
    const pc = this.createPeerConnection(senderSocketId, false);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Process any queued ICE candidates
      const queue = this.iceCandidateQueues.get(senderSocketId) || [];
      while (queue.length > 0) {
        const candidate = queue.shift();
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.socket.emit('webrtc-answer', {
        targetSocketId: senderSocketId,
        answer
      });
    } catch (err) {
      console.error('[WebRTC] Error handling offer:', err);
    }
  }

  async handleAnswer(senderSocketId, answer) {
    const pc = this.peers.get(senderSocketId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Process any queued ICE candidates
        const queue = this.iceCandidateQueues.get(senderSocketId) || [];
        while (queue.length > 0) {
          const candidate = queue.shift();
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
        }
      } catch (err) {
        console.error('[WebRTC] Error handling answer:', err);
      }
    }
  }

  async handleIceCandidate(senderSocketId, candidate) {
    const pc = this.peers.get(senderSocketId);
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    } else {
      // Queue candidate until remote description is set
      const queue = this.iceCandidateQueues.get(senderSocketId) || [];
      queue.push(candidate);
      this.iceCandidateQueues.set(senderSocketId, queue);
    }
  }

  removePeer(targetSocketId) {
    const pc = this.peers.get(targetSocketId);
    if (pc) {
      pc.close();
      this.peers.delete(targetSocketId);
      this.iceCandidateQueues.delete(targetSocketId);
      if (this.onRemoteStreamRemoved) {
        this.onRemoteStreamRemoved(targetSocketId);
      }
    }
  }

  closeAll() {
    this.peers.forEach((pc, id) => {
      pc.close();
      if (this.onRemoteStreamRemoved) {
        this.onRemoteStreamRemoved(id);
      }
    });
    this.peers.clear();
    this.iceCandidateQueues.clear();
  }
}
