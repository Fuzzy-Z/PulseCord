import React from 'react';
import { X, Gamepad2, BadgeCheck, Sparkles, MessageSquare } from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { useSocket } from '../context/SocketContext';
import { AvatarImage } from './AvatarImage';

export const UserProfileCard = ({ user, onClose, inline = false }) => {
  if (!user) return null;

  const { openDM } = useServer();
  const { currentUser } = useSocket();

  const {
    id,
    displayName,
    username,
    avatarUrl,
    bannerUrl,
    avatar,
    avatarColor,
    bio,
    pronouns,
    customStatus,
    gameStatus,
  } = user;

  const isMe = Boolean(currentUser?.id && id && currentUser.id === id);
  const defaultGradient = avatarColor || 'from-indigo-500 to-purple-600';
  const nameToDisplay = displayName || username || 'Usuário';

  // Render Badges
  const renderBadges = () => {
    const userBadges = [];
    if (user?.id === 'usr-admin' || (typeof user?.id === 'string' && user.id.includes('owner'))) {
      userBadges.push({ id: 'staff', icon: <BadgeCheck className="w-4 h-4 text-emerald-400" />, tooltip: 'Staff' });
    }
    if (user?.createdAt) {
      try {
        const d = new Date(user.createdAt);
        if (!isNaN(d.getTime()) && d.getFullYear() < 2025) {
          userBadges.push({ id: 'early', icon: <Sparkles className="w-4 h-4 text-amber-400" />, tooltip: 'Early Supporter' });
        }
      } catch (e) {}
    }
    if (userBadges.length === 0) {
      userBadges.push({ id: 'hype', icon: <Sparkles className="w-4 h-4 text-fuchsia-400" />, tooltip: 'HypeSquad' });
    }

    return (
      <div className="flex bg-black/40 backdrop-blur-md rounded-lg px-2 py-1 space-x-1 absolute top-3 right-3 shadow-lg border border-white/5 z-10">
        {userBadges.map((b) => (
          <div key={b.id} title={b.tooltip} className="cursor-help hover:scale-110 transition-transform">
            {b.icon}
          </div>
        ))}
      </div>
    );
  };

  const cardContent = (
    <div 
      className="w-full max-w-[340px] bg-[#111214] rounded-2xl shadow-2xl overflow-hidden border border-white/10 relative select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Banner Section */}
      <div className="relative h-[120px] w-full bg-[#18191c] overflow-hidden">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-tr ${defaultGradient}`} />
        )}
        
        {onClose && !inline && (
          <button 
            onClick={onClose}
            className="absolute top-3 left-3 w-7 h-7 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {renderBadges()}
      </div>

      {/* Avatar Section (Overlapping) */}
      <div className="relative px-4 pb-4">
        <div className="absolute -top-10 left-4 p-1.5 bg-[#111214] rounded-full">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={nameToDisplay} className="w-20 h-20 rounded-full object-cover shadow-lg" />
          ) : (
            <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${defaultGradient} flex items-center justify-center text-2xl font-bold text-white shadow-lg`}>
              {(avatar || nameToDisplay || 'U').substring(0, 2).toUpperCase()}
            </div>
          )}
          
          {/* Status Indicator */}
          <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[#111214] ${user.status === 'online' ? 'bg-emerald-500' : 'bg-sys-muted'}`} />
        </div>

        <div className="pt-14 space-y-3">
          {/* Name & Identity */}
          <div className="bg-[#1E1F22] p-3 rounded-xl border border-white/5 shadow-inner">
            <h2 className="text-xl font-extrabold text-white leading-tight truncate">
              {nameToDisplay}
            </h2>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-sm font-medium text-sys-muted">@{username}</span>
              {pronouns && (
                <>
                  <span className="w-1 h-1 rounded-full bg-sys-muted/50" />
                  <span className="text-[11px] font-semibold text-sys-muted bg-white/5 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                    {pronouns}
                  </span>
                </>
              )}
            </div>

            {/* Custom Status */}
            {(customStatus?.text || customStatus?.emoji) && (
              <div className="mt-3 flex items-center space-x-2 text-sm text-gray-200">
                {customStatus?.emoji && <span>{customStatus.emoji}</span>}
                {customStatus?.text && <span className="truncate">{customStatus.text}</span>}
              </div>
            )}
          </div>

          <div className="bg-[#1E1F22] p-3.5 rounded-xl border border-white/5 space-y-4">
            {/* Action Buttons (Send DM) */}
            {!inline && !isMe && (
              <button
                type="button"
                onClick={() => {
                  const targetId = id || user.id || user.userId || user.authorId || user._id;
                  openDM(targetId || user, user);
                  if (onClose) onClose();
                }}
                className="w-full py-2.5 px-3 bg-sys-accent hover:bg-sys-accentHov text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition shadow-sm btn-interactive"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar Mensagem Direta</span>
              </button>
            )}

            {/* Bio */}
            {bio ? (
              <div>
                <h3 className="text-[10px] font-bold text-sys-muted uppercase tracking-wider mb-1.5">Sobre Mim</h3>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {bio}
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-[10px] font-bold text-sys-muted uppercase tracking-wider mb-1.5">Sobre Mim</h3>
                <p className="text-xs text-sys-muted italic">Nenhuma biografia adicionada.</p>
              </div>
            )}

            {/* Game Status */}
            {gameStatus && (
              <div>
                <h3 className="text-[10px] font-bold text-sys-muted uppercase tracking-wider mb-1.5">Atividade</h3>
                <div className="flex items-center space-x-3 bg-black/20 p-2.5 rounded-lg border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">Jogando</div>
                    <div className="text-sm font-bold text-gray-200 truncate">{gameStatus}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Member Since (Mock) */}
            <div>
              <h3 className="text-[10px] font-bold text-sys-muted uppercase tracking-wider mb-1">Membro do Voxel desde</h3>
              <p className="text-xs font-medium text-gray-400">
                {(() => {
                  try {
                    if (!user.createdAt) return 'Ago 2026';
                    const d = new Date(user.createdAt);
                    if (isNaN(d.getTime())) return 'Ago 2026';
                    return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                  } catch {
                    return 'Ago 2026';
                  }
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (inline) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 select-none animate-fadeIn" onClick={onClose}>
      <div className="animate-modal">
        {cardContent}
      </div>
    </div>
  );
};
