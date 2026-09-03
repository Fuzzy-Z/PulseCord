import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useVoice } from '../context/VoiceContext';

const RemoteAudioPlayer = ({ socketId, stream, volumeMultiplier, outputDevice, isDeafened, isUserMuted }) => {
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const destinationNodeRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx({ latencyHint: 'interactive' });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      // Cleanup previous source node if stream changed
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (e) {}
      }

      // 1. Create MediaStream source
      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // 2. Hardware-level Gain Node (supports 0.0x up to 4.0x / 400% volume amplification)
      if (!gainNodeRef.current) {
        gainNodeRef.current = ctx.createGain();
      }
      const gainNode = gainNodeRef.current;

      // 3. Studio Limiter / Dynamics Compressor to prevent clipping distortion when boosted
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-2, ctx.currentTime);
      limiter.knee.setValueAtTime(10, ctx.currentTime);
      limiter.ratio.setValueAtTime(20, ctx.currentTime);
      limiter.attack.setValueAtTime(0.001, ctx.currentTime);
      limiter.release.setValueAtTime(0.05, ctx.currentTime);

      // 4. Destination for HTML Audio element playback (allows setSinkId support)
      if (!destinationNodeRef.current) {
        destinationNodeRef.current = ctx.createMediaStreamDestination();
      }
      const dest = destinationNodeRef.current;

      source.connect(gainNode);
      gainNode.connect(limiter);
      limiter.connect(dest);

      const audio = audioRef.current;
      if (audio) {
        audio.srcObject = dest.stream;
        audio.play().catch((err) => {
          console.warn(`[WebRTC Audio Play ${socketId}]`, err.message);
        });
      }
    } catch (err) {
      console.warn(`[RemoteAudioPlayer] Web Audio graph init error for ${socketId}:`, err);
      // Fallback direct stream assignment
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioRef.current.play().catch(() => {});
      }
    }

    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (e) {}
      }
    };
  }, [stream, socketId]);

  // Dynamically update gain node in real-time
  useEffect(() => {
    const effectiveMuted = isDeafened || isUserMuted;
    const targetGain = effectiveMuted ? 0 : Math.max(0, volumeMultiplier);

    if (gainNodeRef.current && audioContextRef.current && audioContextRef.current.state !== 'closed') {
      gainNodeRef.current.gain.setTargetAtTime(targetGain, audioContextRef.current.currentTime, 0.03);
    }

    if (audioRef.current) {
      audioRef.current.muted = effectiveMuted;
    }
  }, [volumeMultiplier, isDeafened, isUserMuted]);

  // Output device selection (setSinkId)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (outputDevice && outputDevice !== 'default' && audio.setSinkId) {
      audio.setSinkId(outputDevice).catch(() => {});
    } else if (audio.setSinkId) {
      audio.setSinkId('').catch(() => {});
    }
  }, [outputDevice]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return <audio ref={audioRef} autoPlay playsInline />;
};

export const GlobalAudioEngine = () => {
  const {
    remoteStreams,
    musicPlayer,
    localMusicVolume,
    isDeafened,
    userVolumes,
    userMutes,
    usersInVoice,
    selectedOutputDevice,
    activeVoiceChannel,
    sendMusicControl
  } = useVoice();

  const musicAudioRef = useRef(null);
  const hlsRef = useRef(null);
  const lastLoadedUrlRef = useRef(null);

  // 1. Music Bot Audio Engine
  useEffect(() => {
    const audio = musicAudioRef.current;
    if (!audio) return;

    if (selectedOutputDevice && selectedOutputDevice !== 'default' && audio.setSinkId) {
      audio.setSinkId(selectedOutputDevice).catch(() => {});
    }

    const currentUrl = musicPlayer.currentTrack?.url;
    const shouldPlay = musicPlayer.isPlaying && !!currentUrl && !!activeVoiceChannel && !isDeafened;

    const effectiveVol = localMusicVolume !== undefined ? localMusicVolume : (musicPlayer.volume !== undefined ? musicPlayer.volume : 70);
    const vol = isDeafened ? 0 : Math.max(0, Math.min(1, effectiveVol / 100));

    audio.volume = vol;

    if (shouldPlay) {
      const isHls = currentUrl.includes('.m3u8') || currentUrl.includes('sndcdn.com/playlist');

      if (isHls && Hls.isSupported()) {
        if (!hlsRef.current || lastLoadedUrlRef.current !== currentUrl) {
          if (hlsRef.current) hlsRef.current.destroy();
          hlsRef.current = new Hls({ enableWorker: true, lowLatencyMode: true });
          hlsRef.current.attachMedia(audio);
          hlsRef.current.loadSource(currentUrl);
          lastLoadedUrlRef.current = currentUrl;
          hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
            audio.play().catch((err) => console.warn('[MusicEngine] HLS play:', err.message));
          });
        } else {
          audio.play().catch((err) => console.warn('[MusicEngine] HLS resume:', err.message));
        }
      } else {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        if (audio.src !== currentUrl) {
          audio.src = currentUrl;
          lastLoadedUrlRef.current = currentUrl;
        }
        audio.play().catch((err) => console.warn('[MusicEngine] Audio play:', err.message));
      }
    } else {
      audio.pause();
      if (!currentUrl) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        audio.src = '';
        lastLoadedUrlRef.current = null;
      }
    }

    const handleEnded = () => {
      if (musicPlayer.queue && musicPlayer.queue.length > 0) {
        sendMusicControl('skip');
      }
    };

    const handleError = () => {
      if (shouldPlay && currentUrl && !currentUrl.includes('.mp3')) {
        setTimeout(() => {
          if (audio && shouldPlay) {
            audio.load();
            audio.play().catch(() => {});
          }
        }, 2000);
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [musicPlayer.isPlaying, musicPlayer.currentTrack?.url, localMusicVolume, musicPlayer.volume, activeVoiceChannel, isDeafened, selectedOutputDevice, musicPlayer.queue]);

  return (
    <div id="pulsecord-global-audio-engine" style={{ display: 'none', position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
      {/* 1. Music Bot Global Audio Element */}
      <audio ref={musicAudioRef} autoPlay playsInline crossOrigin="anonymous" />

      {/* 2. WebRTC Peer Incoming Voice Audio Elements with Web Audio Gain Nodes (0% to 400%) */}
      {Object.entries(remoteStreams).map(([socketId, streams]) => {
        if (!streams.audioStream) return null;

        const peerUser = usersInVoice.find((u) => u.socketId === socketId);
        const userVol = peerUser && userVolumes[peerUser.id] !== undefined ? userVolumes[peerUser.id] : 100;
        const isUserMuted = peerUser ? Boolean(userMutes[peerUser.id]) : false;

        // Convert percentage into true Web Audio multiplier (e.g., 200% -> 2.0x, 150% -> 1.5x, 100% -> 1.0x)
        const volumeMultiplier = isDeafened ? 0 : Math.max(0, userVol / 100);

        return (
          <RemoteAudioPlayer
            key={socketId}
            socketId={socketId}
            stream={streams.audioStream}
            volumeMultiplier={volumeMultiplier}
            outputDevice={selectedOutputDevice}
            isDeafened={isDeafened}
            isUserMuted={isUserMuted}
          />
        );
      })}
    </div>
  );
};
