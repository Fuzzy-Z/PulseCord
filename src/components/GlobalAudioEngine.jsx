import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useVoice } from '../context/VoiceContext';

const RemoteAudioPlayer = ({ socketId, stream, volume, outputDevice, isDeafened, isUserMuted }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !stream) return;

    if (audio.srcObject !== stream) {
      audio.srcObject = stream;
    }

    const effectiveMuted = isDeafened || isUserMuted;
    audio.muted = effectiveMuted;
    audio.volume = effectiveMuted ? 0 : Math.max(0, Math.min(1, volume));

    if (outputDevice && outputDevice !== 'default' && audio.setSinkId) {
      audio.setSinkId(outputDevice).catch(() => {});
    } else if (audio.setSinkId) {
      audio.setSinkId('').catch(() => {});
    }

    audio.play().catch((err) => {
      console.warn(`[WebRTC Audio Play ${socketId}]`, err.message);
    });
  }, [stream, volume, outputDevice, socketId, isDeafened, isUserMuted]);

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
    
    // Fix: Use localMusicVolume and ensure 0% is strictly 0.0 (not fallback to 70)
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
          // Just resume playing without destroying HLS instance
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
      // Pause playback without destroying current stream so it resumes from same position
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
      // Auto-reconnect for live streams on brief network hiccups
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

      {/* 2. WebRTC Peer Incoming Voice Audio Elements */}
      {Object.entries(remoteStreams).map(([socketId, streams]) => {
        if (!streams.audioStream) return null;

        const peerUser = usersInVoice.find((u) => u.socketId === socketId);
        const userVol = peerUser && userVolumes[peerUser.id] !== undefined ? userVolumes[peerUser.id] : 100;
        const isUserMuted = peerUser ? Boolean(userMutes[peerUser.id]) : false;
        // Allows up to 2.0 (200% volume amplification)
        const finalVolume = isDeafened ? 0 : Math.max(0, userVol / 100);

        return (
          <RemoteAudioPlayer
            key={socketId}
            socketId={socketId}
            stream={streams.audioStream}
            volume={finalVolume}
            outputDevice={selectedOutputDevice}
            isDeafened={isDeafened}
            isUserMuted={isUserMuted}
          />
        );
      })}
    </div>
  );
};
