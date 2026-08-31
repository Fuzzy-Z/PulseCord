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
    setIsScreenModalOpen,
    mutedChannels,
    toggleMuteChannel
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
  const [contextMenuChannel, setContextMenuChannel] = useState(null);

  if (!currentServer) {
    return (
      <div className="w-60 bg-sys-base flex flex-col items-center justify-center text-sys-muted text-sm">
        Nenhum servidor selecionado
      </div>
    );
  }

  const textChannels = currentServer.channels.filter((c) => c.type === 'text');
  const voiceChannels = currentServer.channels.filter((c) => c.type === 'voice');

  const activeChannelObj = currentServer.channels.find(c => c.id === activeVoiceChannel);

  return (
    <div className="w-60 bg-sys-s1 flex flex-col flex-shrink-0 select-none relative z-10 border-r border-sys-border">
      {/* Server Header Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
          className="w-full h-12 px-4 border-b border-sys-border flex items-center justify-between font-semibold text-sys-text hover:bg-sys-s2 transition shadow-sm"
        >
          <span className="truncate tracking-tight font-bold text-[13px]">{currentServer.name}</span>
          <ChevronDown
            className={`w-4 h-4 text-sys-muted transition-transform duration-200 ${
              isServerMenuOpen ? 'rotate-180 text-sys-text' : ''
            }`}
          />
        </button>

        {/* Server Dropdown Menu */}
        {isServerMenuOpen && (
          <div className="absolute top-13 left-2 right-2 bg-sys-s3 rounded-2xl p-1.5 shadow-2xl border border-sys-border z-30 space-y-1 text-sm animate-dropdown">
            <button
              onClick={() => {
                setIsServerMenuOpen(false);
                setIsServerSettingsOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sys-muted hover:bg-sys-s2 hover:text-sys-text transition font-medium text-xs"
            >
              <span>Ajustes do Servidor</span>
              <Shield className="w-3.5 h-3.5 text-sys-accent" />
            </button>
            <button
              onClick={() => {
                setIsServerMenuOpen(false);
                setCreateChannelType('text');
                setIsCreateChannelOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sys-muted hover:bg-sys-s2 hover:text-sys-text transition font-medium text-xs"
            >
              <span>Novo Canal</span>
              <Plus className="w-3.5 h-3.5 text-sys-muted" />
            </button>
            <button
              onClick={() => {
                setIsServerMenuOpen(false);
                setIsMusicModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sys-muted hover:bg-sys-s2 hover:text-sys-text transition font-medium text-xs"
            >
              <span>Player de Música</span>
              <Disc3 className="w-3.5 h-3.5 text-sys-accent" />
            </button>
          </div>
        )}
      </div>

      {/* Channels Scrollable List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 thin-scrollbar">
        {/* Text Channels Header */}
        <div>
          <div className="flex items-center justify-between px-2 text-[10px] font-semibold text-sys-muted uppercase tracking-wider mb-1">
            <span className="cursor-default">Canais de Texto</span>
            <button
              onClick={() => {
                setCreateChannelType('text');
                setIsCreateChannelOpen(true);
              }}
              className="hover:text-sys-text transition p-0.5 rounded hover:bg-sys-s2"
              title="Criar Canal de Texto"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {textChannels.map((channel) => {
              const isSelected = channel.id === currentChannelId;
              const isMutedChan = !!mutedChannels[channel.id];

              return (
                <div key={channel.id} className="relative">
                  <button
                    onClick={() => selectChannel(channel.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenuChannel(contextMenuChannel === channel.id ? null : channel.id);
                    }}
                    className={`w-full flex items-center px-2.5 py-1.5 rounded-xl text-xs transition-all group ${
                      isSelected
                        ? 'bg-sys-accent/20 text-sys-text font-medium shadow-sm border border-sys-accent/30 backdrop-blur-md'
                        : isMutedChan 
                          ? 'text-sys-muted/50 hover:bg-sys-s2 hover:text-sys-muted'
                          : 'text-sys-muted hover:bg-sys-s2 hover:text-sys-text'
                    }`}
                  >
                    <Hash className={`w-3.5 h-3.5 mr-2 flex-shrink-0 transition-colors ${
                      isSelected ? 'text-sys-accent' : isMutedChan ? 'text-sys-muted/50' : 'text-sys-muted group-hover:text-sys-text'
                    }`} />
                    <span className={`truncate ${isMutedChan && !isSelected ? 'line-through decoration-sys-muted/50' : ''}`}>{channel.name}</span>
                  </button>

                  {/* Context Menu */}
                  {contextMenuChannel === channel.id && (
                    <div className="absolute left-6 top-8 bg-sys-s3 border border-sys-border shadow-2xl rounded-xl py-1 z-30 text-xs w-40">
                      <button 
                        onClick={() => { toggleMuteChannel(channel.id, 'forever'); setContextMenuChannel(null); }}
                        className="w-full text-left px-4 py-2 hover:bg-sys-s1 text-sys-text transition"
                      >
                        {isMutedChan ? 'Desmutar Canal' : 'Mutar Canal'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Voice Channels Header */}
        <div>
          <div className="flex items-center justify-between px-2 text-[10px] font-semibold text-sys-muted uppercase tracking-wider mb-1">
            <span className="cursor-default">Canais de Voz</span>
            <button
              onClick={() => {
                setCreateChannelType('voice');
                setIsCreateChannelOpen(true);
              }}
              className="hover:text-sys-text transition p-0.5 rounded hover:bg-sys-s2"
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
                        ? 'bg-sys-accent/20 text-sys-accent font-semibold border border-sys-accent/30 shadow-sm'
                        : 'text-sys-muted hover:bg-sys-s2 hover:text-sys-text'
                    }`}
                  >
                    <div className="flex items-center truncate">
                      <Volume2
                        className={`w-3.5 h-3.5 mr-2 flex-shrink-0 transition-colors ${
                          isConnectedHere ? 'text-sys-accent' : 'text-sys-muted group-hover:text-sys-text'
                        }`}
                      />
                      <span className="truncate">{channel.name}</span>
                    </div>

                    {isConnectedHere && (
                      <div className="flex items-center space-x-1">
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sys-accent opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sys-accent"></span>
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
                            className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-sys-s2 text-xs text-sys-text transition"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <div
                                className={`w-5 h-5 rounded-full bg-sys-s3 text-sys-text flex items-center justify-center text-[9px] font-bold border transition-all ${
                                  isSpeakingUser
                                    ? 'border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] scale-105'
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
                                <span className="px-1.5 py-0.2 bg-sys-accent text-[8px] font-bold text-white rounded-full">
                                  LIVE
                                </span>
                              )}
                              {u.isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                              {u.isDeafened && <Headphones className="w-3 h-3 text-red-400" />}
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
        <div className="p-3 bg-sys-s2 border-t border-sys-border flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative flex items-center justify-center">
                <Radio className="w-4 h-4 text-green-500 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-green-500 leading-tight">Voz Conectada</span>
                <span className="text-[10px] text-sys-muted truncate max-w-[120px]">
                  {activeChannelObj?.name || 'Canal de Voz'}
                </span>
              </div>
            </div>

            <button
              onClick={leaveVoiceChannel}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-sys-muted hover:text-red-500 transition btn-interactive"
              title="Desconectar da Voz"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>

          {/* In-Call Quick Controls */}
          <div className="flex items-center justify-around pt-2 border-t border-sys-border gap-1.5">
            <button
              onClick={() => setIsScreenModalOpen(true)}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs transition font-medium btn-interactive ${
                isScreenSharing
                  ? 'bg-sys-accent/20 text-sys-accent font-semibold border border-sys-accent/30'
                  : 'bg-sys-s3 border border-sys-border text-sys-muted hover:text-sys-text'
              }`}
            >
              <Tv className="w-3.5 h-3.5 mr-1" />
              <span>{isScreenSharing ? 'Ao Vivo' : 'Tela'}</span>
            </button>

            <button
              onClick={() => setIsMusicModalOpen(true)}
              className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs bg-sys-s3 border border-sys-border text-sys-text transition font-medium btn-interactive"
            >
              <Disc3 className="w-3.5 h-3.5 mr-1 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Música</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom User Bar */}
      <div className="h-[54px] bg-sys-s2 px-3 flex items-center justify-between border-t border-sys-border">
        {/* User Info */}
        <div
          onClick={() => setIsUserSettingsOpen(true)}
          className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-sys-s3 cursor-pointer truncate mr-1 transition group"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-sys-accent flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {(currentUser?.username || 'User').substring(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-sys-s2" />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-semibold text-sys-text truncate group-hover:text-sys-accent">
              {currentUser?.username || 'Usuário'}
            </span>
            <span className="text-[10px] text-sys-muted leading-none">Online</span>
          </div>
        </div>

        {/* User Audio & Settings Controls */}
        <div className="flex items-center space-x-0.5">
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded-lg transition btn-interactive ${
              isMuted ? 'text-red-500 bg-red-500/15' : 'text-sys-muted hover:text-sys-text hover:bg-sys-s3'
            }`}
            title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleDeafen}
            className={`p-1.5 rounded-lg transition btn-interactive ${
              isDeafened ? 'text-red-500 bg-red-500/15' : 'text-sys-muted hover:text-sys-text hover:bg-sys-s3'
            }`}
            title={isDeafened ? 'Ativar Som' : 'Ensurdecer'}
          >
            {isDeafened ? <Headphones className="w-3.5 h-3.5 text-red-500" /> : <Headphones className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsUserSettingsOpen(true)}
            className="p-1.5 rounded-lg hover:bg-sys-s3 text-sys-muted hover:text-sys-text transition btn-interactive group"
            title="Ajustes"
          >
            <Settings className="w-3.5 h-3.5 transition-transform group-hover:rotate-45" />
          </button>
        </div>
      </div>
    </div>
  );
};
