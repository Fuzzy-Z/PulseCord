import React, { useRef, useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  Tv,
  PhoneOff,
  Disc3,
  Maximize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  Square,
  Radio,
  Eye,
  Grid,
  MonitorPlay
} from 'lucide-react';
import { useVoice } from '../context/VoiceContext';
import { useServer } from '../context/ServerContext';
import { useSocket } from '../context/SocketContext';

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
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    sendMusicControl,
    userVolumes,
    setUserVolume
  } = useVoice();

  const { currentServer, setIsMusicModalOpen, setIsScreenModalOpen } = useServer();
  const { currentUser } = useSocket();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Selected remote peer socketId whose screen is being watched
  const [watchingPeerId, setWatchingPeerId] = useState(null);

  // Attach local screen video stream
  useEffect(() => {
    if (localVideoRef.current && localScreenStream) {
      localVideoRef.current.srcObject = localScreenStream;
    }
  }, [localScreenStream]);

  // Find all active remote screen shares
  const activeRemoteScreenShares = Object.entries(remoteStreams).filter(
    ([_, streams]) => streams.videoStream
  );

  // Auto-watch first screen share if none is currently selected
  useEffect(() => {
    if (!watchingPeerId && activeRemoteScreenShares.length > 0) {
      setWatchingPeerId(activeRemoteScreenShares[0][0]);
    } else if (watchingPeerId && !remoteStreams[watchingPeerId]?.videoStream) {
      setWatchingPeerId(activeRemoteScreenShares[0] ? activeRemoteScreenShares[0][0] : null);
    }
  }, [activeRemoteScreenShares, watchingPeerId, remoteStreams]);

  // Attach watched remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && watchingPeerId && remoteStreams[watchingPeerId]?.videoStream) {
      remoteVideoRef.current.srcObject = remoteStreams[watchingPeerId].videoStream;
    }
  }, [watchingPeerId, remoteStreams]);

  const activeChannelObj = currentServer?.channels.find((c) => c.id === activeVoiceChannel);

  // Combine currentUser + other peers in the room
  const allParticipants = [
    {
      id: currentUser?.id,
      username: currentUser?.username + ' (Você)',
      avatar: currentUser?.avatar || '👑',
      isLocal: true,
      isMuted: isMuted,
      isDeafened: isDeafened,
      isSpeaking: isSpeaking,
      isScreenSharing: isScreenSharing,
      socketId: 'local'
    },
    ...usersInVoice.map((u) => ({
      ...u,
      isLocal: false,
      isSpeaking: speakingUsers.has(u.socketId),
      hasVideoStream: !!remoteStreams[u.socketId]?.videoStream
    }))
  ];

  const watchingUser = usersInVoice.find((u) => u.socketId === watchingPeerId);

  return (
    <div className="flex-1 bg-black/20 backdrop-blur-2xl flex flex-col h-full overflow-hidden select-none relative">
      {/* Voice Stage Header */}
      <div className="h-12 border-b border-white/[0.06] px-4 flex items-center justify-between flex-shrink-0 bg-black/30 backdrop-blur-2xl">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <span className="font-bold text-white text-[13px] tracking-tight">
            {activeChannelObj?.name || 'Canal de Voz'}
          </span>
          <span className="text-[10px] glass-pill px-2.5 py-0.5 rounded-full text-slate-400 font-medium">
            {allParticipants.length} Participante(s) • HD 60fps
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle (Grid vs Theater) */}
          {activeRemoteScreenShares.length > 0 && (
            <button
              onClick={() => setWatchingPeerId(watchingPeerId ? null : activeRemoteScreenShares[0][0])}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition btn-interactive ${
                watchingPeerId
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'glass-pill text-indigo-300'
              }`}
            >
              {watchingPeerId ? <Grid className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{watchingPeerId ? 'Modo Grade' : 'Assistir Transmissão'}</span>
            </button>
          )}

          <button
            onClick={() => setIsMusicModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 glass-pill text-amber-300 rounded-full text-xs font-medium transition btn-interactive"
          >
            <Disc3 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Player</span>
          </button>
        </div>
      </div>

      {/* Main Stage Grid / Spotlight Screen Share */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center thin-scrollbar relative">
        {/* 1. Local Screen Share (When sharing own screen) */}
        {isScreenSharing && localScreenStream ? (
          <div className="w-full h-full max-w-5xl flex flex-col items-center justify-center relative rounded-3xl overflow-hidden bg-black/90 shadow-2xl border border-indigo-500/40">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-xl px-3.5 py-1.5 rounded-full text-xs font-bold text-white flex items-center space-x-2 border border-white/10 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <span>Sua Transmissão (60 FPS)</span>
            </div>
            <button
              onClick={stopScreenShare}
              className="absolute bottom-4 right-4 px-4 py-2 bg-rose-500/90 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold shadow-xl transition btn-interactive"
            >
              Parar Transmissão
            </button>
          </div>
        ) : watchingPeerId && remoteStreams[watchingPeerId]?.videoStream ? (
          /* 2. Remote Screen Share Theater Mode (Watching friend's stream) */
          <div className="w-full h-full max-w-5xl flex flex-col items-center justify-center relative rounded-3xl overflow-hidden bg-black/95 shadow-2xl border border-rose-500/30">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-xl px-3.5 py-1.5 rounded-full text-xs font-bold text-white flex items-center space-x-2 border border-white/10 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <span>Assistindo: {watchingUser?.username || 'Amigo'} (60 FPS)</span>
            </div>
            <button
              onClick={() => setWatchingPeerId(null)}
              className="absolute bottom-4 right-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold shadow-xl transition backdrop-blur-md btn-interactive"
            >
              Ver Todos em Grade
            </button>
          </div>
        ) : (
          /* 3. Participant Cards Grid */
          <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 auto-rows-fr items-center justify-center">
            {allParticipants.map((participant, idx) => {
              const monogram = (participant.username || 'User').substring(0, 2).toUpperCase();
              const friendVolume = userVolumes[participant.id] ?? 100;
              const hasScreen = participant.hasVideoStream || (participant.isLocal && isScreenSharing);

              return (
                <div
                  key={participant.id || idx}
                  className={`glass-panel rounded-3xl p-5 flex flex-col items-center justify-between relative shadow-2xl min-h-[240px] transition-all hover:border-white/20 ${
                    hasScreen ? 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : ''
                  }`}
                >
                  {/* Top Badges & Live indicator */}
                  <div className="w-full flex items-center justify-between">
                    {hasScreen ? (
                      <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 shadow-md animate-pulse">
                        <MonitorPlay className="w-3 h-3" />
                        AO VIVO
                      </span>
                    ) : (
                      <span />
                    )}

                    {/* Status Badges */}
                    <div className="flex items-center space-x-1.5">
                      {participant.isMuted && (
                        <div className="p-1 bg-rose-500/20 rounded-full text-rose-400 border border-rose-500/30 shadow-md" title="Mutado">
                          <MicOff className="w-3 h-3" />
                        </div>
                      )}
                      {participant.isDeafened && (
                        <div className="p-1 bg-rose-500/20 rounded-full text-rose-400 border border-rose-500/30 shadow-md" title="Ensurdecido">
                          <Headphones className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Avatar with Speaking Glow Ring */}
                  <div className="flex flex-col items-center my-1">
                    <div className="relative mb-2">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-lg font-bold shadow-2xl border-2 transition-all duration-150 ${
                          participant.isSpeaking
                            ? 'border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.8)] scale-105'
                            : 'border-white/15'
                        }`}
                      >
                        {monogram}
                      </div>

                      {participant.isSpeaking && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-400 text-black text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase shadow-md">
                          VOZ
                        </div>
                      )}
                    </div>

                    {/* Username */}
                    <span className="font-semibold text-white text-xs truncate max-w-[160px] tracking-tight">
                      {participant.username}
                    </span>
                  </div>

                  {/* Watch Stream Button (if remote peer is sharing) */}
                  {!participant.isLocal && hasScreen ? (
                    <button
                      onClick={() => setWatchingPeerId(participant.socketId)}
                      className="w-full mt-2 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition btn-interactive"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Assistir Transmissão</span>
                    </button>
                  ) : !participant.isLocal ? (
                    /* Individual Friend Volume Slider */
                    <div className="w-full mt-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setUserVolume(participant.id, friendVolume === 0 ? 100 : 0)}
                        className="text-slate-400 hover:text-white transition"
                        title={friendVolume === 0 ? 'Desmutar Amigo' : 'Mutar Amigo'}
                      >
                        {friendVolume === 0 ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={friendVolume}
                        onChange={(e) => setUserVolume(participant.id, Number(e.target.value))}
                        className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        title={`Volume: ${friendVolume}%`}
                      />
                      <span className="text-[10px] font-mono text-slate-400 min-w-[32px] text-right font-medium">
                        {friendVolume}%
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 font-medium py-1">
                      Seu Microfone
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Music Bot Widget Bar (at bottom of voice) */}
      {musicPlayer.currentTrack && (
        <div className="h-14 bg-black/60 backdrop-blur-2xl border-t border-white/[0.08] px-5 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center space-x-3 truncate">
            <img
              src={musicPlayer.currentTrack.cover}
              alt="Track Cover"
              className="w-9 h-9 rounded-xl object-cover border border-white/10 shadow-md flex-shrink-0"
            />
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate tracking-tight">
                {musicPlayer.currentTrack.title}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {musicPlayer.currentTrack.artist} • por {musicPlayer.currentTrack.requestedBy || 'Bot'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => sendMusicControl(musicPlayer.isPlaying ? 'pause' : 'resume')}
              className="p-2 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white rounded-xl transition"
              title={musicPlayer.isPlaying ? 'Pausar' : 'Tocar'}
            >
              {musicPlayer.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => sendMusicControl('skip')}
              className="p-2 bg-white/5 text-slate-300 hover:bg-white/10 rounded-xl transition"
              title="Pular Faixa"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => sendMusicControl('stop')}
              className="p-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition"
              title="Parar Música"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Voice Bottom Dock Floating Controls */}
      <div className="p-4 flex items-center justify-center">
        <div className="glass-panel px-6 py-2.5 rounded-2xl flex items-center space-x-3 shadow-2xl border border-white/15">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`p-3 rounded-xl transition-all duration-200 shadow-md ${
              isMuted
                ? 'bg-rose-500/90 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-white/[0.08] hover:bg-white/[0.15] text-slate-200'
            }`}
            title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Deafen Audio */}
          <button
            onClick={toggleDeafen}
            className={`p-3 rounded-xl transition-all duration-200 shadow-md ${
              isDeafened
                ? 'bg-rose-500/90 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-white/[0.08] hover:bg-white/[0.15] text-slate-200'
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
            className={`p-3 rounded-xl transition-all duration-200 shadow-md ${
              isScreenSharing
                ? 'bg-emerald-500/90 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-white/[0.08] hover:bg-white/[0.15] text-slate-200'
            }`}
            title={isScreenSharing ? 'Parar de Compartilhar' : 'Compartilhar Tela (60 FPS)'}
          >
            <Tv className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-white/10 mx-1" />

          {/* Disconnect Call */}
          <button
            onClick={leaveVoiceChannel}
            className="p-3 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
            title="Desconectar do Canal de Voz"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
