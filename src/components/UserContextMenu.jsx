import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  AtSign,
  MessageSquare,
  VolumeX,
  Volume2,
  Headphones,
  ChevronRight,
  PhoneOff,
  Copy,
  Check,
  Shield,
  Volume1
} from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { useVoice } from '../context/VoiceContext';
import { useSocket } from '../context/SocketContext';

export const UserContextMenu = ({
  targetUser,
  position,
  onClose,
  onOpenProfile,
  onMention
}) => {
  const menuRef = useRef(null);
  const { currentServer, openDM } = useServer();
  const { currentUser } = useSocket();
  const {
    moveVoiceUser,
    disconnectVoiceUser,
    activeVoiceChannel,
    toggleUserMute,
    toggleUserDeafen,
    isUserMuted,
    isUserDeafened,
    userVolumes,
    setUserVolume
  } = useVoice();

  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const targetId = targetUser?.id || targetUser?.userId;
  const isMuted = targetId ? isUserMuted(targetId) : false;
  const isDeafened = targetId ? isUserDeafened(targetId) : false;

  // Check if current user has permission to move/kick members
  const isOwner = currentServer?.ownerId === currentUser?.id;
  const isHigherRole =
    currentUser?.roleId === 'role-admin' ||
    currentUser?.roleId === 'role-mod' ||
    currentUser?.id === 'usr-admin' ||
    currentServer?.roles?.find((r) => r.id === currentUser?.roleId)?.permissions?.includes('ADMIN') ||
    currentServer?.roles?.find((r) => r.id === currentUser?.roleId)?.permissions?.includes('MOVE_MEMBERS');

  const canMoveMembers = isOwner || isHigherRole;

  // Available voice channels in current server
  const voiceChannels = (currentServer?.channels || []).filter((c) => c.type === 'voice');

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!targetUser) return null;

  const isMe = targetUser.id === currentUser?.id;
  const name = targetUser.displayName || targetUser.username || 'Usuário';

  const handleCopyId = () => {
    // When account is logged in, prioritize the exact username
    const textToCopy = targetUser.username || targetUser.displayName || targetUser.id || 'usr';
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
      onClose();
    }, 900);
  };

  const handleMentionClick = () => {
    const mentionName = targetUser.username || targetUser.displayName || 'usuario';
    window.dispatchEvent(
      new CustomEvent('pulsecord-insert-mention', {
        detail: { username: mentionName, user: targetUser }
      })
    );
    if (onMention) onMention(targetUser);
    onClose();
  };

  const handleMoveTo = (channelId) => {
    if (!canMoveMembers) return;
    moveVoiceUser(targetUser.id, channelId, currentServer?.id);
    onClose();
  };

  const handleDisconnect = () => {
    if (!canMoveMembers) return;
    disconnectVoiceUser(targetUser.id, currentServer?.id);
    onClose();
  };

  // Adjust menu position so it doesn't overflow the viewport
  const style = {
    top: Math.min(position.y, window.innerHeight - 340),
    left: Math.min(position.x, window.innerWidth - 240)
  };

  return (
    <div
      ref={menuRef}
      style={style}
      className="fixed z-[9999] w-56 bg-[#111214] border border-white/10 rounded-xl shadow-2xl p-1.5 text-xs text-[#dbdee1] select-none animate-dropdown"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Perfil */}
      <button
        onClick={() => {
          onClose();
          if (onOpenProfile) onOpenProfile(targetUser);
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-sys-accent hover:text-white transition group"
      >
        <span className="font-medium">Perfil</span>
        <User className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
      </button>

      {/* Mencionar */}
      <button
        onClick={handleMentionClick}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-sys-accent hover:text-white transition group"
      >
        <span className="font-medium">Mencionar</span>
        <AtSign className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
      </button>

      {/* Mensagem Direta */}
      {!isMe && (
        <button
          onClick={() => {
            onClose();
            openDM(targetUser.id, targetUser);
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-sys-accent hover:text-white transition group"
        >
          <span className="font-medium">Mensagem</span>
          <MessageSquare className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      )}

      <div className="h-[1px] bg-white/[0.08] my-1" />

      {/* Silenciar (Checkbox) */}
      <button
        onClick={() => targetId && toggleUserMute(targetId)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-sys-accent hover:text-white transition group"
      >
        <span className="font-medium">Silenciar</span>
        <div
          className={`w-4 h-4 rounded border flex items-center justify-center transition ${
            isMuted ? 'bg-sys-accent border-sys-accent text-white' : 'border-white/30 bg-black/30'
          }`}
        >
          {isMuted && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </button>

      {/* Desativar áudio (Checkbox) */}
      <button
        onClick={() => targetId && toggleUserDeafen(targetId)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-sys-accent hover:text-white transition group"
      >
        <span className="font-medium">Desativar áudio</span>
        <div
          className={`w-4 h-4 rounded border flex items-center justify-center transition ${
            isDeafened ? 'bg-sys-accent border-sys-accent text-white' : 'border-white/30 bg-black/30'
          }`}
        >
          {isDeafened && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </button>

      {/* Friend Volume Slider if not me */}
      {!isMe && (
        <div className="px-2.5 py-2 my-0.5 bg-white/[0.03] rounded-lg border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-sys-muted">
            <span className="flex items-center gap-1 font-medium">
              <Volume2 className="w-3 h-3 text-sys-accent" />
              Volume do Usuário
            </span>
            <span className="font-mono text-[10px] font-bold text-white">
              {userVolumes[targetId] ?? 100}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={userVolumes[targetId] ?? 100}
            onChange={(e) => setUserVolume(targetId, Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sys-accent"
          />
        </div>
      )}

      <div className="h-[1px] bg-white/[0.08] my-1" />

      {/* Mover para > (Submenu with Voice Channels) */}
      <div
        className="relative"
        onMouseEnter={() => setShowMoveSubmenu(true)}
        onMouseLeave={() => setShowMoveSubmenu(false)}
      >
        <button
          disabled={!canMoveMembers || voiceChannels.length === 0}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition group ${
            canMoveMembers
              ? 'hover:bg-sys-accent hover:text-white cursor-pointer'
              : 'opacity-40 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="font-medium">Mover para</span>
            {!canMoveMembers && (
              <span className="text-[9px] bg-white/10 px-1 py-0.2 rounded text-sys-muted">Restrito</span>
            )}
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </button>

        {/* Submenu */}
        {showMoveSubmenu && canMoveMembers && (
          <div className="absolute left-full top-0 ml-1 w-48 bg-[#111214] border border-white/10 rounded-xl shadow-2xl p-1.5 text-xs text-[#dbdee1] space-y-0.5 animate-fadeIn z-[10000]">
            <div className="text-[10px] font-bold text-sys-muted uppercase px-2 py-1 tracking-wider">
              Canais de Voz
            </div>
            {voiceChannels.map((vc) => (
              <button
                key={vc.id}
                onClick={() => handleMoveTo(vc.id)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-sys-accent hover:text-white transition flex items-center justify-between truncate"
              >
                <span className="truncate">{vc.name}</span>
                {vc.id === activeVoiceChannel && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desconectar da chamada (Admin / Mod) */}
      {canMoveMembers && (
        <button
          onClick={handleDisconnect}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition group"
        >
          <span className="font-medium">Desconectar da chamada</span>
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="h-[1px] bg-white/[0.08] my-1" />

      {/* Copiar ID do Usuário */}
      <button
        onClick={handleCopyId}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-sys-accent hover:text-white transition group"
      >
        <span className="font-medium">{isCopied ? 'ID Copiado!' : 'Copiar ID do usuário'}</span>
        {isCopied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        )}
      </button>
    </div>
  );
};
