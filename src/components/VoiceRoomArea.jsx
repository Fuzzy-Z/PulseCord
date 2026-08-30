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
    sendMusicControl
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
    <div className="flex-1 bg-discord-darkest flex flex-col h-full overflow-hidden select-none relative">
      {/* Voice Stage Header */}
      <div className="h-12 border-b border-discord-darker px-4 flex items-center justify-between flex-shrink-0 bg-discord-darker/60">
        <div className="flex items-center space-x-2">
          <Radio className="w-5 h-5 text-discord-green animate-pulse" />
          <span className="font-bold text-discord-header text-base">
            {activeChannelObj?.name || 'Canal de Voz'}
          </span>
          <span className="text-xs bg-discord-dark px-2 py-0.5 rounded text-discord-muted font-medium">
            {allParticipants.length} Conectado(s) • WebRTC HD 60fps
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMusicModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 bg-discord-dark hover:bg-discord-hover text-discord-yellow rounded text-xs font-semibold transition"
          >
            <Disc3 className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Bot de Música</span>
          </button>
        </div>
      </div>

      {/* Main Stage Grid / Spotlight Screen Share */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col items-center justify-center">
        {/* If local screen share is active */}
        {isScreenSharing && localScreenStream ? (
          <div className="w-full h-full max-w-5xl flex flex-col items-center justify-center relative rounded-xl overflow-hidden bg-black shadow-2xl border border-discord-brand/40">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-md text-xs font-bold text-white flex items-center space-x-2 backdrop-blur-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-discord-red animate-pulse" />
              <span>Sua Transmissão de Tela (60 FPS)</span>
            </div>
            <button
              onClick={stopScreenShare}
              className="absolute bottom-4 right-4 px-4 py-1.5 bg-discord-red hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-lg transition"
            >
              Parar Compartilhamento
            </button>
          </div>
        ) : remoteScreenShareEntry ? (
          /* Remote screen share display */
          <div className="w-full h-full max-w-5xl flex flex-col items-center justify-center relative rounded-xl overflow-hidden bg-black shadow-2xl border border-discord-brand">
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
            <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-md text-xs font-bold text-white flex items-center space-x-2 backdrop-blur-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-discord-red animate-pulse" />
              <span>Transmissão de Tela Ao Vivo</span>
            </div>
          </div>
        ) : (
          /* Participant Cards Grid */
          <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 auto-rows-fr items-center justify-center">
            {allParticipants.map((participant, idx) => (
              <div
                key={participant.id || idx}
                className="bg-discord-darker rounded-xl p-6 flex flex-col items-center justify-center relative shadow-lg border border-discord-dark/80 min-h-[190px] transition-all"
              >
                {/* Avatar with Speaking Glow Ring */}
                <div className="relative mb-3">
                  <div
                    className={`w-20 h-20 rounded-full bg-discord-darkest flex items-center justify-center text-3xl shadow-inner border-4 transition-all duration-150 ${
                      participant.isSpeaking
                        ? 'border-discord-green shadow-[0_0_20px_rgba(35,165,90,0.8)] scale-105'
                        : 'border-transparent'
                    }`}
                  >
                    {participant.avatar || '👤'}
                  </div>

                  {participant.isSpeaking && (
                    <div className="absolute -bottom-1 -right-1 bg-discord-green text-black text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                      Voz
                    </div>
                  )}
                </div>

                {/* Username */}
                <span className="font-bold text-discord-header text-sm truncate max-w-[160px]">
                  {participant.username}
                </span>

                {/* Status Badges */}
                <div className="absolute bottom-3 right-3 flex items-center space-x-1">
                  {participant.isMuted && (
                    <div className="p-1 bg-discord-darkest/80 rounded-full text-discord-red" title="Mutado">
                      <MicOff className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {participant.isDeafened && (
                    <div className="p-1 bg-discord-darkest/80 rounded-full text-discord-red" title="Ensurdecido">
                      <Headphones className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Music Bot Widget Bar (at bottom of voice) */}
      {musicPlayer.currentTrack && (
        <div className="bg-discord-darker px-4 py-2 border-t border-discord-dark flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate">
            <img
              src={musicPlayer.currentTrack.cover}
              alt="Track Cover"
              className="w-10 h-10 rounded-md object-cover shadow"
            />
            <div className="flex flex-col truncate">
              <div className="flex items-center space-x-1.5">
                <Disc3 className="w-3.5 h-3.5 text-discord-yellow animate-spin" />
                <span className="text-xs font-bold text-discord-header truncate">
                  {musicPlayer.currentTrack.title}
                </span>
              </div>
              <span className="text-[11px] text-discord-muted truncate">
                {musicPlayer.currentTrack.artist} • Pedido por: {musicPlayer.currentTrack.requestedBy || 'Bot'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() =>
                sendMusicControl(musicPlayer.isPlaying ? 'pause' : 'resume')
              }
              className="p-2 rounded-full bg-discord-hover hover:bg-discord-active text-white transition"
              title={musicPlayer.isPlaying ? 'Pausar' : 'Tocar'}
            >
              {musicPlayer.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => sendMusicControl('skip')}
              className="p-2 rounded-full bg-discord-hover hover:bg-discord-active text-discord-text transition"
              title="Pular Música"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => sendMusicControl('stop')}
              className="p-2 rounded-full bg-discord-hover hover:bg-discord-red text-discord-text transition"
              title="Parar Reprodução"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Discord Action Controls */}
      <div className="p-4 bg-discord-darkest/95 border-t border-discord-darker flex items-center justify-center space-x-3 z-20">
        {/* Toggle Mic */}
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full transition shadow-lg ${
            isMuted
              ? 'bg-discord-red text-white'
              : 'bg-discord-darker hover:bg-discord-hover text-discord-text'
          }`}
          title={isMuted ? 'Desmutar' : 'Mutar Microfone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Toggle Deafen */}
        <button
          onClick={toggleDeafen}
          className={`p-3 rounded-full transition shadow-lg ${
            isDeafened
              ? 'bg-discord-red text-white'
              : 'bg-discord-darker hover:bg-discord-hover text-discord-text'
          }`}
          title={isDeafened ? 'Ativar Som' : 'Desativar Áudio'}
        >
          <Headphones className="w-5 h-5" />
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
          className={`px-4 py-2.5 rounded-full flex items-center space-x-2 font-semibold text-xs transition shadow-lg ${
            isScreenSharing
              ? 'bg-discord-green text-white'
              : 'bg-discord-darker hover:bg-discord-brand text-discord-text hover:text-white'
          }`}
          title="Compartilhar Tela"
        >
          <Tv className="w-4 h-4" />
          <span>{isScreenSharing ? 'Parar Tela' : 'Compartilhar Tela'}</span>
        </button>

        {/* Music Bot */}
        <button
          onClick={() => setIsMusicModalOpen(true)}
          className="p-3 rounded-full bg-discord-darker hover:bg-discord-yellow hover:text-black text-discord-yellow transition shadow-lg"
          title="Abrir Painel de Música"
        >
          <Disc3 className="w-5 h-5" />
        </button>

        {/* Disconnect Voice */}
        <button
          onClick={leaveVoiceChannel}
          className="p-3 rounded-full bg-discord-red hover:bg-red-600 text-white transition shadow-lg"
          title="Desconectar"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
