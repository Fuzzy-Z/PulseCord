// High-Performance Resilient WebRTC Manager with W3C Perfect Negotiation & Auto-Recovery
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
    // Free Public Global TURN Relay Servers (Bypasses symmetric NATs / CGNAT / ISP firewalls)
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
    // Map of peerSocketId -> State flags for Perfect Negotiation
    this.peerStates = new Map();
    // Map of peerSocketId -> Array of queued RTCIceCandidate
    this.iceCandidateQueues = new Map();
    // Map of peerSocketId -> Screen Stream ID
    this.peerScreenStreamIds = new Map();
    // Local streams
    this.localAudioStream = null;
    this.localScreenStream = null;
  }

  getOrCreatePeerState(targetSocketId) {
    if (!this.peerStates.has(targetSocketId)) {
      this.peerStates.set(targetSocketId, {
        makingOffer: false,
        ignoreOffer: false,
        isSettingRemoteAnswerPending: false,
        reconnectAttempts: 0
      });
    }
    return this.peerStates.get(targetSocketId);
  }

  isPeerPolite(targetSocketId) {
    const myId = this.socket?.id || '';
    return myId > targetSocketId;
  }

  async handleOffer(senderSocketId, offer) {
    const pc = this.createPeerConnection(senderSocketId);
    const state = this.getOrCreatePeerState(senderSocketId);
    const isPolite = this.isPeerPolite(senderSocketId);

    try {
      const readyForOffer = !state.makingOffer && (pc.signalingState === 'stable' || state.isSettingRemoteAnswerPending);
      const offerCollision = !readyForOffer;

      state.ignoreOffer = !isPolite && offerCollision;
      if (state.ignoreOffer) {
        console.warn(`[WebRTC] Glare with ${senderSocketId}: Impolite peer ignoring colliding offer.`);
        return;
      }

      if (offerCollision && pc.signalingState !== 'stable') {
        try {
          await pc.setLocalDescription({ type: 'rollback' });
        } catch (e) {
          console.warn('[WebRTC] Rollback error:', e);
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Process any queued ICE candidates
      const queue = this.iceCandidateQueues.get(senderSocketId) || [];
      while (queue.length > 0) {
        const candidate = queue.shift();
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.socket.emit('webrtc-answer', {
        targetSocketId: senderSocketId,
        answer: pc.localDescription
      });
    } catch (err) {
      console.error(`[WebRTC] Error handling offer from ${senderSocketId}:`, err);
    }
  }

  async handleAnswer(senderSocketId, answer) {
    const pc = this.peers.get(senderSocketId);
    const state = this.getOrCreatePeerState(senderSocketId);

    if (pc && pc.signalingState !== 'closed') {
      try {
        if (state.ignoreOffer) {
          return;
        }
        state.isSettingRemoteAnswerPending = true;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        state.isSettingRemoteAnswerPending = false;

        // Process any queued ICE candidates
        const queue = this.iceCandidateQueues.get(senderSocketId) || [];
        while (queue.length > 0) {
          const candidate = queue.shift();
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        }
      } catch (err) {
        state.isSettingRemoteAnswerPending = false;
        console.error(`[WebRTC] Error handling answer from ${senderSocketId}:`, err);
      }
    }
  }

  async handleIceCandidate(senderSocketId, candidate) {
    const pc = this.peers.get(senderSocketId);
    const state = this.getOrCreatePeerState(senderSocketId);

    try {
      if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
        if (!this.iceCandidateQueues.has(senderSocketId)) {
          this.iceCandidateQueues.set(senderSocketId, []);
        }
        this.iceCandidateQueues.get(senderSocketId).push(candidate);
        return;
      }

      if (state.ignoreOffer) return;
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      if (!state.ignoreOffer) {
        console.warn(`[WebRTC] Error adding ICE candidate from ${senderSocketId}:`, err);
      }
    }
  }

  setLocalAudioStream(stream) {
    this.localAudioStream = stream;
    // Add or replace audio track on all peer connections
    this.peers.forEach((pc, targetSocketId) => {
      try {
        const senders = pc.getSenders();
        const existingAudioSender = senders.find((s) => s.track && s.track.kind === 'audio' && !this.isScreenSender(s));

        if (stream) {
          const micTrack = stream.getAudioTracks()[0];
          if (micTrack) {
            if (existingAudioSender) {
              existingAudioSender.replaceTrack(micTrack).catch(console.warn);
            } else {
              pc.addTrack(micTrack, stream);
            }
          }
        } else if (existingAudioSender) {
          pc.removeTrack(existingAudioSender);
        }
      } catch (err) {
        console.warn(`[WebRTC] Error updating audio track for ${targetSocketId}:`, err);
      }
    });
  }

  isScreenSender(sender) {
    if (!this.localScreenStream || !sender || !sender.track) return false;
    const screenTrackIds = this.localScreenStream.getTracks().map((t) => t.id);
    return screenTrackIds.includes(sender.track.id);
  }

  applyVideoQuality(sender) {
    try {
      const params = sender.getParameters();
      if (!params.encodings) params.encodings = [{}];
      // 15 Mbps max bitrate for ultra smooth 60fps
      params.encodings[0].maxBitrate = 15000000;
      params.degradationPreference = 'maintain-framerate';
      sender.setParameters(params).catch(() => {});
    } catch (e) {
      console.warn('[WebRTC] Error setting video parameters:', e);
    }
  }

  setLocalScreenStream(stream) {
    this.localScreenStream = stream;
    this.peers.forEach((pc, targetSocketId) => {
      try {
        const senders = pc.getSenders();
        const micTrackIds = this.localAudioStream ? this.localAudioStream.getAudioTracks().map((t) => t.id) : [];

        if (stream) {
          stream.getTracks().forEach((track) => {
            const existingSender = senders.find((s) => s.track && s.track.kind === track.kind && !micTrackIds.includes(s.track.id));
            if (existingSender) {
              existingSender.replaceTrack(track).catch(console.warn);
              if (track.kind === 'video') this.applyVideoQuality(existingSender);
            } else {
              const sender = pc.addTrack(track, stream);
              if (track.kind === 'video') this.applyVideoQuality(sender);
            }
          });
        } else {
          // Remove all screen senders
          senders.forEach((sender) => {
            if (!sender.track) return;
            if (sender.track.kind === 'video' || (sender.track.kind === 'audio' && !micTrackIds.includes(sender.track.id))) {
              pc.removeTrack(sender);
            }
          });
        }
      } catch (err) {
        console.warn(`[WebRTC] Error updating screen stream for ${targetSocketId}:`, err);
      }
    });
  }

  createPeerConnection(targetSocketId) {
    if (this.peers.has(targetSocketId)) {
      return this.peers.get(targetSocketId);
    }

    console.log(`[WebRTC] Initializing RTCPeerConnection for ${targetSocketId}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(targetSocketId, pc);
    this.iceCandidateQueues.set(targetSocketId, []);
    const state = this.getOrCreatePeerState(targetSocketId);

    // 1. Add Local Microphone Track
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        try {
          pc.addTrack(track, this.localAudioStream);
        } catch (e) {
          console.warn('[WebRTC] addTrack error:', e);
        }
      });
    }

    // 2. Add Local Screen Tracks
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => {
        try {
          const sender = pc.addTrack(track, this.localScreenStream);
          if (track.kind === 'video') this.applyVideoQuality(sender);
        } catch (e) {
          console.warn('[WebRTC] addTrack screen error:', e);
        }
      });
    }

    // 3. W3C Perfect Negotiation: onnegotiationneeded handler
    pc.onnegotiationneeded = async () => {
      try {
        state.makingOffer = true;
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        if (pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(offer);
        this.socket.emit('webrtc-offer', {
          targetSocketId,
          offer: pc.localDescription
        });
      } catch (err) {
        console.error(`[WebRTC] Negotiation offer error with ${targetSocketId}:`, err);
      } finally {
        state.makingOffer = false;
      }
    };

    // 4. ICE Candidates handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtc-ice-candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // 5. Remote Track reception
    pc.ontrack = (event) => {
      let stream = event.streams && event.streams[0];
      if (!stream) {
        stream = new MediaStream([event.track]);
      }

      let kind = event.track.kind;
      if (kind === 'video') {
        this.peerScreenStreamIds.set(targetSocketId, stream.id);
      } else if (kind === 'audio') {
        const isScreenAudio =
          (stream.getVideoTracks && stream.getVideoTracks().length > 0) ||
          (this.peerScreenStreamIds.get(targetSocketId) && stream.id === this.peerScreenStreamIds.get(targetSocketId));
        if (isScreenAudio) {
          kind = 'screenAudio';
        }
      }

      console.log(`[WebRTC] Remote track received (${kind}) from ${targetSocketId}`);

      event.track.onended = () => {
        console.log(`[WebRTC] Track ended (${kind}) from ${targetSocketId}`);
        if (kind === 'video') {
          this.peerScreenStreamIds.delete(targetSocketId);
          if (this.onRemoteStream) {
            this.onRemoteStream(targetSocketId, null, 'video');
          }
        }
      };

      if (this.onRemoteStream) {
        this.onRemoteStream(targetSocketId, stream, kind);
      }
    };

    // 6. Resilient Connection state monitoring with Auto-Recovery
    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE State with ${targetSocketId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') {
        console.warn(`[WebRTC] ICE failed with ${targetSocketId}. Attempting ICE Restart...`);
        this.restartIce(targetSocketId);
      } else if (pc.iceConnectionState === 'disconnected') {
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected' && this.peers.has(targetSocketId)) {
            console.warn(`[WebRTC] Persistent disconnect with ${targetSocketId}. Restarting ICE...`);
            this.restartIce(targetSocketId);
          }
        }, 3000);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${targetSocketId}: ${pc.connectionState}`);
      if (['failed', 'closed'].includes(pc.connectionState)) {
        if (state.reconnectAttempts < 3) {
          state.reconnectAttempts++;
          this.restartIce(targetSocketId);
        } else {
          this.removePeer(targetSocketId);
          if (this.onPeerDisconnected) {
            this.onPeerDisconnected(targetSocketId);
          }
        }
      } else if (pc.connectionState === 'connected') {
        state.reconnectAttempts = 0;
      }
    };

    return pc;
  }

  async restartIce(targetSocketId) {
    const pc = this.peers.get(targetSocketId);
    if (!pc || pc.signalingState === 'closed') return;
    try {
      if (pc.restartIce) {
        pc.restartIce();
      }
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      this.socket.emit('webrtc-offer', {
        targetSocketId,
        offer: pc.localDescription
      });
    } catch (err) {
      console.warn(`[WebRTC] Restart ICE failed for ${targetSocketId}:`, err);
    }
  }



  removePeer(targetSocketId) {
    const pc = this.peers.get(targetSocketId);
    if (pc) {
      try {
        pc.close();
      } catch (e) {}
      this.peers.delete(targetSocketId);
      this.peerStates.delete(targetSocketId);
      this.iceCandidateQueues.delete(targetSocketId);
      this.peerScreenStreamIds.delete(targetSocketId);
      if (this.onRemoteStreamRemoved) {
        this.onRemoteStreamRemoved(targetSocketId);
      }
    }
  }

  closeAll() {
    this.peers.forEach((pc, id) => {
      try {
        pc.close();
      } catch (e) {}
      if (this.onRemoteStreamRemoved) {
        this.onRemoteStreamRemoved(id);
      }
    });
    this.peers.clear();
    this.peerStates.clear();
    this.iceCandidateQueues.clear();
    this.peerScreenStreamIds.clear();
  }
}
