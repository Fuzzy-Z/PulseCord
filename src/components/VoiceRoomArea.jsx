import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactPlayer from 'react-player';
import Swal from 'sweetalert2';
import {
  Mic,
  MicOff,
  Headphones,
  Tv,
  PhoneOff,
  Disc3,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  Square,
  Radio,
  Eye,
  Grid,
  MonitorPlay,
  PhoneCall,
  Users,
  Loader2,
  Music,
  Link,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useVoice } from '../context/VoiceContext';
import { useServer } from '../context/ServerContext';
import { useSocket } from '../context/SocketContext';

import { UserProfileCard } from './UserProfileCard';
import { UserContextMenu } from './UserContextMenu';
import { AudioVisualizerCanvas } from './AudioVisualizerCanvas';
import { AvatarImage } from './AvatarImage';

export const VoiceRoomArea = () => {
  const {
    activeVoiceChannel,
    usersInVoice,
    isMuted,
    isDeafened,
    isSpeaking,
    speakingUsers,
    localScreenStream,
    remoteStreams,
    musicPlayer,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    isScreenAudioEnabled,
    toggleScreenShareAudio,
    sendMusicControl,
    userVolumes,
    setUserVolume,
    watchTogetherState,
    dispatchWatchTogether
  } = useVoice();

  const { currentServer, currentChannel, voiceRooms, setIsMusicModalOpen, setIsScreenModalOpen } = useServer();
  const { currentUser } = useSocket();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const theaterContainerRef = useRef(null);

  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [contextMenuUser, setContextMenuUser] = useState(null);
  const [watchingPeerId, setWatchingPeerId] = useState(null);
  const [localScreenPinned, setLocalScreenPinned] = useState(true);

  // Auto-pin local screen when sharing starts
  useEffect(() => {
    if (isScreenSharing) {
      setLocalScreenPinned(true);
      setWatchingPeerId(null);
    }
  }, [isScreenSharing]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  const toggleFullscreen = (targetState) => {
    setIsFullscreen((prev) => (typeof targetState === 'boolean' ? targetState : !prev));
  };

  const [ytInput, setYtInput] = useState('');
  const [ytVolume, setYtVolume] = useState(0.5);
  const [screenVolume, setScreenVolume] = useState(0.8);
  const ytPlayerRef = useRef(null);

  const handleYoutubeSubmit = (e) => {
    e.preventDefault();
    if (!ytInput.trim()) return;

    let videoId = ytInput.trim();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\/shorts\/)([^#&?]*).*/;
    const match = ytInput.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    } else if (videoId.length !== 11) {
      Swal.fire({
        title: 'Link Inválido',
        text: 'Por favor, insira um link válido do YouTube.',
        icon: 'error',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        background: 'var(--color-bg-base)',
        color: 'var(--color-text-main)',
        customClass: {
          popup: 'border border-sys-border rounded-2xl shadow-2xl',
          title: 'font-bold tracking-tight',
          htmlContainer: 'text-sys-muted text-sm',
          confirmButton: 'bg-sys-accent hover:opacity-80 text-white px-6 py-2.5 rounded-xl font-bold transition mt-4'
        }
      });
      return;
    }

    if (videoId) {
      if (watchTogetherState.isActive) {
        dispatchWatchTogether('enqueue', { url: videoId });
      } else {
        dispatchWatchTogether('start', { url: videoId });
      }
      setYtInput('');
    }
  };

  // Is user actively connected to THIS voice channel
  const isConnectedToThisRoom = activeVoiceChannel === currentChannel?.id;

  // Remote screen shares (Only keep active streams with live video tracks from users in voice)
  const activeRemoteScreenShares = Object.entries(remoteStreams).filter(
    ([socketId, streams]) => {
      const v = streams.videoStream;
      const isPeerInVoice = usersInVoice.some((u) => u.socketId === socketId);
      return isPeerInVoice && v && v.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled !== false);
    }
  );

  // Attach local screen video stream
  useEffect(() => {
    if (localVideoRef.current && localScreenStream) {
      localVideoRef.current.srcObject = localScreenStream;
    }
  }, [localScreenStream]);

  // Clear watchingPeerId if that user is no longer sharing screen or left voice
  useEffect(() => {
    if (watchingPeerId) {
      const isStillSharing = activeRemoteScreenShares.some(([socketId]) => socketId === watchingPeerId);
      if (!isStillSharing || !isConnectedToThisRoom) {
        setWatchingPeerId(null);
      }
    }
  }, [watchingPeerId, activeRemoteScreenShares, isConnectedToThisRoom]);

  // Attach remote screen video stream (Combines screen video + screen audio)
  useEffect(() => {
    if (remoteVideoRef.current && watchingPeerId && remoteStreams[watchingPeerId]?.videoStream) {
      const vTracks = remoteStreams[watchingPeerId].videoStream.getVideoTracks();
      const aTracks = remoteStreams[watchingPeerId].screenAudioStream
        ? remoteStreams[watchingPeerId].screenAudioStream.getAudioTracks()
        : remoteStreams[watchingPeerId].videoStream.getAudioTracks();
      const combined = new MediaStream([...vTracks, ...aTracks]);
      remoteVideoRef.current.srcObject = combined;
      remoteVideoRef.current.volume = screenVolume;
    }
  }, [watchingPeerId, remoteStreams, screenVolume]);

  // Sync Watch Together Current Time
  useEffect(() => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function' && watchTogetherState.currentTime !== undefined) {
      const localTime = ytPlayerRef.current.getCurrentTime() || 0;
      if (Math.abs(localTime - watchTogetherState.currentTime) > 2) {
        if (typeof ytPlayerRef.current.seekTo === 'function') {
          ytPlayerRef.current.seekTo(watchTogetherState.currentTime, 'seconds');
        }
      }
    }
  }, [watchTogetherState.currentTime, watchTogetherState.url]);

  const handleTogglePlaySync = () => {
    let currentT = watchTogetherState.currentTime;
    if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
      currentT = ytPlayerRef.current.getCurrentTime();
    }
    dispatchWatchTogether('sync', { 
      isPlaying: !watchTogetherState.isPlaying,
      currentTime: currentT
    });
  };

  // Users currently in this channel
  const currentRoomUsers = isConnectedToThisRoom
    ? usersInVoice
    : (voiceRooms[currentChannel?.id] || []);

  const allParticipants = isConnectedToThisRoom
    ? [
      {
        ...(currentUser || {}),
        id: currentUser?.id,
        username: (currentUser?.displayName || currentUser?.username || 'Você') + ' (Você)',
        displayName: currentUser?.displayName || currentUser?.username,
        avatar: currentUser?.avatar || (currentUser?.username || 'PC').substring(0, 2).toUpperCase(),
        avatarUrl: currentUser?.avatarUrl || '',
        avatarColor: currentUser?.avatarColor || 'from-indigo-500 to-purple-600',
        isLocal: true,
        isMuted: isMuted,
        isDeafened: isDeafened,
        isSpeaking: isSpeaking,
        isScreenSharing: isScreenSharing,
        socketId: 'local'
      },
      ...usersInVoice
        .filter((u) => u.id !== currentUser?.id && u.socketId !== 'local')
        .map((u) => {
          const isLive = Boolean(
            u.isScreenSharing &&
            remoteStreams[u.socketId]?.videoStream &&
            remoteStreams[u.socketId].videoStream.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled !== false)
          );

          return {
            ...u,
            isLocal: false,
            isSpeaking: speakingUsers.has(u.socketId),
            hasVideoStream: isLive
          };
        })
    ]
    : currentRoomUsers.map((u) => ({
      ...u,
      isLocal: false,
      isSpeaking: false,
      hasVideoStream: false
    }));

  const watchingUser = usersInVoice.find((u) => u.socketId === watchingPeerId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none relative voxel-workspace-inner">
      {/* Voice Stage Header */}
      <div className="h-12 border-b border-sys-border px-4 flex items-center justify-between flex-shrink-0 bg-sys-s3">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center">
            <Radio className={`w-4 h-4 ${isConnectedToThisRoom ? 'text-green-500 animate-pulse' : 'text-sys-muted'}`} />
          </div>
          <span className="font-bold text-sys-text text-[13px] tracking-tight">
            {currentChannel?.name || 'Canal de Voz'}
          </span>
          <span className="text-[10px] bg-sys-s1 px-2.5 py-0.5 rounded-full text-sys-muted font-medium border border-sys-border">
            {allParticipants.length} Participante(s) {isConnectedToThisRoom ? '• Conectado' : '• Visualizando'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* If not connected to this room, show prominent Connect Button */}
          {!isConnectedToThisRoom && (
            <button
              onClick={() => joinVoiceChannel(currentChannel?.id, currentServer?.id)}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold shadow-md transition btn-interactive"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Conectar à Voz</span>
            </button>
          )}

          {/* View Mode Toggle (Grid vs Theater) */}
          {isConnectedToThisRoom && (activeRemoteScreenShares.length > 0 || isScreenSharing) && (
            <button
              onClick={() => {
                if (isScreenSharing) {
                  if (localScreenPinned) {
                    setLocalScreenPinned(false);
                  } else {
                    setLocalScreenPinned(true);
                    setWatchingPeerId(null);
                  }
                } else {
                  setWatchingPeerId(watchingPeerId ? null : activeRemoteScreenShares[0][0]);
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition btn-interactive ${watchingPeerId || (isScreenSharing && localScreenPinned)
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                : 'bg-sys-s1 border border-sys-border text-sys-accent'
                }`}
            >
              {(watchingPeerId || (isScreenSharing && localScreenPinned)) ? <Grid className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{(watchingPeerId || (isScreenSharing && localScreenPinned)) ? 'Modo Grade' : 'Assistir Transmissão'}</span>
            </button>
          )}

          <button
            onClick={() => setIsMusicModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 bg-sys-s1 border border-sys-border text-sys-text rounded-full text-xs font-medium transition btn-interactive hover:border-sys-accent/40"
          >
            <Disc3 className="w-3.5 h-3.5 animate-spin text-amber-300" style={{ animationDuration: '8s' }} />
            <span>Player</span>
          </button>
        </div>
      </div>

      {/* Main Stage Area */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center thin-scrollbar relative">
        {/* 1. If not connected, show Preview Banner on top if room is empty */}
        {!isConnectedToThisRoom && (
          <div className="mb-6 p-4 bg-sys-s3 rounded-2xl max-w-lg w-full flex items-center justify-between border border-sys-border shadow-md">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-sys-text flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sys-accent" />
                <span>Visualizando Canal de Voz</span>
              </div>
              <p className="text-[11px] text-sys-muted">
                Você não está nesta chamada. Clique para conversar com seus amigos.
              </p>
            </div>
            <button
              onClick={() => joinVoiceChannel(currentChannel?.id, currentServer?.id)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-sm transition btn-interactive flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          </div>
        )}

        {/* 2. Local Screen Share */}
        {/* 1.5 Watch Together Player / Join Banner */}
        {isConnectedToThisRoom && watchTogetherState.isActive ? (
          <div className="w-full h-full max-w-5xl flex flex-col items-center justify-center relative rounded-3xl overflow-hidden bg-black shadow-2xl border border-sys-border">
            {watchTogetherState.participants?.includes(currentUser?.id) ? (
              watchTogetherState.url ? (
                <>
                  {(() => {
                    let safeId = watchTogetherState.url;
                    const match = safeId.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\/shorts\/)([^#&?]*).*/);
                    if (match && match[2].length === 11) safeId = match[2];

                    return (
                      <ReactPlayer
                        ref={ytPlayerRef}
                        url={`https://www.youtube.com/watch?v=${safeId}`}
                        playing={watchTogetherState.isPlaying}
                        volume={ytVolume}
                        controls={true}
                        width="100%"
                        height="100%"
                        config={{
                          youtube: {
                            playerVars: {
                              host: 'https://www.youtube-nocookie.com',
                              origin: window.location.origin
                            }
                          }
                        }}
                        onReady={() => console.log('[ReactPlayer] Ready!')}
                        onError={(e) => console.error('[ReactPlayer] Error:', e)}
                        onPlay={() => {
                          if (!watchTogetherState.isPlaying) {
                            handleTogglePlaySync();
                          }
                        }}
                        onPause={() => {
                          if (watchTogetherState.isPlaying) {
                            handleTogglePlaySync();
                          }
                        }}
                        onEnded={() => {
                          if (watchTogetherState.hostId === currentUser?.id) {
                            dispatchWatchTogether('next');
                          }
                        }}
                      />
                    );
                  })()}
                  {/* Fila (Queue) UI */}
                  {watchTogetherState.queue?.length > 0 && (
                    <div className="absolute top-4 right-4 bg-sys-s1/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-sys-border min-w-[200px] max-h-[300px] overflow-y-auto">
                      <h4 className="text-sm font-bold text-sys-text mb-2 flex items-center gap-2">
                        <MonitorPlay className="w-4 h-4 text-sys-accent" />
                        Fila ({watchTogetherState.queue.length})
                      </h4>
                      <ul className="text-xs text-sys-text-muted space-y-2">
                        {watchTogetherState.queue.map((qUrl, i) => (
                          <li key={i} className="truncate max-w-[180px] bg-sys-s2 p-2 rounded-lg border border-sys-border">{qUrl}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-white flex flex-col items-center">
                  <MonitorPlay className="w-12 h-12 text-sys-text-muted mb-4 animate-pulse" />
                  <p className="text-sys-text-muted">A fila acabou.</p>
                </div>
              )
            ) : (
              <div className="text-center p-8 bg-sys-s1 rounded-2xl border border-sys-accent shadow-xl max-w-sm">
                <MonitorPlay className="w-16 h-16 text-sys-accent mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Watchparty em Andamento</h3>
                <p className="text-sys-text-muted text-sm mb-6">
                  Alguém iniciou uma Watchparty neste canal. Clique abaixo para entrar e assistir junto!
                </p>
                <button
                  onClick={() => dispatchWatchTogether('join')}
                  className="w-full py-3 bg-sys-accent hover:bg-sys-accent/80 text-white font-bold rounded-xl transition shadow-md btn-interactive"
                >
                  Entrar na Watchparty
                </button>
              </div>
            )}
          </div>
        ) : isConnectedToThisRoom && isScreenSharing && localScreenStream && localScreenPinned ? (
          <div className="w-full h-full max-w-5xl flex flex-col items-center justify-center relative rounded-3xl overflow-hidden bg-sys-s3 shadow-md border border-sys-accent/40">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4 bg-sys-s1 px-3.5 py-1.5 rounded-full text-xs font-bold text-sys-text flex items-center space-x-2 border border-sys-border shadow-md z-20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Sua Transmissão (60 FPS)</span>
            </div>
            
            <div className="absolute bottom-4 right-4 flex items-center space-x-2 z-20">
              <button
                onClick={() => setLocalScreenPinned(false)}
                className="px-4 py-2 bg-[#181d26]/90 hover:bg-[#202733] text-white rounded-2xl text-xs font-bold shadow-xl transition btn-interactive border border-white/10 backdrop-blur-md"
              >
                Ver Todos em Grade
              </button>
              <button
                onClick={stopScreenShare}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-bold shadow-md transition btn-interactive"
              >
                Parar Transmissão
              </button>
            </div>
          </div>
        ) : isConnectedToThisRoom && watchingPeerId ? (
          /* 3. Remote Screen Share Theater Mode */
          <div
            ref={theaterContainerRef}
            className={
              isFullscreen
                ? 'fixed inset-0 z-[99999] w-screen h-screen bg-black flex flex-col items-center justify-center select-none overflow-hidden m-0 p-0 border-none rounded-none'
                : 'w-full h-full max-w-5xl rounded-3xl flex flex-col items-center justify-center relative overflow-hidden bg-black shadow-md border border-red-500/30'
            }
            style={isFullscreen ? { backgroundColor: '#000000', width: '100vw', height: '100vh', margin: 0, padding: 0 } : {}}
          >
            {remoteStreams[watchingPeerId]?.videoStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain cursor-pointer"
                style={{ backgroundColor: '#000000', width: '100%', height: '100%' }}
                onDoubleClick={() => toggleFullscreen()}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-sys-muted">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <p className="text-xs font-bold text-sys-text">
                  Conectando à transmissão de {watchingUser?.username || 'Amigo'}...
                </p>
              </div>
            )}
            <div className="absolute top-4 left-4 bg-[#14181f]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-white flex items-center space-x-2 border border-white/10 shadow-xl z-20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Assistindo: {watchingUser?.username || 'Amigo'} (60 FPS)</span>
            </div>

            <div className="absolute top-4 right-4 bg-[#14181f]/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl flex items-center space-x-3 border border-white/10 shadow-xl z-20">
              <div className="flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4 text-white/70" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={screenVolume}
                  onChange={(e) => setScreenVolume(parseFloat(e.target.value))}
                  className="w-20 accent-sys-accent cursor-pointer"
                  title="Volume da Transmissão"
                />
              </div>

              <div className="h-4 w-[1px] bg-white/20" />

              {/* Botão de Tela Cheia */}
              <button
                type="button"
                onClick={() => toggleFullscreen()}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
                title={isFullscreen ? 'Sair da Tela Cheia (Esc)' : 'Tela Cheia'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="absolute bottom-4 right-4 flex items-center space-x-2 z-20">
              <button
                type="button"
                onClick={() => toggleFullscreen()}
                className="px-3 py-2 bg-[#181d26]/90 hover:bg-[#202733] text-white rounded-2xl text-xs font-bold shadow-xl transition btn-interactive border border-white/10 flex items-center space-x-1.5 backdrop-blur-md"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullscreen ? 'Restaurar' : 'Tela Cheia'}</span>
              </button>

              <button
                onClick={() => {
                  if (isFullscreen) toggleFullscreen(false);
                  setWatchingPeerId(null);
                }}
                className="px-4 py-2 bg-[#181d26]/90 hover:bg-[#202733] text-white rounded-2xl text-xs font-bold shadow-xl transition btn-interactive border border-white/10 backdrop-blur-md"
              >
                Ver Todos em Grade
              </button>
            </div>
          </div>
        ) : allParticipants.length === 0 ? (
          /* 4. Empty Room Placeholder */
          <div className="text-center p-8 bg-sys-s3 rounded-3xl max-w-sm space-y-3 border border-sys-border">
            <div className="w-14 h-14 rounded-2xl bg-sys-accent/20 text-sys-accent flex items-center justify-center mx-auto border border-sys-accent/30">
              <Radio className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-sys-text">Ninguém nesta sala ainda</h3>
            <p className="text-xs text-sys-muted">
              Seja o primeiro a entrar! Conecte seu fone e microfone para começar.
            </p>
            <button
              onClick={() => joinVoiceChannel(currentChannel?.id, currentServer?.id)}
              className="px-5 py-2.5 bg-sys-accent hover:bg-sys-accentHov text-white text-xs font-bold rounded-xl shadow-md transition btn-interactive inline-flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Entrar na Sala</span>
            </button>
          </div>
        ) : (
          /* 5. Participant Cards Grid */
          <div className="w-full max-w-5xl flex flex-wrap gap-5 items-center justify-center px-4">
            {allParticipants.map((participant, idx) => {
              const monogram = (participant.username || 'User').substring(0, 2).toUpperCase();
              const friendVolume = userVolumes[participant.id] ?? 100;
              const hasScreen = participant.hasVideoStream || (participant.isLocal && isScreenSharing);

              return (
                <div
                  key={participant.id || idx}
                  className={`w-full max-w-[280px] flex-shrink-0 bg-sys-s3 border border-sys-border rounded-3xl p-5 flex flex-col items-center justify-between relative shadow-md min-h-[240px] transition-all hover:border-sys-accent/40 ${hasScreen ? 'border-red-500/40' : ''
                    }`}
                >
                  {/* Top Badges & Live indicator */}
                  <div className="w-full flex items-center justify-between">
                    {hasScreen ? (
                      <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
                        <MonitorPlay className="w-3 h-3" />
                        AO VIVO
                      </span>
                    ) : (
                      <span />
                    )}

                    {/* Status Badges */}
                    <div className="flex items-center space-x-1.5">
                      {participant.isMuted && (
                        <div className="p-1 bg-red-500/20 rounded-full text-red-500 border border-red-500/30 shadow-sm" title="Mutado">
                          <MicOff className="w-3 h-3" />
                        </div>
                      )}
                      {participant.isDeafened && (
                        <div className="p-1 bg-red-500/20 rounded-full text-red-500 border border-red-500/30 shadow-sm" title="Ensurdecido">
                          <Headphones className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Avatar with Speaking Glow Ring */}
                  <div 
                    className="flex flex-col items-center my-1 cursor-pointer group"
                    onClick={() => setSelectedUserProfile(participant)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenuUser({
                        user: participant,
                        x: e.clientX,
                        y: e.clientY
                      });
                    }}
                    title="Clique com botão esquerdo para perfil ou botão direito para opções"
                  >
                    <div className="relative mb-2">
                      {participant.avatarUrl ? (
                         <AvatarImage 
                           src={participant.avatarUrl} 
                           alt={participant.username}
                           isSpeaking={participant.isSpeaking}
                           className={`w-16 h-16 rounded-2xl object-cover shadow-sm border-2 transition-all duration-150 group-hover:scale-105 ${participant.isSpeaking
                             ? 'border-green-500 scale-105'
                             : 'border-transparent'
                           }`}
                         />
                      ) : (
                        <div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${participant.avatarColor || 'from-indigo-500 to-purple-600'} text-white flex items-center justify-center text-lg font-bold shadow-sm border-2 transition-all duration-150 group-hover:scale-105 ${participant.isSpeaking
                            ? 'border-green-500 scale-105'
                            : 'border-transparent'
                            }`}
                        >
                          {monogram}
                        </div>
                      )}

                      {participant.isSpeaking && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase shadow-sm">
                          VOZ
                        </div>
                      )}
                    </div>

                    <span className="font-semibold text-sys-text text-xs truncate max-w-[160px] tracking-tight group-hover:text-sys-accent transition-colors">
                      {participant.displayName || participant.username}
                    </span>
                  </div>

                  {/* Watch Stream Button (if remote peer is sharing) */}
                  {isConnectedToThisRoom && !participant.isLocal && hasScreen ? (
                    <button
                      onClick={() => setWatchingPeerId(participant.socketId)}
                      className="w-full mt-2 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition btn-interactive"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Assistir Transmissão</span>
                    </button>
                  ) : isConnectedToThisRoom && !participant.isLocal ? (
                    /* Individual Friend Volume Slider */
                    <div className="w-full mt-2 px-3 py-1.5 rounded-xl bg-sys-s2 border border-sys-border flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setUserVolume(participant.id, friendVolume === 0 ? 100 : 0)}
                        className="text-sys-muted hover:text-sys-text transition"
                        title={friendVolume === 0 ? 'Desmutar Amigo' : 'Mutar Amigo'}
                      >
                        {friendVolume === 0 ? (
                          <VolumeX className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-sys-accent" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={friendVolume}
                        onChange={(e) => setUserVolume(participant.id, Number(e.target.value))}
                        className="w-full h-1 bg-sys-s3 rounded-lg appearance-none cursor-pointer accent-sys-accent"
                        title={`Volume: ${friendVolume}%`}
                      />
                      <span className="text-[10px] font-mono text-sys-muted min-w-[32px] text-right font-medium">
                        {friendVolume}%
                      </span>
                    </div>
                  ) : isConnectedToThisRoom ? (
                    <div className="text-[10px] text-sys-muted font-medium py-1">
                      Seu Microfone
                    </div>
                  ) : (
                    <div className="text-[10px] text-sys-muted font-medium py-1">
                      Conectado na Sala
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Watch Together Widget Bar */}
      {isConnectedToThisRoom && watchTogetherState.isActive && (
        <div className="h-14 bg-sys-s2 border-t border-sys-border px-5 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shadow-md flex-shrink-0 text-white">
              <MonitorPlay className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-sys-text truncate tracking-tight">
                Watch Together
              </div>
              <div className="text-[10px] text-sys-muted truncate">
                Assistindo YouTube em Sincronia
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-6">
            <form onSubmit={handleYoutubeSubmit} className="relative flex items-center">
              <Link className="absolute left-3 w-3.5 h-3.5 text-sys-muted" />
              <input
                type="text"
                placeholder="Cole o link do YouTube aqui..."
                value={ytInput}
                onChange={(e) => setYtInput(e.target.value)}
                className="w-full bg-sys-s1 border border-sys-border text-sys-text pl-9 pr-16 py-1.5 rounded-xl text-[11px] focus:outline-none focus:border-sys-accent/50 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-1 px-3 py-1 bg-sys-accent hover:bg-sys-accentHov text-white text-[10px] font-bold rounded-lg transition"
              >
                Tocar
              </button>
            </form>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="flex items-center bg-sys-s1 px-2 py-1.5 rounded-xl border border-sys-border">
              <Volume2 className="w-3.5 h-3.5 text-sys-muted mr-1.5" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ytVolume}
                onChange={(e) => setYtVolume(parseFloat(e.target.value))}
                className="w-16 accent-red-500 cursor-pointer"
                title="Volume do YouTube"
              />
            </div>

            <button
              onClick={handleTogglePlaySync}
              className="p-2 bg-sys-accent/20 text-sys-accent hover:bg-sys-accent hover:text-white rounded-xl transition"
              title={watchTogetherState.isPlaying ? 'Pausar' : 'Tocar'}
            >
              {watchTogetherState.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => dispatchWatchTogether('end')}
              className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition"
              title="Fechar YouTube"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Active Music Bot Widget Bar */}
      {isConnectedToThisRoom && musicPlayer.currentTrack && (
        <div className="h-14 bg-sys-s2 border-t border-sys-border px-5 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center space-x-3 truncate">
            <img
              src={musicPlayer.currentTrack.cover}
              alt="Track Cover"
              className="w-9 h-9 rounded-xl object-cover border border-sys-border shadow-md flex-shrink-0"
            />
            <div className="truncate">
              <div className="text-xs font-bold text-sys-text truncate tracking-tight">
                {musicPlayer.currentTrack.title}
              </div>
              <div className="text-[10px] text-sys-muted truncate">
                {musicPlayer.currentTrack.artist} • por {musicPlayer.currentTrack.requestedBy || 'Bot'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => sendMusicControl(musicPlayer.isPlaying ? 'pause' : 'resume')}
              className="p-2 bg-sys-accent/20 text-sys-accent hover:bg-sys-accent hover:text-white rounded-xl transition"
              title={musicPlayer.isPlaying ? 'Pausar' : 'Tocar'}
            >
              {musicPlayer.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => sendMusicControl('skip')}
              className="p-2 bg-sys-s3 text-sys-text hover:bg-sys-s1 rounded-xl transition border border-sys-border"
              title="Pular Faixa"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => sendMusicControl('stop')}
              className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition"
              title="Parar Música"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Voice Bottom Dock Floating Controls (Only shown when CONNECTED) */}
      {isConnectedToThisRoom && (
        <div className="p-4 flex items-center justify-center">
          <div className="bg-sys-s3 px-6 py-2.5 rounded-2xl flex items-center space-x-3 shadow-md border border-sys-border">
            {/* Mute Mic */}
            <button
              onClick={toggleMute}
              className={`p-3 rounded-xl transition-all duration-200 shadow-sm ${isMuted
                ? 'bg-red-500 text-white'
                : 'bg-sys-s1 hover:bg-sys-s2 text-sys-text border border-sys-border'
                }`}
              title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Deafen Audio */}
            <button
              onClick={toggleDeafen}
              className={`p-3 rounded-xl transition-all duration-200 shadow-sm ${isDeafened
                ? 'bg-red-500 text-white'
                : 'bg-sys-s1 hover:bg-sys-s2 text-sys-text border border-sys-border'
                }`}
              title={isDeafened ? 'Desativar Silêncio' : 'Ensurdecer (Muta Todos)'}
            >
              <Headphones className="w-4 h-4" />
            </button>

            {/* Screen Share (60 FPS) */}
            <button
              onClick={() => {
                if (isScreenSharing) {
                  stopScreenShare();
                } else {
                  setIsScreenModalOpen(true);
                }
              }}
              className={`p-3 rounded-xl transition-all duration-200 shadow-sm ${isScreenSharing
                ? 'bg-green-500 text-white'
                : 'bg-sys-s1 hover:bg-sys-s2 text-sys-text border border-sys-border'
                }`}
              title={isScreenSharing ? 'Parar de Compartilhar' : 'Compartilhar Tela (60 FPS)'}
            >
              <Tv className="w-4 h-4" />
            </button>

            {/* In-Stream Audio Toggle (When Sharing with Audio) */}
            {isScreenSharing && localScreenStream?.getAudioTracks().length > 0 && (
              <button
                onClick={toggleScreenShareAudio}
                className={`p-3 rounded-xl transition-all duration-200 shadow-sm ${
                  isScreenAudioEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
                title={isScreenAudioEnabled ? 'Mutar Áudio da Transmissão' : 'Desmutar Áudio da Transmissão'}
              >
                {isScreenAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            )}


            {/* Watch Together (YouTube) */}
            <button
              onClick={() => {
                if (watchTogetherState.isActive) {
                  if (watchTogetherState.participants?.includes(currentUser?.id)) {
                    dispatchWatchTogether('leave');
                  } else {
                    dispatchWatchTogether('join');
                  }
                } else {
                  dispatchWatchTogether('start', { url: '' });
                }
              }}
              className={`p-3 rounded-xl transition-all duration-200 shadow-sm ${watchTogetherState.isActive
                ? 'bg-red-500 text-white'
                : 'bg-sys-s1 hover:bg-sys-s2 text-sys-text border border-sys-border'
                }`}
              title="Watch Together (YouTube)"
            >
              <MonitorPlay className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-6 bg-sys-border mx-1" />

            {/* Disconnect Call */}
            <button
              onClick={leaveVoiceChannel}
              className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-all duration-200 hover:scale-105"
              title="Desconectar do Canal de Voz"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* User Context Menu (Right Click) */}
      {contextMenuUser && (
        <UserContextMenu
          targetUser={contextMenuUser.user}
          position={{ x: contextMenuUser.x, y: contextMenuUser.y }}
          onClose={() => setContextMenuUser(null)}
          onOpenProfile={(u) => setSelectedUserProfile(u)}
        />
      )}

      {selectedUserProfile && (
        <UserProfileCard 
          user={selectedUserProfile} 
          onClose={() => setSelectedUserProfile(null)} 
        />
      )}
    </div>
  );
};
