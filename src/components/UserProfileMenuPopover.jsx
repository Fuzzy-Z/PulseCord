import React, { useState, useEffect } from 'react';
import { USER_STATUSES, StatusBadge, getStatusInfo } from './StatusBadge';
import { useSocket } from '../context/SocketContext';
import { useServer } from '../context/ServerContext';
import { AvatarImage } from './AvatarImage';
import {
  Edit3,
  ChevronRight,
  UserPlus,
  Gamepad2,
  Sparkles,
  LogOut,
  Check,
  X,
  Smile,
  Plus
} from 'lucide-react';

export const UserProfileMenuPopover = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, updateCurrentUser, logout } = useSocket();
  const { setIsUserSettingsOpen } = useServer();

  const [view, setView] = useState('main'); // 'main' | 'status' | 'custom_status' | 'game'
  const [customText, setCustomText] = useState(currentUser?.customStatus?.text || '');
  const [customEmoji, setCustomEmoji] = useState(currentUser?.customStatus?.emoji || '💬');
  const [gameText, setGameText] = useState(currentUser?.gameStatus || '');

  useEffect(() => {
    if (currentUser) {
      setCustomText(currentUser?.customStatus?.text || '');
      setCustomEmoji(currentUser?.customStatus?.emoji || '💬');
      setGameText(currentUser?.gameStatus || '');
    }
  }, [currentUser]);

  if (!isOpen || !currentUser) return null;

  const currentStatus = currentUser?.status || 'online';
  const statusInfo = getStatusInfo(currentStatus);

  const handleSelectStatus = async (statusId) => {
    updateCurrentUser({ ...currentUser, status: statusId });
    await updateProfile({ status: statusId });
    setView('main');
  };

  const handleSaveCustomStatus = async (e) => {
    e?.preventDefault();
    const updated = { text: customText.trim(), emoji: customEmoji };
    updateCurrentUser({ ...currentUser, customStatus: updated });
    await updateProfile({ customStatus: updated });
    setView('main');
  };

  const handleSaveGameStatus = async (e) => {
    e?.preventDefault();
    const updated = gameText.trim();
    updateCurrentUser({ ...currentUser, gameStatus: updated });
    await updateProfile({ gameStatus: updated });
    setView('main');
  };

  const defaultGradient = currentUser?.avatarColor || 'from-amber-700 to-stone-900';

  return (
    <>
      {/* Click-away backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
          setView('main');
        }}
      />

      {/* Popover Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-[60px] left-1.5 z-50 w-[268px] bg-[#111214] border border-[#232428] shadow-[0_20px_60px_rgba(0,0,0,0.95)] rounded-2xl overflow-hidden select-none text-sys-text animate-in fade-in slide-in-from-bottom-2 duration-150"
      >
        {/* Banner Top Area (Generous height so avatar never cuts off) */}
        <div className="relative h-24 w-full overflow-hidden bg-sys-s1 flex-shrink-0">
          {currentUser?.bannerUrl ? (
            <img
              src={currentUser.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-tr ${defaultGradient}`} />
          )}
        </div>

        {/* Avatar & Status Thought Bubble (Overlapping Header) */}
        <div className="relative px-3 pt-0 pb-1 flex-shrink-0">
          <div className="flex items-end justify-between -mt-8 mb-1.5">
            {/* Avatar with Status Badge */}
            <div className="relative p-1 bg-[#111214] rounded-full shadow-xl">
              {currentUser?.avatarUrl ? (
                <AvatarImage
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName || currentUser.username}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#111214]"
                />
              ) : (
                <div
                  className={`w-14 h-14 rounded-full bg-gradient-to-tr ${defaultGradient} flex items-center justify-center font-bold text-white text-lg border-2 border-[#111214]`}
                >
                  {(currentUser?.avatar || currentUser?.displayName || currentUser?.username || 'U')
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0.5 right-0.5 border-2 border-[#111214] rounded-full shadow-md">
                <StatusBadge status={currentStatus} size="sm" />
              </div>
            </div>

            {/* Thought / Status Bubble */}
            <button
              onClick={() => setView('custom_status')}
              className="relative -top-1 flex items-center gap-1.5 px-2.5 py-1 bg-[#232428] hover:bg-[#2b2d31] border border-white/5 rounded-2xl text-left transition shadow-md group max-w-[155px]"
              title="Editar status personalizado"
            >
              {/* Bubble Tail */}
              <div className="absolute -left-1 bottom-2 w-2 h-2 bg-[#232428] group-hover:bg-[#2b2d31] rotate-45 border-l border-b border-white/5 transition" />

              <span className="text-xs flex-shrink-0">
                {currentUser?.customStatus?.emoji ? (
                  currentUser.customStatus.emoji
                ) : (
                  <Plus className="w-3 h-3 text-sys-muted group-hover:text-white" />
                )}
              </span>
              <span className="text-[10px] text-gray-200 font-medium truncate italic">
                {currentUser?.customStatus?.text || (
                  <span className="text-sys-muted not-italic">Definir status...</span>
                )}
              </span>
            </button>
          </div>

          {/* Identity & Display Name */}
          <div className="px-0.5 pt-0.5">
            <h3 className="text-sm font-extrabold text-white tracking-tight leading-tight truncate">
              {currentUser?.displayName || currentUser?.username}
            </h3>
            <p className="text-[11px] text-sys-muted font-medium mt-0.5 truncate">
              @{currentUser?.username}
            </p>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="p-2.5 space-y-2 bg-[#111214]">
          {/* VIEW: MAIN MENU */}
          {view === 'main' && (
            <>
              {/* Rich Presence / Activity Card (Game / Activity) */}
              <div className="p-2.5 bg-[#1e1f22] rounded-xl border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-sys-muted">
                    {currentUser?.gameStatus ? 'Jogando' : 'Atividade'}
                  </span>
                  <button
                    onClick={() => setView('game')}
                    className="text-sys-muted hover:text-white text-[10px] font-medium"
                  >
                    {currentUser?.gameStatus ? 'Alterar' : '+ Adicionar'}
                  </button>
                </div>

                {currentUser?.gameStatus ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sys-accent/20 border border-sys-accent/30 flex items-center justify-center text-sys-accent flex-shrink-0 shadow-sm">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">
                        {currentUser.gameStatus}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-1">
                        <span>🎮</span> Em execução
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setView('game')}
                    className="w-full py-1.5 px-2 bg-[#2b2d31]/60 hover:bg-[#2b2d31] rounded-lg text-center text-[11px] text-sys-muted hover:text-white transition font-medium border border-dashed border-white/10"
                  >
                    Adicionar aos seus jogos...
                  </button>
                )}
              </div>

              {/* Actions Card 1: Edit Profile & Status Selector */}
              <div className="bg-[#1e1f22] rounded-xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => {
                    setIsUserSettingsOpen(true);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 hover:bg-[#2b2d31] transition text-left group"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Edit3 className="w-3.5 h-3.5 text-sys-muted group-hover:text-white transition" />
                    <span>Editar perfil</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-md bg-red-500/20 text-red-400 text-[8px] font-extrabold uppercase tracking-wider">
                    NOVO
                  </span>
                </button>

                <div className="h-[1px] bg-white/5 mx-2" />

                <button
                  onClick={() => setView('status')}
                  className="w-full flex items-center justify-between p-2 hover:bg-[#2b2d31] transition text-left group"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <StatusBadge status={currentStatus} size="sm" />
                    <span>{statusInfo.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-sys-muted group-hover:text-white transition" />
                </button>
              </div>

              {/* Actions Card 2: Switch Account / Logout */}
              <div className="bg-[#1e1f22] rounded-xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 hover:bg-rose-500/10 text-rose-400 transition text-left group"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Mudar de conta / Sair</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition" />
                </button>
              </div>
            </>
          )}

          {/* VIEW: STATUS PICKER SUBMENU */}
          {view === 'status' && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-right-2 duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-white/5 px-0.5">
                <span className="text-xs font-bold text-white">Definir Status</span>
                <button
                  onClick={() => setView('main')}
                  className="text-[11px] text-sys-muted hover:text-white"
                >
                  Voltar
                </button>
              </div>

              <div className="space-y-1">
                {USER_STATUSES.map((st) => {
                  const isSelected = currentStatus === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => handleSelectStatus(st.id)}
                      className={`w-full flex items-center justify-between p-1.5 rounded-xl transition text-left group ${
                        isSelected ? 'bg-[#2b2d31] font-bold' : 'hover:bg-[#1e1f22]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <StatusBadge status={st.id} size="sm" />
                        <div className="flex flex-col truncate">
                          <span className="text-xs text-white group-hover:text-sys-accent transition-colors">
                            {st.name}
                          </span>
                          <span className="text-[9px] text-sys-muted truncate">
                            {st.desc}
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sys-accent flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: CUSTOM STATUS EDIT */}
          {view === 'custom_status' && (
            <form onSubmit={handleSaveCustomStatus} className="space-y-2.5 animate-in fade-in slide-in-from-right-2 duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-white/5 px-0.5">
                <span className="text-xs font-bold text-white">Status Personalizado</span>
                <button
                  type="button"
                  onClick={() => setView('main')}
                  className="text-[11px] text-sys-muted hover:text-white"
                >
                  Voltar
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  className="w-8 h-8 text-center bg-[#1e1f22] border border-white/10 rounded-xl text-sm"
                  placeholder="💬"
                  maxLength={4}
                />
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="No que está pensando?"
                  className="flex-1 px-2.5 py-1.5 bg-[#1e1f22] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sys-accent"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-1.5 pt-0.5">
                {currentUser?.customStatus?.text && (
                  <button
                    type="button"
                    onClick={async () => {
                      await updateProfile({ customStatus: { text: '', emoji: '' } });
                      setView('main');
                    }}
                    className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl font-medium"
                  >
                    Limpar
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-sys-accent hover:bg-sys-accentHov text-white font-bold rounded-xl text-xs shadow-sm transition"
                >
                  Salvar
                </button>
              </div>
            </form>
          )}

          {/* VIEW: GAME / ACTIVITY EDIT */}
          {view === 'game' && (
            <form onSubmit={handleSaveGameStatus} className="space-y-2.5 animate-in fade-in slide-in-from-right-2 duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-white/5 px-0.5">
                <span className="text-xs font-bold text-white">Atividade / Jogo</span>
                <button
                  type="button"
                  onClick={() => setView('main')}
                  className="text-[11px] text-sys-muted hover:text-white"
                >
                  Voltar
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-sys-muted uppercase font-bold tracking-wider">
                  Nome do Jogo ou Atividade
                </label>
                <input
                  type="text"
                  value={gameText}
                  onChange={(e) => setGameText(e.target.value)}
                  placeholder="Ex: VALORANT, Terraria, Spotify..."
                  className="w-full px-2.5 py-1.5 bg-[#1e1f22] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sys-accent"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-1.5 pt-0.5">
                {currentUser?.gameStatus && (
                  <button
                    type="button"
                    onClick={async () => {
                      await updateProfile({ gameStatus: '' });
                      setView('main');
                    }}
                    className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl font-medium"
                  >
                    Limpar
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-sys-accent hover:bg-sys-accentHov text-white font-bold rounded-xl text-xs shadow-sm transition"
                >
                  Salvar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};
