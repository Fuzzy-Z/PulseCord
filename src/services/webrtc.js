const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};

export class WebRTCManager {
  constructor(socket, { onRemoteStream, onRemoteStreamRemoved, onPeerDisconnected }) {
    this.socket = socket;
    this.onRemoteStream = onRemoteStream;
    this.onRemoteStreamRemoved = onRemoteStreamRemoved;
    this.onPeerDisconnected = onPeerDisconnected;

    // Map of peerSocketId -> RTCPeerConnection
    this.peers = new Map();
    // Local streams
    this.localAudioStream = null;
    this.localScreenStream = null;
  }

  setLocalAudioStream(stream) {
    this.localAudioStream = stream;
    // Add audio track to all existing peers
    this.peers.forEach((pc) => {
      if (stream) {
        stream.getAudioTracks().forEach(track => {
          const senders = pc.getSenders();
          const existingSender = senders.find(s => s.track && s.track.kind === 'audio');
          if (existingSender) {
            existingSender.replaceTrack(track);
          } else {
            pc.addTrack(track, stream);
          }
        });
      }
    });
  }

  setLocalScreenStream(stream) {
    this.localScreenStream = stream;
    // Update screen tracks for all peers
    this.peers.forEach((pc) => {
      if (stream) {
        stream.getVideoTracks().forEach(track => {
          const senders = pc.getSenders();
          const existingSender = senders.find(s => s.track && s.track.kind === 'video');
          if (existingSender) {
            existingSender.replaceTrack(track);
          } else {
            pc.addTrack(track, stream);
          }
        });
      } else {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          pc.removeTrack(videoSender);
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

    // Add local tracks to peer connection
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach(track => {
        pc.addTrack(track, this.localAudioStream);
      });
    }

    if (this.localScreenStream) {
      this.localScreenStream.getVideoTracks().forEach(track => {
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

    // Remote Track received
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (this.onRemoteStream && remoteStream) {
        this.onRemoteStream(targetSocketId, remoteStream, event.track.kind);
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
      console.error('Error creating WebRTC offer:', err);
    }
  }

  async handleOffer(senderSocketId, offer) {
    const pc = this.createPeerConnection(senderSocketId, false);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.socket.emit('webrtc-answer', {
        targetSocketId: senderSocketId,
        answer
      });
    } catch (err) {
      console.error('Error handling WebRTC offer:', err);
    }
  }

  async handleAnswer(senderSocketId, answer) {
    const pc = this.peers.get(senderSocketId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    }
  }

  async handleIceCandidate(senderSocketId, candidate) {
    const pc = this.peers.get(senderSocketId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    }
  }

  removePeer(targetSocketId) {
    const pc = this.peers.get(targetSocketId);
    if (pc) {
      pc.close();
      this.peers.delete(targetSocketId);
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
  }
}
