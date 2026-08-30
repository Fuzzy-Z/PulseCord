import React, { useState } from 'react';
import {
  Hash,
  Volume2,
  ChevronDown,
  Plus,
  Settings,
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Tv,
  Radio,
  UserPlus,
  Shield,
  Disc3
} from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { useVoice } from '../context/VoiceContext';
import { useSocket } from '../context/SocketContext';

export const ChannelSidebar = () => {
  const {
    currentServer,
    currentChannelId,
    selectChannel,
    voiceRooms,
    setIsServerSettingsOpen,
    setIsUserSettingsOpen,
    setIsCreateChannelOpen,
    setCreateChannelType,
    setIsMusicModalOpen,
    setIsScreenModalOpen
  } = useServer();

  const { currentUser } = useSocket();
  const {
    activeVoiceChannel,
    joinVoiceChannel,
    leaveVoiceChannel,
    isMuted,
    isDeafened,
    isSpeaking,
    speakingUsers,
    toggleMute,
    toggleDeafen,
    isScreenSharing,
    musicPlayer
  } = useVoice();

  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);

  if (!currentServer) {
    return (
      <div className="w-60 bg-discord-darker flex flex-col items-center justify-center text-discord-muted text-sm">
        Nenhum servidor selecionado
      </div>
    );
  }

  const textChannels = currentServer.channels.filter((c) => c.type === 'text');
  const voiceChannels = currentServer.channels.filter((c) => c.type === 'voice');

  const activeChannelObj = currentServer.channels.find(c => c.id === activeVoiceChannel);

  return (
    <div className="w-60 bg-black/25 backdrop-blur-2xl flex flex-col flex-shrink-0 select-none relative z-10 border-r border-white/[0.06]">
      {/* Server Header Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
          className="w-full h-12 px-4 border-b border-white/[0.06] flex items-center justify-between font-semibold text-white hover:bg-white/[0.04] transition shadow-sm"
        >
          <span className="truncate tracking-tight font-bold text-[13px]">{currentServer.name}</span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isServerMenuOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </button>

        {/* Server Dropdown Menu */}
        {isServerMenuOpen && (
          <div className="absolute top-13 left-2 right-2 glass-modal rounded-2xl p-1.5 shadow-2xl border border-white/10 z-30 space-y-1 text-sm animate-dropdown">
            <button
              onClick={() => {
                setIsServerMenuOpen(false);
                setIsServerSettingsOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition font-medium text-xs"
            >
              <span>Ajustes do Servidor</span>
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
            </button>
            <button
              onClick={() => {
                setIsServerMenuOpen(false);
                setCreateChannelType('text');
                setIsCreateChannelOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition font-medium text-xs"
            >
              <span>Novo Canal</span>
              <Plus className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => {
                setIsServerMenuOpen(false);
                setIsMusicModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-amber-300 hover:bg-white/10 transition font-medium text-xs"
            >
              <span>Player de Música</span>
              <Disc3 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Channels Scrollable List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 thin-scrollbar">
        {/* Text Channels Header */}
        <div>
          <div className="flex items-center justify-between px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span className="cursor-default">Canais de Texto</span>
            <button
              onClick={() => {
                setCreateChannelType('text');
                setIsCreateChannelOpen(true);
              }}
              className="hover:text-white transition p-0.5 rounded hover:bg-white/10"
              title="Criar Canal de Texto"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {textChannels.map((channel) => {
              const isSelected = channel.id === currentChannelId;
              return (
                <button
                  key={channel.id}
                  onClick={() => selectChannel(channel.id)}
                  className={`w-full flex items-center px-2.5 py-1.5 rounded-xl text-xs transition-all group ${
                    isSelected
                      ? 'bg-white/[0.12] text-white font-medium shadow-sm border border-white/10 backdrop-blur-md'
                      : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                  }`}
                >
                  <Hash className={`w-3.5 h-3.5 mr-2 flex-shrink-0 transition-colors ${
                    isSelected ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`} />
                  <span className="truncate">{channel.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Voice Channels Header */}
        <div>
          <div className="flex items-center justify-between px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span className="cursor-default">Canais de Voz</span>
            <button
              onClick={() => {
                setCreateChannelType('voice');
                setIsCreateChannelOpen(true);
              }}
              className="hover:text-white transition p-0.5 rounded hover:bg-white/10"
              title="Criar Canal de Voz"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {voiceChannels.map((channel) => {
              const isConnectedHere = activeVoiceChannel === channel.id;
              const usersInThisChannel = voiceRooms[channel.id] || [];

              return (
                <div key={channel.id} className="space-y-0.5">
                  <button
                    onClick={() => {
                      if (!isConnectedHere) {
                        joinVoiceChannel(channel.id, currentServer.id);
                      }
                      selectChannel(channel.id);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all group ${
                      isConnectedHere
                        ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25 shadow-sm'
                        : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center truncate">
                      <Volume2
                        className={`w-3.5 h-3.5 mr-2 flex-shrink-0 transition-colors ${
                          isConnectedHere ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{channel.name}</span>
                    </div>

                    {isConnectedHere && (
                      <div className="flex items-center space-x-1">
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Users inside this voice channel */}
                  {usersInThisChannel.length > 0 && (
                    <div className="pl-5 pr-2 py-1 space-y-1">
                      {usersInThisChannel.map((u) => {
                        const isSpeakingUser =
                          u.id === currentUser?.id ? isSpeaking : speakingUsers.has(u.socketId);
                        const initials = (u.username || 'User').substring(0, 2).toUpperCase();

                        return (
                          <div
                            key={u.id}
                            className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-white/[0.04] text-xs text-slate-300 transition"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <div
                                className={`w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[9px] font-bold border transition-all ${
                                  isSpeakingUser
                                    ? 'border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] scale-105'
                                    : 'border-transparent'
                                }`}
                              >
                                {initials}
                              </div>
                              <span className="truncate font-medium text-[11px]">{u.username}</span>
                            </div>

                            {/* User status badges */}
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              {u.isScreenSharing && (
                                <span className="px-1.5 py-0.2 bg-indigo-500/80 text-[8px] font-bold text-white rounded-full">
                                  LIVE
                                </span>
                              )}
                              {u.isMuted && <MicOff className="w-3 h-3 text-rose-400" />}
                              {u.isDeafened && <Headphones className="w-3 h-3 text-rose-400" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Voice Connected Status Box */}
      {activeVoiceChannel && (
        <div className="p-3 bg-black/40 backdrop-blur-xl border-t border-white/[0.06] flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative flex items-center justify-center">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-emerald-400 leading-tight">Voz Conectada</span>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {activeChannelObj?.name || 'Canal de Voz'}
                </span>
              </div>
            </div>

            <button
              onClick={leaveVoiceChannel}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition btn-interactive"
              title="Desconectar da Voz"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>

          {/* In-Call Quick Controls */}
          <div className="flex items-center justify-around pt-2 border-t border-white/[0.06] gap-1.5">
            <button
              onClick={() => setIsScreenModalOpen(true)}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs transition font-medium btn-interactive ${
                isScreenSharing
                  ? 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30'
                  : 'glass-pill text-slate-300 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5 mr-1" />
              <span>{isScreenSharing ? 'Ao Vivo' : 'Tela'}</span>
            </button>

            <button
              onClick={() => setIsMusicModalOpen(true)}
              className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs glass-pill text-amber-300 transition font-medium btn-interactive"
            >
              <Disc3 className="w-3.5 h-3.5 mr-1 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Música</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom User Bar */}
      <div className="h-[54px] bg-black/40 backdrop-blur-xl px-3 flex items-center justify-between border-t border-white/[0.06]">
        {/* User Info */}
        <div
          onClick={() => setIsUserSettingsOpen(true)}
          className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-white/[0.06] cursor-pointer truncate mr-1 transition group"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {(currentUser?.username || 'User').substring(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black" />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
              {currentUser?.username || 'Usuário'}
            </span>
            <span className="text-[10px] text-slate-500 leading-none">Online</span>
          </div>
        </div>

        {/* User Audio & Settings Controls */}
        <div className="flex items-center space-x-0.5">
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded-lg transition btn-interactive ${
              isMuted ? 'text-rose-400 bg-rose-500/15' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleDeafen}
            className={`p-1.5 rounded-lg transition btn-interactive ${
              isDeafened ? 'text-rose-400 bg-rose-500/15' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title={isDeafened ? 'Ativar Som' : 'Ensurdecer'}
          >
            {isDeafened ? <Headphones className="w-3.5 h-3.5 text-rose-400" /> : <Headphones className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsUserSettingsOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition btn-interactive group"
            title="Ajustes"
          >
            <Settings className="w-3.5 h-3.5 transition-transform group-hover:rotate-45" />
          </button>
        </div>
      </div>
    </div>
  );
};
