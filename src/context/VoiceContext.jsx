import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSocket } from './SocketContext';
import { WebRTCManager } from '../services/webrtc';
import { KrispAudioProcessor, CleanScreenAudioProcessor } from '../services/audioUtils';
import { soundFX } from '../services/soundEffects';

const VoiceContext = createContext(null);

export const VoiceProvider = ({ children }) => {
  const { socket, currentUser } = useSocket();

  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null);
  const [activeServerId, setActiveServerId] = useState(null);
  const [usersInVoice, setUsersInVoice] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState(new Set());

  // Watch Together & Listen Together
  const [watchTogetherState, setWatchTogetherState] = useState({
    isActive: false,
    url: '',
    isPlaying: false,
    currentTime: 0,
    queue: [],
    participants: [],
    hostId: null
  });
  const [listenTogetherPeer, setListenTogetherPeer] = useState(null);

  // Audio Device Selection
  const [inputDevices, setInputDevices] = useState([]);
  const [outputDevices, setOutputDevices] = useState([]);
  const [selectedInputDevice, setSelectedInputDeviceState] = useState(() => {
    return localStorage.getItem('pulsecord_input_device') || 'default';
  });
  const [selectedOutputDevice, setSelectedOutputDeviceState] = useState(() => {
    return localStorage.getItem('pulsecord_output_device') || 'default';
  });

  // Krisp Noise Suppression & Sensitivity settings
  const [krispEnabled, setKrispEnabledState] = useState(() => {
    const saved = localStorage.getItem('pulsecord_krisp_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [micSensitivity, setMicSensitivityState] = useState(() => {
    const saved = localStorage.getItem('pulsecord_mic_sensitivity');
    return saved !== null ? Number(saved) : 25;
  });
  const [micGain, setMicGainState] = useState(() => {
    const saved = localStorage.getItem('pulsecord_mic_gain');
    return saved !== null ? Number(saved) : 100;
  });

  // Per-User Friend Volume Sliders (0% to 200%)
  const [userVolumes, setUserVolumes] = useState(() => {
    try {
      const saved = localStorage.getItem('pulsecord_user_volumes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Per-User Mute & Deafen settings (Persisted)
  const [userMutes, setUserMutes] = useState(() => {
    try {
      const saved = localStorage.getItem('pulsecord_user_mutes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [userDeafens, setUserDeafens] = useState(() => {
    try {
      const saved = localStorage.getItem('pulsecord_user_deafens');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Streams
  const [localAudioStream, setLocalAudioStream] = useState(null);
  const [localScreenStream, setLocalScreenStream] = useState(null);
  const [isScreenAudioEnabled, setIsScreenAudioEnabled] = useState(false);
  // Map of socketId -> { audioStream, videoStream }
  const [remoteStreams, setRemoteStreams] = useState({});

  // Music Bot Player State
  const [musicPlayer, setMusicPlayer] = useState({
    isPlaying: false,
    currentTrack: null,
    queue: [],
    volume: 70
  });

  // Local Music Volume (Personal to this user, doesn't affect others)
  const [localMusicVolume, setLocalMusicVolumeState] = useState(() => {
    const saved = localStorage.getItem('pulsecord_local_music_volume');
    return saved !== null ? Number(saved) : 70;
  });

  const setLocalMusicVolume = (vol) => {
    const clamped = Math.max(0, Math.min(100, vol));
    setLocalMusicVolumeState(clamped);
    localStorage.setItem('pulsecord_local_music_volume', String(clamped));
  };

  const webrtcManagerRef = useRef(null);
  const krispProcessorRef = useRef(null);
  const screenAudioProcessorRef = useRef(null);
  const musicAudioRef = useRef(null);
  const remoteAudioElementsRef = useRef(new Map()); // socketId -> HTMLAudioElement
  const remoteStreamsRef = useRef({});

  useEffect(() => {
    remoteStreamsRef.current = remoteStreams;
  }, [remoteStreams]);

  // Refresh audio input & output devices
  const refreshAudioDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((d) => d.kind === 'audioinput');
      const outputs = devices.filter((d) => d.kind === 'audiooutput');
      setInputDevices(inputs);
      setOutputDevices(outputs);
    } catch (err) {
      console.warn('[AudioDevices] Error enumerating devices:', err);
    }
  };

  useEffect(() => {
    refreshAudioDevices();
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshAudioDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshAudioDevices);
      };
    }
  }, []);

  const setInputDevice = async (deviceId) => {
    setSelectedInputDeviceState(deviceId);
    localStorage.setItem('pulsecord_input_device', deviceId);

    // If currently connected in voice, switch microphone live
    if (activeVoiceChannel) {
      try {
        const audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          ...(deviceId && deviceId !== 'default' ? { deviceId: { exact: deviceId } } : {})
        };
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
        
        if (localAudioStream) {
          localAudioStream.getTracks().forEach((t) => t.stop());
        }
        setLocalAudioStream(newStream);

        if (krispProcessorRef.current) {
          krispProcessorRef.current.stop();
        }

        const processor = new KrispAudioProcessor(newStream, {
          sensitivity: micSensitivity,
          inputGain: micGain / 100,
          krispEnabled,
          onSpeakingChange: (speaking) => {
            setIsSpeaking(speaking);
            if (socket) socket.emit('speaking-state', { isSpeaking: speaking });
          }
        });
        krispProcessorRef.current = processor;

        const processedStream = processor.getProcessedStream();
        if (webrtcManagerRef.current) {
          webrtcManagerRef.current.setLocalAudioStream(processedStream);
        }
      } catch (err) {
        console.error('[Voice] Error switching microphone:', err);
      }
    }
  };

  const setOutputDevice = async (deviceId) => {
    setSelectedOutputDeviceState(deviceId);
    localStorage.setItem('pulsecord_output_device', deviceId);

    // Apply sinkId to all remote audio elements
    remoteAudioElementsRef.current.forEach((audioEl) => {
      if (audioEl.setSinkId && deviceId && deviceId !== 'default') {
        audioEl.setSinkId(deviceId).catch(console.warn);
      } else if (audioEl.setSinkId) {
        audioEl.setSinkId('').catch(console.warn);
      }
    });

    if (musicAudioRef.current && musicAudioRef.current.setSinkId) {
      if (deviceId && deviceId !== 'default') {
        musicAudioRef.current.setSinkId(deviceId).catch(console.warn);
      } else {
        musicAudioRef.current.setSinkId('').catch(console.warn);
      }
    }
  };

  // Helper setters that persist to localStorage
  const setKrispEnabled = (val) => {
    setKrispEnabledState(val);
    localStorage.setItem('pulsecord_krisp_enabled', val);
    if (krispProcessorRef.current) {
      krispProcessorRef.current.setKrispEnabled(val);
    }
    
    // Switch stream live if in voice channel
    if (webrtcManagerRef.current && localAudioStream) {
      const streamToUse = val && krispProcessorRef.current 
        ? krispProcessorRef.current.getProcessedStream() 
        : localAudioStream;
      webrtcManagerRef.current.setLocalAudioStream(streamToUse);
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

      // Update active audio element volume
      usersInVoice.forEach((u) => {
        if (u.id === userId && u.socketId) {
          const audioEl = remoteAudioElementsRef.current.get(u.socketId);
          if (audioEl) {
            audioEl.volume = isDeafened ? 0 : Math.min(1, volume / 100);
          }
        }
      });

      return updated;
    });
  };

  const toggleUserMute = (userId) => {
    if (!userId) return;
    setUserMutes((prev) => {
      const isCurrentlyMuted = !!prev[userId];
      const nextMuted = !isCurrentlyMuted;
      const updated = { ...prev, [userId]: nextMuted };
      localStorage.setItem('pulsecord_user_mutes', JSON.stringify(updated));

      // Mute active HTMLAudioElement for this user
      usersInVoice.forEach((u) => {
        if (u.id === userId && u.socketId) {
          const audioEl = remoteAudioElementsRef.current.get(u.socketId);
          if (audioEl) {
            audioEl.muted = nextMuted;
          }
        }
      });

      return updated;
    });
  };

  const toggleUserDeafen = (userId) => {
    if (!userId) return;
    setUserDeafens((prev) => {
      const nextDeafened = !prev[userId];
      const updated = { ...prev, [userId]: nextDeafened };
      localStorage.setItem('pulsecord_user_deafens', JSON.stringify(updated));
      return updated;
    });
  };

  const isUserMuted = (userId) => !!userMutes[userId];
  const isUserDeafened = (userId) => !!userDeafens[userId];

  // Manage Remote Audio Playback Globally (Handled by GlobalAudioEngine)
  
  const activeVoiceChannelRef = useRef(activeVoiceChannel);
  useEffect(() => {
    activeVoiceChannelRef.current = activeVoiceChannel;
  }, [activeVoiceChannel]);

  // Initialize WebRTC Manager
  useEffect(() => {
    if (!socket) return;

    const manager = new WebRTCManager(socket, {
      onRemoteStream: (peerSocketId, stream, kind) => {
        setRemoteStreams((prev) => {
          const current = prev[peerSocketId] || {};
          if (!stream) {
            if (kind === 'video') {
              const updated = { ...current };
              delete updated.videoStream;
              delete updated.screenAudioStream;
              return { ...prev, [peerSocketId]: updated };
            }
            return prev;
          }
          const clonedStream = new MediaStream(stream.getTracks());
          if (kind === 'video') {
            return { ...prev, [peerSocketId]: { ...current, videoStream: clonedStream } };
          } else if (kind === 'screenAudio') {
            return { ...prev, [peerSocketId]: { ...current, screenAudioStream: clonedStream } };
          } else {
            // Pure microphone audio stream - NEVER overwritten by screen share!
            return { ...prev, [peerSocketId]: { ...current, audioStream: clonedStream } };
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
      if (channelId === activeVoiceChannelRef.current) {
        soundFX.play('user-join');
        setUsersInVoice((prev) => {
          if (!prev.some((u) => u.id === user.id)) {
            return [...prev, user];
          }
          return prev;
        });
        // The newly joined user will initiate the WebRTC offer to existing peers
        if (manager) {
          manager.createPeerConnection(user.socketId, false);
        }
      }
    });

    socket.on('user-left-voice', ({ socketId, userId, channelId }) => {
      soundFX.play('user-leave');
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
      if (user.isScreenSharing === false && user.socketId) {
        setRemoteStreams((prev) => {
          if (!prev[user.socketId]) return prev;
          const updated = { ...prev };
          const peer = { ...updated[user.socketId] };
          delete peer.videoStream;
          delete peer.screenAudioStream;
          updated[user.socketId] = peer;
          return updated;
        });
      }
    });

    socket.on('music-state-update', ({ channelId, player }) => {
      if (channelId === activeVoiceChannelRef.current) {
        setMusicPlayer(player);
      }
    });

    socket.on('watch-together-state-update', ({ channelId, state }) => {
      if (channelId === activeVoiceChannelRef.current) {
        setWatchTogetherState((prev) => ({ ...prev, ...state }));
      }
    });

    socket.on('moved-to-voice-channel', ({ channelId, serverId }) => {
      soundFX.play('user-join');
      joinVoiceChannel(channelId, serverId);
    });

    socket.on('force-disconnected-from-voice', () => {
      soundFX.play('user-leave');
      leaveVoiceChannel();
    });

    return () => {
      if (manager) {
        manager.closeAll();
      }
      socket.off('user-joined-voice');
      socket.off('user-left-voice');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('user-speaking');
      socket.off('user-voice-status-updated');
      socket.off('music-state-update');
      socket.off('watch-together-state-update');
      socket.off('moved-to-voice-channel');
      socket.off('force-disconnected-from-voice');
    };
  }, [socket]);

  // Synchronized Music Bot Audio Player Element
  useEffect(() => {
    if (!musicAudioRef.current) {
      musicAudioRef.current = new Audio();
    }
    const audio = musicAudioRef.current;

    if (selectedOutputDevice && selectedOutputDevice !== 'default' && audio.setSinkId) {
      audio.setSinkId(selectedOutputDevice).catch(console.warn);
    }

    if (musicPlayer.isPlaying && musicPlayer.currentTrack?.url && activeVoiceChannel && !isDeafened) {
      if (audio.src !== musicPlayer.currentTrack.url) {
        audio.src = musicPlayer.currentTrack.url;
      }
      audio.volume = (musicPlayer.volume || 70) / 100;
      audio.play().catch((e) => console.warn('Music play restriction:', e));
    } else {
      audio.pause();
    }
  }, [musicPlayer, activeVoiceChannel, isDeafened, selectedOutputDevice]);

  // Handle Join Voice Channel with Audio Device Selection & Krisp Filter
  const joinVoiceChannel = async (channelId, serverId) => {
    if (!socket) return;
    if (activeVoiceChannel === channelId) return;

    try {
      await refreshAudioDevices();

      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        ...(selectedInputDevice && selectedInputDevice !== 'default'
          ? { deviceId: { exact: selectedInputDevice } }
          : {})
      };

      // 1. Acquire Local Audio
      const rawMicStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false
      });

      setLocalAudioStream(rawMicStream);

      // 2. Initialize Krisp Audio Processor
      if (krispProcessorRef.current) {
        krispProcessorRef.current.stop();
      }

      const processor = new KrispAudioProcessor(rawMicStream, {
        sensitivity: micSensitivity,
        inputGain: micGain / 100,
        krispEnabled,
        onSpeakingChange: (speaking) => {
          setIsSpeaking(speaking);
          socket.emit('speaking-state', { isSpeaking: speaking });
        }
      });
      krispProcessorRef.current = processor;

      // 3. Feed stream to WebRTC (Bypass processor completely if Krisp is disabled)
      const streamToUse = krispEnabled ? processor.getProcessedStream() : rawMicStream;
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.setLocalAudioStream(streamToUse);
      }

      // 4. Notify Socket Server
      socket.emit('join-voice', { channelId, serverId }, (response) => {
        if (response && response.success) {
          soundFX.play('join');
          setActiveVoiceChannel(channelId);
          setActiveServerId(serverId);
          setUsersInVoice(response.usersInRoom || []);
          if (response.musicPlayer) {
            setMusicPlayer(response.musicPlayer);
          }
          if (response.watchTogether) {
            setWatchTogetherState(response.watchTogether);
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
          soundFX.play('join');
          setActiveVoiceChannel(channelId);
          setActiveServerId(serverId);
          setUsersInVoice(response.usersInRoom || []);
          if (response.watchTogether) {
            setWatchTogetherState(response.watchTogether);
          }
        }
      });
    }
  };

  // Handle Leave Voice Channel
  const leaveVoiceChannel = () => {
    if (!socket) return;

    soundFX.play('leave');
    socket.emit('leave-voice');
    setActiveVoiceChannel(null);
    setActiveServerId(null);
    setUsersInVoice([]);
    setSpeakingUsers(new Set());
    setRemoteStreams({});

    remoteAudioElementsRef.current.forEach((audioEl) => {
      audioEl.srcObject = null;
      audioEl.pause();
    });
    remoteAudioElementsRef.current.clear();

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
    soundFX.play(newMuted ? 'mute' : 'unmute');
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
    soundFX.play(newDeafened ? 'deafen' : 'undeafen');
    remoteAudioElementsRef.current.forEach((audioEl) => {
      audioEl.volume = newDeafened ? 0 : 1.0;
    });
    if (socket) {
      socket.emit('update-voice-status', { isDeafened: newDeafened });
    }
  };

  // Screen Share
  const startScreenShare = async (sourceId = null, options = { resolution: '1080p', frameRate: 60, shareAudio: false }) => {
    try {
      let stream;
      
      const targetWidth = options.resolution === '1080p' ? 1920 : 1280;
      const targetHeight = options.resolution === '1080p' ? 1080 : 720;
      const targetFps = options.frameRate || 60;
      const shouldCaptureAudio = options.shareAudio === true;

      if (window.electronAPI?.isElectron && sourceId) {
        if (shouldCaptureAudio) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                }
              },
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: sourceId,
                  minWidth: 1280,
                  maxWidth: targetWidth,
                  minHeight: 720,
                  maxHeight: targetHeight,
                  minFrameRate: 30,
                  maxFrameRate: targetFps
                }
              }
            });
          } catch (e) {
            console.warn('Failed to capture desktop audio in Electron, falling back to video only:', e);
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: sourceId,
                  minWidth: 1280,
                  maxWidth: targetWidth,
                  minHeight: 720,
                  maxHeight: targetHeight,
                  minFrameRate: 30,
                  maxFrameRate: targetFps
                }
              }
            });
          }
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sourceId,
                minWidth: 1280,
                maxWidth: targetWidth,
                minHeight: 720,
                maxHeight: targetHeight,
                minFrameRate: 30,
                maxFrameRate: targetFps
              }
            }
          });
        }
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: targetFps, max: targetFps }, width: { ideal: targetWidth }, height: { ideal: targetHeight } },
          audio: shouldCaptureAudio ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
            suppressLocalAudioPlayback: true
          } : false
        });
      }

      const hasAudio = stream.getAudioTracks().length > 0;
      setIsScreenAudioEnabled(shouldCaptureAudio && hasAudio);

      // Automated Software-Level Audio Cleaner for Screen Sharing
      let streamToTransmit = stream;
      if (shouldCaptureAudio && hasAudio) {
        if (screenAudioProcessorRef.current) {
          screenAudioProcessorRef.current.stop();
        }
        const cleaner = new CleanScreenAudioProcessor(stream, () => remoteStreamsRef.current);
        screenAudioProcessorRef.current = cleaner;
        streamToTransmit = cleaner.getCleanStream();
      }

      setLocalScreenStream(streamToTransmit);
      setIsScreenSharing(true);
      soundFX.play('screen-on');

      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.setLocalScreenStream(streamToTransmit);
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

  const toggleScreenShareAudio = () => {
    if (!localScreenStream) return;
    const audioTracks = localScreenStream.getAudioTracks();
    if (audioTracks.length === 0) return;
    
    const newState = !isScreenAudioEnabled;
    audioTracks.forEach(t => { t.enabled = newState; });
    setIsScreenAudioEnabled(newState);
  };

  const stopScreenShare = () => {
    if (screenAudioProcessorRef.current) {
      screenAudioProcessorRef.current.stop();
      screenAudioProcessorRef.current = null;
    }
    if (localScreenStream) {
      localScreenStream.getTracks().forEach((t) => t.stop());
      setLocalScreenStream(null);
    }
    setIsScreenSharing(false);
    setIsScreenAudioEnabled(false);
    soundFX.play('screen-off');

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

  const dispatchWatchTogether = (action, payload = {}) => {
    if (!socket || !activeVoiceChannel) return;
    socket.emit('watch-together-action', { channelId: activeVoiceChannel, action, payload });
  };

  const moveVoiceUser = (targetUserId, targetChannelId, serverId) => {
    if (!socket || !targetUserId || !targetChannelId) return;
    socket.emit('move-voice-user', { targetUserId, targetChannelId, serverId });
  };

  const disconnectVoiceUser = (targetUserId, serverId) => {
    if (!socket || !targetUserId) return;
    socket.emit('disconnect-voice-user', { targetUserId, serverId });
  };

  return (
    <VoiceContext.Provider
      value={{
        activeVoiceChannel,
        activeServerId,
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
        localMusicVolume,
        setLocalMusicVolume,
        krispEnabled,
        setKrispEnabled,
        micSensitivity,
        setMicSensitivity,
        micGain,
        setMicGain,
        userVolumes,
        setUserVolume,
        inputDevices,
        outputDevices,
        selectedInputDevice,
        selectedOutputDevice,
        setInputDevice,
        setOutputDevice,
        refreshAudioDevices,
        joinVoiceChannel,
        leaveVoiceChannel,
        toggleMute,
        toggleDeafen,
        startScreenShare,
        stopScreenShare,
        isScreenAudioEnabled,
        toggleScreenShareAudio,
        sendMusicControl,
        watchTogetherState,
        setWatchTogetherState,
        dispatchWatchTogether,
        moveVoiceUser,
        disconnectVoiceUser,
        userMutes,
        userDeafens,
        toggleUserMute,
        toggleUserDeafen,
        isUserMuted,
        isUserDeafened
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => useContext(VoiceContext);
