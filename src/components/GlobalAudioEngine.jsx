import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useVoice } from '../context/VoiceContext';

export const GlobalAudioEngine = () => {
  const {
    remoteStreams,
    musicPlayer,
    isDeafened,
    userVolumes,
    usersInVoice,
    selectedOutputDevice,
    activeVoiceChannel
  } = useVoice();

  const musicAudioRef = useRef(null);
  const hlsRef = useRef(null);
  const remoteAudioRefs = useRef({});

  // 1. Music Bot Audio Engine (Supports HLS .m3u8 from SoundCloud, MP3, AAC, and radio streams)
  useEffect(() => {
    const audio = musicAudioRef.current;
    if (!audio) return;

    if (selectedOutputDevice && selectedOutputDevice !== 'default' && audio.setSinkId) {
      audio.setSinkId(selectedOutputDevice).catch(() => {});
    }

    const currentUrl = musicPlayer.currentTrack?.url;
    const shouldPlay = musicPlayer.isPlaying && !!currentUrl && !!activeVoiceChannel && !isDeafened;
    const vol = isDeafened ? 0 : Math.max(0, Math.min(1, (musicPlayer.volume || 70) / 100));

    audio.volume = vol;

    if (shouldPlay) {
      const isHls = currentUrl.includes('.m3u8') || currentUrl.includes('sndcdn.com/playlist');

      if (isHls && Hls.isSupported()) {
        if (!hlsRef.current) {
          hlsRef.current = new Hls({ enableWorker: true, lowLatencyMode: true });
          hlsRef.current.attachMedia(audio);
        }
        hlsRef.current.loadSource(currentUrl);
        hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
          audio.play().catch((err) => console.warn('[MusicEngine] HLS play:', err.message));
        });
      } else {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        if (audio.src !== currentUrl) {
          audio.src = currentUrl;
        }
        audio.play().catch((err) => console.warn('[MusicEngine] Audio play:', err.message));
      }
    } else {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      audio.pause();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [musicPlayer.isPlaying, musicPlayer.currentTrack?.url, musicPlayer.volume, activeVoiceChannel, isDeafened, selectedOutputDevice]);

  // Clean unmounted peer audio references
  useEffect(() => {
    Object.keys(remoteAudioRefs.current).forEach((socketId) => {
      if (!remoteStreams[socketId]?.audioStream) {
        const el = remoteAudioRefs.current[socketId];
        if (el) {
          el.srcObject = null;
          el.pause();
        }
        delete remoteAudioRefs.current[socketId];
      }
    });
  }, [remoteStreams]);

  return (
    <div id="pulsecord-global-audio-engine" style={{ display: 'none', position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
      {/* 1. Music Bot Global Audio Element */}
      <audio ref={musicAudioRef} autoPlay playsInline crossOrigin="anonymous" />

      {/* 2. WebRTC Peer Incoming Voice Audio Elements */}
      {Object.entries(remoteStreams).map(([socketId, streams]) => {
        if (!streams.audioStream) return null;

        const peerUser = usersInVoice.find((u) => u.socketId === socketId);
        const userVol = peerUser && userVolumes[peerUser.id] !== undefined ? userVolumes[peerUser.id] : 100;
        const finalVolume = isDeafened ? 0 : Math.max(0, Math.min(1, userVol / 100));

        return (
          <audio
            key={socketId}
            autoPlay
            playsInline
            ref={(el) => {
              if (el) {
                remoteAudioRefs.current[socketId] = el;
                if (el.srcObject !== streams.audioStream) {
                  el.srcObject = streams.audioStream;
                }
                el.volume = finalVolume;
                if (selectedOutputDevice && selectedOutputDevice !== 'default' && el.setSinkId) {
                  el.setSinkId(selectedOutputDevice).catch(() => {});
                }
                el.play().catch((err) => {
                  console.warn(`[WebRTC Audio Play ${socketId}]`, err.message);
                });
              }
            }}
          />
        );
      })}
    </div>
  );
};
