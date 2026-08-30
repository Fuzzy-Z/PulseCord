import React, { useRef, useEffect } from 'react';
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
  Radio
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
  const remoteVideoRefs = useRef({});

  // Attach local screen video stream
  useEffect(() => {
    if (localVideoRef.current && localScreenStream) {
      localVideoRef.current.srcObject = localScreenStream;
    }
  }, [localScreenStream]);

  // Find any active screen shares from remote peers
  const remoteScreenShareEntry = Object.entries(remoteStreams).find(
    ([_, streams]) => streams.videoStream
  );

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
      isScreenSharing: isScreenSharing
    },
    ...usersInVoice.map((u) => ({
      ...u,
      isLocal: false,
      isSpeaking: speakingUsers.has(u.socketId)
    }))
  ];

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
      <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center thin-scrollbar">
        {/* If local screen share is active */}
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
              <span>Transmissão de Tela (60 FPS)</span>
            </div>
            <button
              onClick={stopScreenShare}
              className="absolute bottom-4 right-4 px-4 py-2 bg-rose-500/90 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold shadow-xl transition btn-interactive"
            >
              Parar Transmissão
            </button>
          </div>
        ) : remoteScreenShareEntry ? (
          /* Remote screen share display */
          <div className="w-full h-full max-w-5xl flex flex-col items-center justify-center relative rounded-3xl overflow-hidden bg-black/90 shadow-2xl border border-indigo-500/40">
            <video
              autoPlay
              playsInline
              ref={(el) => {
                if (el && remoteScreenShareEntry[1].videoStream) {
                  el.srcObject = remoteScreenShareEntry[1].videoStream;
                }
              }}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-xl px-3.5 py-1.5 rounded-full text-xs font-bold text-white flex items-center space-x-2 border border-white/10 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <span>Transmissão Ao Vivo</span>
            </div>
          </div>
        ) : (
          /* Participant Cards Grid */
          <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 auto-rows-fr items-center justify-center">
            {allParticipants.map((participant, idx) => {
              const monogram = (participant.username || 'User').substring(0, 2).toUpperCase();
              const friendVolume = userVolumes[participant.id] ?? 100;

              return (
                <div
                  key={participant.id || idx}
                  className="glass-panel rounded-3xl p-5 flex flex-col items-center justify-between relative shadow-2xl min-h-[220px] transition-all hover:border-white/20"
                >
                  {/* Hidden Remote Audio Element for Peer */}
                  {!participant.isLocal && (
                    <audio
                      autoPlay
                      playsInline
                      ref={(el) => {
                        if (el && remoteStreams[participant.socketId]?.audioStream) {
                          if (el.srcObject !== remoteStreams[participant.socketId].audioStream) {
                            el.srcObject = remoteStreams[participant.socketId].audioStream;
                          }
                          el.volume = isDeafened ? 0 : Math.min(1, friendVolume / 100);
                        }
                      }}
                    />
                  )}

                  {/* Avatar with Speaking Glow Ring */}
                  <div className="flex flex-col items-center mt-2">
                    <div className="relative mb-2.5">
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

                  {/* Individual Friend Volume Slider (Only for remote peers) */}
                  {!participant.isLocal ? (
                    <div className="w-full mt-3 px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center space-x-2">
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

                  {/* Status Badges */}
                  <div className="absolute top-3.5 right-3.5 flex items-center space-x-1.5">
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
              );
            })}
          </div>
        )}
      </div>

      {/* Active Music Bot Widget Bar (at bottom of voice) */}
      {musicPlayer.currentTrack && (
        <div className="glass-panel mx-6 mb-3 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-2xl border border-amber-400/20">
          <div className="flex items-center space-x-3 truncate">
            <img
              src={musicPlayer.currentTrack.cover}
              alt="Track Cover"
              className="w-10 h-10 rounded-xl object-cover shadow-md border border-white/10"
            />
            <div className="flex flex-col truncate">
              <div className="flex items-center space-x-1.5">
                <Disc3 className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="text-xs font-bold text-white truncate">
                  {musicPlayer.currentTrack.title}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 truncate">
                {musicPlayer.currentTrack.artist}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                sendMusicControl(musicPlayer.isPlaying ? 'pause' : 'resume')
              }
              className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black transition shadow-md btn-interactive"
              title={musicPlayer.isPlaying ? 'Pausar' : 'Tocar'}
            >
              {musicPlayer.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>
            <button
              onClick={() => sendMusicControl('skip')}
              className="p-2 rounded-xl glass-pill text-slate-300 hover:text-white transition btn-interactive"
              title="Pular Música"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => sendMusicControl('stop')}
              className="p-2 rounded-xl glass-pill hover:bg-rose-500/30 text-slate-300 hover:text-rose-400 transition btn-interactive"
              title="Parar Reprodução"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Discord Action Controls */}
      <div className="p-4 bg-black/40 backdrop-blur-2xl border-t border-white/[0.06] flex items-center justify-center space-x-3 z-20">
        {/* Toggle Mic */}
        <button
          onClick={toggleMute}
          className={`p-3 rounded-2xl transition-all shadow-xl btn-interactive ${
            isMuted
              ? 'bg-rose-500/80 text-white shadow-[0_0_16px_rgba(244,63,94,0.4)] border border-rose-400/40'
              : 'glass-pill text-slate-300 hover:text-white'
          }`}
          title={isMuted ? 'Desmutar' : 'Mutar Microfone'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Toggle Deafen */}
        <button
          onClick={toggleDeafen}
          className={`p-3 rounded-2xl transition-all shadow-xl btn-interactive ${
            isDeafened
              ? 'bg-rose-500/80 text-white shadow-[0_0_16px_rgba(244,63,94,0.4)] border border-rose-400/40'
              : 'glass-pill text-slate-300 hover:text-white'
          }`}
          title={isDeafened ? 'Ativar Som' : 'Desativar Áudio'}
        >
          <Headphones className="w-4 h-4" />
        </button>

        {/* Share Screen */}
        <button
          onClick={() => {
            if (isScreenSharing) {
              stopScreenShare();
            } else {
              setIsScreenModalOpen(true);
            }
          }}
          className={`px-5 py-2.5 rounded-2xl flex items-center space-x-2 font-semibold text-xs transition-all shadow-xl btn-interactive ${
            isScreenSharing
              ? 'bg-emerald-500/80 text-white shadow-[0_0_16px_rgba(52,211,153,0.4)] border border-emerald-400/40'
              : 'glass-pill text-slate-300 hover:text-white'
          }`}
          title="Compartilhar Tela"
        >
          <Tv className="w-4 h-4" />
          <span>{isScreenSharing ? 'Parar Tela' : 'Compartilhar Tela'}</span>
        </button>

        {/* Music Bot */}
        <button
          onClick={() => setIsMusicModalOpen(true)}
          className="p-3 rounded-2xl glass-pill text-amber-300 hover:text-amber-200 transition-all shadow-xl btn-interactive"
          title="Abrir Player de Música"
        >
          <Disc3 className="w-4 h-4" />
        </button>

        {/* Disconnect Voice */}
        <button
          onClick={leaveVoiceChannel}
          className="p-3 rounded-2xl bg-rose-500/80 hover:bg-rose-600 text-white transition-all shadow-xl shadow-[0_0_16px_rgba(244,63,94,0.4)] btn-interactive border border-rose-400/40"
          title="Desconectar"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
