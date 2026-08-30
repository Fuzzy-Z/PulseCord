import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSocket } from './SocketContext';
import { WebRTCManager } from '../services/webrtc';
import { KrispAudioProcessor } from '../services/audioUtils';

const VoiceContext = createContext(null);

export const VoiceProvider = ({ children }) => {
  const { socket, currentUser } = useSocket();

  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null);
  const [usersInVoice, setUsersInVoice] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState(new Set());

  // Krisp Noise Suppression & Sensitivity settings
  const [krispEnabled, setKrispEnabledState] = useState(() => {
    const saved = localStorage.getItem('pulsecord_krisp_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [micSensitivity, setMicSensitivityState] = useState(() => {
    const saved = localStorage.getItem('pulsecord_mic_sensitivity');
    return saved !== null ? Number(saved) : 35;
  });
  const [micGain, setMicGainState] = useState(() => {
    const saved = localStorage.getItem('pulsecord_mic_gain');
    return saved !== null ? Number(saved) : 100;
  });
  const [micLiveLevel, setMicLiveLevel] = useState(0);
  const [isGateOpen, setIsGateOpen] = useState(false);

  // Per-User Friend Volume Sliders (0% to 200%)
  const [userVolumes, setUserVolumes] = useState(() => {
    try {
      const saved = localStorage.getItem('pulsecord_user_volumes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Streams
  const [localAudioStream, setLocalAudioStream] = useState(null);
  const [localScreenStream, setLocalScreenStream] = useState(null);
  // Map of socketId -> { audioStream, videoStream }
  const [remoteStreams, setRemoteStreams] = useState({});

  // Music Bot Player State
  const [musicPlayer, setMusicPlayer] = useState({
    isPlaying: false,
    currentTrack: null,
    queue: [],
    volume: 70
  });

  const webrtcManagerRef = useRef(null);
  const krispProcessorRef = useRef(null);
  const musicAudioRef = useRef(null);

  // Helper setters that persist to localStorage
  const setKrispEnabled = (val) => {
    setKrispEnabledState(val);
    localStorage.setItem('pulsecord_krisp_enabled', String(val));
    if (krispProcessorRef.current) {
      krispProcessorRef.current.setKrispEnabled(val);
    }
  };

  const setMicSensitivity = (val) => {
    setMicSensitivityState(val);
    localStorage.setItem('pulsecord_mic_sensitivity', String(val));
    if (krispProcessorRef.current) {
      krispProcessorRef.current.setSensitivity(val);
    }
  };

  const setMicGain = (val) => {
    setMicGainState(val);
    localStorage.setItem('pulsecord_mic_gain', String(val));
    if (krispProcessorRef.current) {
      krispProcessorRef.current.setInputGain(val / 100);
    }
  };

  const setUserVolume = (userId, volume) => {
    setUserVolumes((prev) => {
      const updated = { ...prev, [userId]: volume };
      localStorage.setItem('pulsecord_user_volumes', JSON.stringify(updated));
      return updated;
    });
  };

  // Initialize WebRTC Manager
  useEffect(() => {
    if (!socket) return;

    const manager = new WebRTCManager(socket, {
      onRemoteStream: (peerSocketId, stream, kind) => {
        setRemoteStreams((prev) => {
          const current = prev[peerSocketId] || {};
          if (kind === 'video') {
            return { ...prev, [peerSocketId]: { ...current, videoStream: stream } };
          } else {
            return { ...prev, [peerSocketId]: { ...current, audioStream: stream } };
          }
        });
      },
      onRemoteStreamRemoved: (peerSocketId) => {
        setRemoteStreams((prev) => {
          const updated = { ...prev };
          delete updated[peerSocketId];
          return updated;
        });
      },
      onPeerDisconnected: (peerSocketId) => {
        setRemoteStreams((prev) => {
          const updated = { ...prev };
          delete updated[peerSocketId];
          return updated;
        });
      }
    });

    webrtcManagerRef.current = manager;

    // WebRTC Signaling events
    socket.on('user-joined-voice', async ({ user, channelId }) => {
      if (channelId === activeVoiceChannel) {
        setUsersInVoice((prev) => {
          if (!prev.some((u) => u.id === user.id)) {
            return [...prev, user];
          }
          return prev;
        });
        if (manager) {
          manager.createPeerConnection(user.socketId, true);
        }
      }
    });

    socket.on('user-left-voice', ({ socketId, userId, channelId }) => {
      setUsersInVoice((prev) => prev.filter((u) => u.id !== userId));
      setSpeakingUsers((prev) => {
        const next = new Set(prev);
        next.delete(socketId);
        return next;
      });
      if (manager) {
        manager.removePeer(socketId);
      }
    });

    socket.on('webrtc-offer', async ({ senderSocketId, offer }) => {
      if (manager) {
        await manager.handleOffer(senderSocketId, offer);
      }
    });

    socket.on('webrtc-answer', async ({ senderSocketId, answer }) => {
      if (manager) {
        await manager.handleAnswer(senderSocketId, answer);
      }
    });

    socket.on('webrtc-ice-candidate', async ({ senderSocketId, candidate }) => {
      if (manager) {
        await manager.handleIceCandidate(senderSocketId, candidate);
      }
    });

    socket.on('user-speaking', ({ socketId, isSpeaking }) => {
      setSpeakingUsers((prev) => {
        const next = new Set(prev);
        if (isSpeaking) next.add(socketId);
        else next.delete(socketId);
        return next;
      });
    });

    socket.on('user-voice-status-updated', ({ user }) => {
      setUsersInVoice((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...user } : u)));
    });

    socket.on('music-state-update', ({ channelId, player }) => {
      if (channelId === activeVoiceChannel) {
        setMusicPlayer(player);
      }
    });

    return () => {
      socket.off('user-joined-voice');
      socket.off('user-left-voice');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('user-speaking');
      socket.off('user-voice-status-updated');
      socket.off('music-state-update');
    };
  }, [socket, activeVoiceChannel]);

  // Synchronized Music Bot Audio Player Element
  useEffect(() => {
    if (!musicAudioRef.current) {
      musicAudioRef.current = new Audio();
    }
    const audio = musicAudioRef.current;

    if (musicPlayer.isPlaying && musicPlayer.currentTrack?.url && activeVoiceChannel && !isDeafened) {
      if (audio.src !== musicPlayer.currentTrack.url) {
        audio.src = musicPlayer.currentTrack.url;
      }
      audio.volume = (musicPlayer.volume || 70) / 100;
      audio.play().catch((e) => console.warn('Music play restriction:', e));
    } else {
      audio.pause();
    }
  }, [musicPlayer, activeVoiceChannel, isDeafened]);

  // Handle Join Voice Channel with Krisp Audio Filter
  const joinVoiceChannel = async (channelId, serverId) => {
    if (!socket) return;
    if (activeVoiceChannel === channelId) return;

    try {
      // 1. Acquire Local Audio with WebRTC hardware processing
      const rawMicStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false // KrispProcessor handles smooth dynamic gain
        },
        video: false
      });

      setLocalAudioStream(rawMicStream);

      // 2. Initialize Krisp Audio Processor (Noise Gate + HighPass/LowPass filters)
      if (krispProcessorRef.current) {
        krispProcessorRef.current.stop();
      }

      const processor = new KrispAudioProcessor(rawMicStream, {
        sensitivity: micSensitivity,
        inputGain: micGain / 100,
        krispEnabled,
        onLevelChange: (level, gateOpen) => {
          setMicLiveLevel(level);
          setIsGateOpen(gateOpen);
        },
        onSpeakingChange: (speaking) => {
          setIsSpeaking(speaking);
          socket.emit('speaking-state', { isSpeaking: speaking });
        }
      });
      krispProcessorRef.current = processor;

      // 3. Feed processed stream to WebRTC
      const processedStream = processor.getProcessedStream();
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.setLocalAudioStream(processedStream);
      }

      // 4. Notify Socket Server
      socket.emit('join-voice', { channelId, serverId }, (response) => {
        if (response && response.success) {
          setActiveVoiceChannel(channelId);
          setUsersInVoice(response.usersInRoom || []);
          if (response.musicPlayer) {
            setMusicPlayer(response.musicPlayer);
          }

          if (response.usersInRoom && webrtcManagerRef.current) {
            response.usersInRoom.forEach((peerUser) => {
              webrtcManagerRef.current.createPeerConnection(peerUser.socketId, true);
            });
          }
        }
      });
    } catch (err) {
      console.error('Failed to access microphone:', err);
      socket.emit('join-voice', { channelId, serverId }, (response) => {
        if (response && response.success) {
          setActiveVoiceChannel(channelId);
          setUsersInVoice(response.usersInRoom || []);
        }
      });
    }
  };

  // Handle Leave Voice Channel
  const leaveVoiceChannel = () => {
    if (!socket) return;

    socket.emit('leave-voice');
    setActiveVoiceChannel(null);
    setUsersInVoice([]);
    setSpeakingUsers(new Set());
    setRemoteStreams({});

    if (localAudioStream) {
      localAudioStream.getTracks().forEach((t) => t.stop());
      setLocalAudioStream(null);
    }
    if (localScreenStream) {
      localScreenStream.getTracks().forEach((t) => t.stop());
      setLocalScreenStream(null);
      setIsScreenSharing(false);
    }
    if (krispProcessorRef.current) {
      krispProcessorRef.current.stop();
      krispProcessorRef.current = null;
    }
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.closeAll();
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (localAudioStream) {
      localAudioStream.getAudioTracks().forEach((t) => {
        t.enabled = !newMuted;
      });
    }
    if (socket) {
      socket.emit('update-voice-status', { isMuted: newMuted });
    }
  };

  // Toggle Deafen
  const toggleDeafen = () => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    if (socket) {
      socket.emit('update-voice-status', { isDeafened: newDeafened });
    }
  };

  // Screen Share
  const startScreenShare = async (sourceId = null) => {
    try {
      let stream;
      if (window.electronAPI?.isElectron && sourceId) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              minWidth: 1280,
              maxWidth: 1920,
              minHeight: 720,
              maxHeight: 1080,
              minFrameRate: 30,
              maxFrameRate: 60
            }
          }
        });
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 60, max: 60 }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: true
        });
      }

      setLocalScreenStream(stream);
      setIsScreenSharing(true);

      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.setLocalScreenStream(stream);
      }

      if (socket) {
        socket.emit('update-voice-status', { isScreenSharing: true });
      }

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn('Screen share error:', err);
    }
  };

  const stopScreenShare = () => {
    if (localScreenStream) {
      localScreenStream.getTracks().forEach((t) => t.stop());
      setLocalScreenStream(null);
    }
    setIsScreenSharing(false);

    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.setLocalScreenStream(null);
    }

    if (socket) {
      socket.emit('update-voice-status', { isScreenSharing: false });
    }
  };

  // Music Bot actions
  const sendMusicControl = (action, query = '', volume = 70) => {
    if (!socket || !activeVoiceChannel) return;
    socket.emit('music-control', {
      action,
      channelId: activeVoiceChannel,
      query,
      volume
    });
  };

  return (
    <VoiceContext.Provider
      value={{
        activeVoiceChannel,
        usersInVoice,
        isMuted,
        isDeafened,
        isScreenSharing,
        isSpeaking,
        speakingUsers,
        localAudioStream,
        localScreenStream,
        remoteStreams,
        musicPlayer,
        krispEnabled,
        setKrispEnabled,
        micSensitivity,
        setMicSensitivity,
        micGain,
        setMicGain,
        micLiveLevel,
        isGateOpen,
        userVolumes,
        setUserVolume,
        joinVoiceChannel,
        leaveVoiceChannel,
        toggleMute,
        toggleDeafen,
        startScreenShare,
        stopScreenShare,
        sendMusicControl
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => useContext(VoiceContext);
