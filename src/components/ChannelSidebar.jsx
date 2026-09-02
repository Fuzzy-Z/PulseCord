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
  Disc3,
  Move,
  MessageSquare
} from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { useVoice } from '../context/VoiceContext';
import { useSocket } from '../context/SocketContext';
import { UserContextMenu } from './UserContextMenu';
import { UserProfileCard } from './UserProfileCard';
import { AvatarImage } from './AvatarImage';

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
    toggleMuteChannel,
    navOpen,
    unread
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
    musicPlayer,
    watchTogetherState,
    moveVoiceUser,
    disconnectVoiceUser
  } = useVoice();

  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [contextMenuChannel, setContextMenuChannel] = useState(null);
  const [contextMenuUser, setContextMenuUser] = useState(null);
  const [selectedUserForCard, setSelectedUserForCard] = useState(null);
  const [dragOverChannelId, setDragOverChannelId] = useState(null);

  // Permission to move members (Owner, Admin, Mod)
  const isOwner = currentServer?.ownerId === currentUser?.id;
  const isHigherRole =
    currentUser?.roleId === 'role-admin' ||
    currentUser?.roleId === 'role-mod' ||
    currentUser?.id === 'usr-admin' ||
    currentServer?.roles?.find((r) => r.id === currentUser?.roleId)?.permissions?.includes('ADMIN') ||
    currentServer?.roles?.find((r) => r.id === currentUser?.roleId)?.permissions?.includes('MOVE_MEMBERS');

  const canMoveMembers = isOwner || isHigherRole;

  if (!currentServer) {
    return (
      <div className={`w-[280px] voxel-nav-panel flex flex-col items-center justify-center text-sys-muted text-sm ${navOpen ? 'is-open' : ''}`}>
        Nenhum servidor selecionado
      </div>
    );
  }

  const textChannels = currentServer.channels.filter((c) => c.type === 'text');
  const forumChannels = currentServer.channels.filter((c) => c.type === 'forum');
  const voiceChannels = currentServer.channels.filter((c) => c.type === 'voice');

  const activeChannelObj = currentServer.channels.find(c => c.id === activeVoiceChannel);

  return (
    <div className={`w-[280px] voxel-nav-panel flex flex-col flex-shrink-0 select-none relative z-10 ${navOpen ? 'is-open' : ''}`}>
      {/* Server Header Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
          className="w-full h-11 px-4 border-b border-sys-border flex items-center justify-between font-semibold text-sys-text hover:bg-sys-s2/50 transition"
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
                    className={`w-full flex items-center px-3 py-2 text-xs voxel-nav-item group ${
                      isSelected
                        ? 'voxel-nav-item--active'
                        : isMutedChan 
                          ? 'text-sys-muted/50'
                          : 'text-sys-muted'
                    }`}
                  >
                    <Hash className={`w-4 h-4 mr-2 flex-shrink-0 transition-colors ${
                      isSelected ? 'text-white' : isMutedChan ? 'text-sys-muted/50' : 'text-sys-muted group-hover:text-sys-text'
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
          <div className="flex items-center justify-between px-2 text-[10px] font-bold text-sys-muted uppercase tracking-wider mb-1">
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
              const isDropTarget = dragOverChannelId === channel.id;

              return (
                <div
                  key={channel.id}
                  onDragOver={(e) => {
                    if (canMoveMembers) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }
                  }}
                  onDragEnter={() => {
                    if (canMoveMembers) setDragOverChannelId(channel.id);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setDragOverChannelId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverChannelId(null);
                    if (!canMoveMembers) return;
                    try {
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (data.userId) {
                        moveVoiceUser(data.userId, channel.id, currentServer.id);
                      }
                    } catch (err) {
                      console.error('Error on voice drop:', err);
                    }
                  }}
                  className={`space-y-0.5 rounded-xl transition-all ${
                    isDropTarget
                      ? 'bg-sys-accent/15 ring-2 ring-sys-accent/60 shadow-lg'
                      : ''
                  }`}
                >
                  <button
                    onClick={() => {
                      if (!isConnectedHere) {
                        joinVoiceChannel(channel.id, currentServer.id);
                      }
                      selectChannel(channel.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs voxel-nav-item group ${
                      isConnectedHere
                        ? 'voxel-nav-item--active'
                        : 'text-sys-muted'
                    }`}
                  >
                    <div className="flex items-center truncate">
                      <Volume2
                        className={`w-4 h-4 mr-2 flex-shrink-0 transition-colors ${
                          isConnectedHere ? 'text-white' : 'text-sys-muted group-hover:text-sys-text'
                        }`}
                      />
                      <span className="truncate">{channel.name}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {isDropTarget && (
                        <span className="text-[9px] font-bold text-sys-accent bg-sys-accent/20 px-1 rounded animate-pulse">
                          Soltar aqui
                        </span>
                      )}
                      {isConnectedHere && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                      )}
                    </div>
                  </button>

                  {/* Users inside this voice channel */}
                  {usersInThisChannel.length > 0 && (
                    <div className="pl-4 pr-2 py-1 space-y-1">
                      {usersInThisChannel.map((u) => {
                        const isSpeakingUser =
                          u.id === currentUser?.id ? isSpeaking : speakingUsers.has(u.socketId);
                        const initials = (u.username || 'User').substring(0, 2).toUpperCase();

                        return (
                          <div
                            key={u.socketId || u.id}
                            draggable={canMoveMembers}
                            onDragStart={(e) => {
                              e.stopPropagation();
                              e.dataTransfer.setData(
                                'text/plain',
                                JSON.stringify({ userId: u.id, socketId: u.socketId, fromChannelId: channel.id })
                              );
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setContextMenuUser({
                                user: u,
                                x: e.clientX,
                                y: e.clientY
                              });
                            }}
                            onClick={() => setSelectedUserForCard(u)}
                            className={`h-7 flex items-center justify-between px-2 rounded-lg text-[11px] font-medium transition-colors border border-transparent group ${
                              canMoveMembers ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                            } ${
                              isSpeakingUser
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'text-sys-muted/80 hover:text-sys-text hover:bg-white/[0.04]'
                            }`}
                            title={canMoveMembers ? 'Clique com botão direito ou arraste para outra call' : 'Clique para ver o perfil'}
                          >
                            <div className="flex items-center space-x-2 truncate min-w-0">
                              <div className="relative flex-shrink-0 w-5 h-5">
                                {u.avatarUrl ? (
                                  <AvatarImage
                                    src={u.avatarUrl}
                                    alt="Avatar"
                                    isSpeaking={isSpeakingUser}
                                    className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10"
                                  />
                                ) : (
                                  <div
                                    className={`w-5 h-5 rounded-full bg-gradient-to-tr ${
                                      u.avatarColor || 'from-indigo-500 to-purple-600'
                                    } flex items-center justify-center text-[9px] text-white font-bold ring-1 ring-white/10`}
                                  >
                                    {initials}
                                  </div>
                                )}
                              </div>
                              <span className={`truncate font-medium text-[11px] transition-colors group-hover:underline ${
                                isSpeakingUser ? 'text-emerald-400 font-semibold' : 'text-sys-text/90'
                              }`}>
                                {u.displayName || u.username}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5 flex-shrink-0">
                              {/* Speaking Animated Equalizer Bars */}
                              {isSpeakingUser && (
                                <div className="flex items-center space-x-0.5 h-3 px-1">
                                  <span className="w-0.5 bg-emerald-400 rounded-full audio-bar-1" />
                                  <span className="w-0.5 bg-emerald-400 rounded-full audio-bar-2" />
                                  <span className="w-0.5 bg-emerald-400 rounded-full audio-bar-3" />
                                </div>
                              )}
                              {u.isMuted && <MicOff className="w-3 h-3 text-rose-400/80" />}
                              {u.isDeafened && <Headphones className="w-3 h-3 text-rose-400/80" />}
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
      <div className="h-[54px] bg-sys-s2/50 px-3 flex items-center justify-between border-t border-sys-border">
        {/* User Info */}
        <div
          onClick={() => setIsUserSettingsOpen(true)}
          className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-sys-s3 cursor-pointer truncate mr-1 transition group"
        >
          <div className="relative flex-shrink-0">
            {currentUser?.avatarUrl ? (
              <AvatarImage 
                src={currentUser.avatarUrl} 
                alt="Avatar" 
                isSpeaking={isSpeaking}
                className="w-8 h-8 rounded-full object-cover shadow-sm border border-white/10" 
              />
            ) : (
              <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentUser?.avatarColor || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                {(currentUser?.avatar || currentUser?.displayName || currentUser?.username || 'U').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-sys-s2" />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-semibold text-sys-text truncate group-hover:text-sys-accent">
              {currentUser?.displayName || currentUser?.username || 'Usuário'}
            </span>
            <span className="text-[10px] text-sys-muted leading-none truncate">
              {currentUser?.customStatus?.text ? `${currentUser.customStatus.emoji || ''} ${currentUser.customStatus.text}` : 'Online'}
            </span>
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

      {/* User Context Menu (Right Click on Voice Users) */}
      {contextMenuUser && (
        <UserContextMenu
          targetUser={contextMenuUser.user}
          position={{ x: contextMenuUser.x, y: contextMenuUser.y }}
          onClose={() => setContextMenuUser(null)}
          onOpenProfile={(u) => setSelectedUserForCard(u)}
        />
      )}

      {/* User Profile Card Modal */}
      {selectedUserForCard && (
        <UserProfileCard
          user={selectedUserForCard}
          onClose={() => setSelectedUserForCard(null)}
        />
      )}
    </div>
  );
};
