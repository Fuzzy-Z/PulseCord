import React, { useRef, useEffect, useState } from 'react';
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
  Loader2
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
    joinVoiceChannel,
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

  const { currentServer, currentChannel, voiceRooms, setIsMusicModalOpen, setIsScreenModalOpen } = useServer();
  const { currentUser } = useSocket();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Selected remote peer socketId whose screen is being watched
  const [watchingPeerId, setWatchingPeerId] = useState(null);

  // Is user actively connected to THIS voice channel
  const isConnectedToThisRoom = activeVoiceChannel === currentChannel?.id;

  // Remote screen shares
  const activeRemoteScreenShares = Object.entries(remoteStreams).filter(
    ([_, streams]) => streams.videoStream
  );

  // Attach local screen video stream
  useEffect(() => {
    if (localVideoRef.current && localScreenStream) {
      localVideoRef.current.srcObject = localScreenStream;
    }
  }, [localScreenStream]);

  // Clear watchingPeerId only if that user has completely left the voice call
  useEffect(() => {
    if (watchingPeerId && !usersInVoice.some((u) => u.socketId === watchingPeerId)) {
      setWatchingPeerId(null);
    }
  }, [watchingPeerId, usersInVoice]);

  // Attach watched remote video stream whenever available
  useEffect(() => {
    if (remoteVideoRef.current && watchingPeerId && remoteStreams[watchingPeerId]?.videoStream) {
      remoteVideoRef.current.srcObject = remoteStreams[watchingPeerId].videoStream;
      remoteVideoRef.current.play().catch(e => console.warn('[Video Play]', e));
    }
  }, [watchingPeerId, remoteStreams]);

  // Users currently in this channel
  const currentRoomUsers = isConnectedToThisRoom
    ? usersInVoice
    : (voiceRooms[currentChannel?.id] || []);

  const allParticipants = isConnectedToThisRoom
    ? [
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
          hasVideoStream: !!remoteStreams[u.socketId]?.videoStream || !!u.isScreenSharing
        }))
      ]
    : currentRoomUsers.map((u) => ({
        ...u,
        isLocal: false,
        isSpeaking: false,
        hasVideoStream: false
      }));

  const watchingUser = usersInVoice.find((u) => u.socketId === watchingPeerId);

  return (
    <div className="flex-1 bg-black/20 backdrop-blur-2xl flex flex-col h-full overflow-hidden select-none relative">
      {/* Voice Stage Header */}
      <div className="h-12 border-b border-white/[0.06] px-4 flex items-center justify-between flex-shrink-0 bg-black/30 backdrop-blur-2xl">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center">
            <Radio className={`w-4 h-4 ${isConnectedToThisRoom ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <span className="font-bold text-white text-[13px] tracking-tight">
            {currentChannel?.name || 'Canal de Voz'}
          </span>
          <span className="text-[10px] glass-pill px-2.5 py-0.5 rounded-full text-slate-400 font-medium">
            {allParticipants.length} Participante(s) {isConnectedToThisRoom ? '• Conectado' : '• Visualizando'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* If not connected to this room, show prominent Connect Button */}
          {!isConnectedToThisRoom && (
            <button
              onClick={() => joinVoiceChannel(currentChannel?.id, currentServer?.id)}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full text-xs font-bold shadow-lg shadow-emerald-500/20 transition btn-interactive"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Conectar à Voz</span>
            </button>
          )}

          {/* View Mode Toggle (Grid vs Theater) */}
          {isConnectedToThisRoom && activeRemoteScreenShares.length > 0 && (
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

      {/* Main Stage Area */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center thin-scrollbar relative">
        {/* 1. If not connected, show Preview Banner on top if room is empty */}
        {!isConnectedToThisRoom && (
          <div className="mb-6 p-4 glass-panel rounded-2xl max-w-lg w-full flex items-center justify-between border border-white/10 shadow-xl">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Visualizando Canal de Voz</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Você não está nesta chamada. Clique para conversar com seus amigos.
              </p>
            </div>
            <button
              onClick={() => joinVoiceChannel(currentChannel?.id, currentServer?.id)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-lg transition btn-interactive flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          </div>
        )}

        {/* 2. Local Screen Share */}
        {isConnectedToThisRoom && isScreenSharing && localScreenStream ? (
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
        ) : isConnectedToThisRoom && watchingPeerId ? (
          /* 3. Remote Screen Share Theater Mode */
          <div className="w-full h-full max-w-5xl flex flex-col items-center justify-center relative rounded-3xl overflow-hidden bg-black/95 shadow-2xl border border-rose-500/30">
            {remoteStreams[watchingPeerId]?.videoStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-slate-300">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                <p className="text-xs font-bold text-white">
                  Conectando à transmissão de {watchingUser?.username || 'Amigo'}...
                </p>
              </div>
            )}
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
        ) : allParticipants.length === 0 ? (
          /* 4. Empty Room Placeholder */
          <div className="text-center p-8 glass-panel rounded-3xl max-w-sm space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
              <Radio className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">Ninguém nesta sala ainda</h3>
            <p className="text-xs text-slate-400">
              Seja o primeiro a entrar! Conecte seu fone e microfone para começar.
            </p>
            <button
              onClick={() => joinVoiceChannel(currentChannel?.id, currentServer?.id)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-lg transition btn-interactive inline-flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Entrar na Sala</span>
            </button>
          </div>
        ) : (
          /* 5. Participant Cards Grid */
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
                  {isConnectedToThisRoom && !participant.isLocal && hasScreen ? (
                    <button
                      onClick={() => setWatchingPeerId(participant.socketId)}
                      className="w-full mt-2 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition btn-interactive"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Assistir Transmissão</span>
                    </button>
                  ) : isConnectedToThisRoom && !participant.isLocal ? (
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
                  ) : isConnectedToThisRoom ? (
                    <div className="text-[10px] text-slate-500 font-medium py-1">
                      Seu Microfone
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 font-medium py-1">
                      Conectado na Sala
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Music Bot Widget Bar */}
      {isConnectedToThisRoom && musicPlayer.currentTrack && (
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

      {/* Voice Bottom Dock Floating Controls (Only shown when CONNECTED) */}
      {isConnectedToThisRoom && (
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
      )}
    </div>
  );
};
