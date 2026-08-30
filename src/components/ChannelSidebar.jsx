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
    <div className="w-60 bg-discord-darker flex flex-col flex-shrink-0 select-none relative z-10">
      {/* Server Header Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
          className="w-full h-12 px-4 border-b border-discord-darkest flex items-center justify-between font-semibold text-discord-header hover:bg-discord-hover/50 transition"
        >
          <span className="truncate">{currentServer.name}</span>
          <ChevronDown
            className={`w-5 h-5 text-discord-muted transition-transform duration-200 ${
              isServerMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Server Dropdown Menu */}
        {isServerMenuOpen && (
          <div className="absolute top-14 left-2 right-2 bg-discord-darkest rounded-md p-1.5 shadow-xl border border-discord-darker z-30 space-y-1 text-sm">
            <button
              onClick={() => {
                setIsServerMenuOpen(false);
                setIsServerSettingsOpen(true);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded text-discord-text hover:bg-discord-brand hover:text-white transition"
            >
              <span>Configurações do Servidor</span>
              <Shield className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsServerMenuOpen(false);
                setCreateChannelType('text');
                setIsCreateChannelOpen(true);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded text-discord-text hover:bg-discord-brand hover:text-white transition"
            >
              <span>Criar Canal</span>
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsServerMenuOpen(false);
                setIsMusicModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded text-discord-yellow hover:bg-discord-hover transition"
            >
              <span>Bot de Música & Rádio</span>
              <Disc3 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Channels Scrollable List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Text Channels Header */}
        <div>
          <div className="flex items-center justify-between px-2 text-xs font-bold text-discord-channel uppercase tracking-wider mb-1">
            <span>Canais de Texto</span>
            <button
              onClick={() => {
                setCreateChannelType('text');
                setIsCreateChannelOpen(true);
              }}
              className="hover:text-discord-header transition"
              title="Criar Canal de Texto"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-0.5">
            {textChannels.map((channel) => {
              const isSelected = channel.id === currentChannelId;
              return (
                <button
                  key={channel.id}
                  onClick={() => selectChannel(channel.id)}
                  className={`w-full flex items-center px-2 py-1.5 rounded-md text-sm transition group ${
                    isSelected
                      ? 'bg-discord-active text-white'
                      : 'text-discord-channel hover:bg-discord-hover hover:text-discord-text'
                  }`}
                >
                  <Hash className="w-4 h-4 mr-1.5 text-discord-muted group-hover:text-discord-text flex-shrink-0" />
                  <span className="truncate">{channel.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Voice Channels Header */}
        <div>
          <div className="flex items-center justify-between px-2 text-xs font-bold text-discord-channel uppercase tracking-wider mb-1">
            <span>Canais de Voz</span>
            <button
              onClick={() => {
                setCreateChannelType('voice');
                setIsCreateChannelOpen(true);
              }}
              className="hover:text-discord-header transition"
              title="Criar Canal de Voz"
            >
              <Plus className="w-4 h-4" />
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
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition group ${
                      isConnectedHere
                        ? 'bg-discord-hover/80 text-discord-green font-medium'
                        : 'text-discord-channel hover:bg-discord-hover hover:text-discord-text'
                    }`}
                  >
                    <div className="flex items-center truncate">
                      <Volume2
                        className={`w-4 h-4 mr-1.5 flex-shrink-0 ${
                          isConnectedHere ? 'text-discord-green' : 'text-discord-muted group-hover:text-discord-text'
                        }`}
                      />
                      <span className="truncate">{channel.name}</span>
                    </div>

                    {isConnectedHere && (
                      <span className="text-[10px] bg-discord-green/20 text-discord-green px-1.5 py-0.5 rounded font-bold uppercase">
                        Conectado
                      </span>
                    )}
                  </button>

                  {/* Users inside this voice channel */}
                  {usersInThisChannel.length > 0 && (
                    <div className="pl-6 pr-2 py-1 space-y-1">
                      {usersInThisChannel.map((u) => {
                        const isSpeakingUser =
                          u.id === currentUser?.id ? isSpeaking : speakingUsers.has(u.socketId);

                        return (
                          <div
                            key={u.id}
                            className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-discord-dark/50 text-xs text-discord-text"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <div
                                className={`w-5 h-5 rounded-full bg-discord-darkest flex items-center justify-center text-xs border-2 transition-all ${
                                  isSpeakingUser
                                    ? 'border-discord-green shadow-[0_0_8px_rgba(35,165,90,0.8)]'
                                    : 'border-transparent'
                                }`}
                              >
                                {u.avatar || '👤'}
                              </div>
                              <span className="truncate font-medium">{u.username}</span>
                            </div>

                            {/* User status badges */}
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              {u.isScreenSharing && (
                                <span className="px-1 py-0.2 bg-discord-brand text-[9px] font-bold text-white rounded">
                                  AO VIVO
                                </span>
                              )}
                              {u.isMuted && <MicOff className="w-3 h-3 text-discord-red" />}
                              {u.isDeafened && <Headphones className="w-3 h-3 text-discord-red" />}
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
        <div className="p-2.5 bg-discord-darkest/90 border-t border-discord-dark flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative flex items-center justify-center">
                <Radio className="w-4 h-4 text-discord-green animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-discord-green leading-tight">Voz Conectada</span>
                <span className="text-[11px] text-discord-muted truncate max-w-[120px]">
                  {activeChannelObj?.name || 'Canal de Voz'}
                </span>
              </div>
            </div>

            <button
              onClick={leaveVoiceChannel}
              className="p-1.5 rounded hover:bg-discord-hover text-discord-muted hover:text-discord-red transition"
              title="Desconectar da Voz"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>

          {/* In-Call Quick Controls */}
          <div className="flex items-center justify-around pt-1 border-t border-discord-dark/50">
            <button
              onClick={() => setIsScreenModalOpen(true)}
              className={`flex-1 flex items-center justify-center py-1 rounded text-xs transition ${
                isScreenSharing
                  ? 'bg-discord-green/20 text-discord-green font-semibold'
                  : 'hover:bg-discord-hover text-discord-muted hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5 mr-1" />
              <span>{isScreenSharing ? 'Compartilhando' : 'Tela'}</span>
            </button>

            <button
              onClick={() => setIsMusicModalOpen(true)}
              className="flex-1 flex items-center justify-center py-1 rounded text-xs hover:bg-discord-hover text-discord-yellow transition"
            >
              <Disc3 className="w-3.5 h-3.5 mr-1" />
              <span>Música</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom User Bar */}
      <div className="h-[52px] bg-discord-darkest px-2 flex items-center justify-between border-t border-discord-darker">
        {/* User Info */}
        <div
          onClick={() => setIsUserSettingsOpen(true)}
          className="flex items-center space-x-2 p-1 rounded-md hover:bg-discord-hover cursor-pointer truncate mr-1"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-discord-brand flex items-center justify-center text-sm shadow">
              {currentUser?.avatar || '👑'}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-discord-green border-2 border-discord-darkest" />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-semibold text-discord-header truncate">
              {currentUser?.username || 'Usuário'}
            </span>
            <span className="text-[10px] text-discord-muted leading-none">Online</span>
          </div>
        </div>

        {/* User Audio & Settings Controls */}
        <div className="flex items-center space-x-0.5">
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded hover:bg-discord-hover transition ${
              isMuted ? 'text-discord-red' : 'text-discord-muted hover:text-white'
            }`}
            title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleDeafen}
            className={`p-1.5 rounded hover:bg-discord-hover transition ${
              isDeafened ? 'text-discord-red' : 'text-discord-muted hover:text-white'
            }`}
            title={isDeafened ? 'Desativar Áudio' : 'Ensurdecer'}
          >
            {isDeafened ? <Headphones className="w-4 h-4 text-discord-red" /> : <Headphones className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsUserSettingsOpen(true)}
            className="p-1.5 rounded hover:bg-discord-hover text-discord-muted hover:text-white transition"
            title="Configurações do Usuário"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
