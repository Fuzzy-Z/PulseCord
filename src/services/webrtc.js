const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302'
      ]
    },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' }
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

  setLocalScreenStream(stream) {
    this.localScreenStream = stream;
    // Update screen tracks for all peers and re-negotiate
    this.peers.forEach((pc, targetSocketId) => {
      if (stream) {
        stream.getVideoTracks().forEach((track) => {
          const senders = pc.getSenders();
          const existingSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (existingSender) {
            existingSender.replaceTrack(track);
          } else {
            pc.addTrack(track, stream);
          }
        });
        // Re-negotiate SDP offer so remote peers receive video track
        this.initiateOffer(targetSocketId, pc);
      } else {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          pc.removeTrack(videoSender);
          this.initiateOffer(targetSocketId, pc);
        }
      }
    });
  }

  createPeerConnection(targetSocketId, isInitiator = false) {
    if (this.peers.has(targetSocketId)) {
      return this.peers.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(targetSocketId, pc);
    this.iceCandidateQueues.set(targetSocketId, []);

    // Add local audio track to peer connection
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, this.localAudioStream);
      });
    }

    // Add local screen share track if already active
    if (this.localScreenStream) {
      this.localScreenStream.getVideoTracks().forEach((track) => {
        pc.addTrack(track, this.localScreenStream);
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
      let stream = event.streams && event.streams[0];
      if (!stream) {
        stream = new MediaStream([event.track]);
      }
      if (this.onRemoteStream && stream) {
        this.onRemoteStream(targetSocketId, stream, event.track.kind);
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
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
