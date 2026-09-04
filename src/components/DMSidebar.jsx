import React, { useState, useRef } from 'react';
import { useServer } from '../context/ServerContext';
import { useSocket } from '../context/SocketContext';
import { useVoice } from '../context/VoiceContext';
import { MessageSquare, Users, Plus, Mic, MicOff, Headphones, Settings, Search, X, Check } from 'lucide-react';
import { AvatarImage } from './AvatarImage';
import { StatusBadge, getStatusInfo } from './StatusBadge';
import { UserProfileMenuPopover } from './UserProfileMenuPopover';

export const DMSidebar = () => {
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);
  const statusAnchorRef = useRef(null);
  const { dms, selectDM, openDM, currentChannelId, onlineMembers, setIsUserSettingsOpen, unread } = useServer();
  const { currentUser } = useSocket();
  const { isMuted, isDeafened, toggleMute, toggleDeafen } = useVoice();

  const [searchQuery, setSearchQuery] = useState('');
  const [isNewDMOpen, setIsNewDMOpen] = useState(false);
  const [newDMSearch, setNewDMSearch] = useState('');

  const filteredDMs = dms.filter((dm) =>
    (dm.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Available users to message (excluding self)
  const availableUsers = onlineMembers.filter(
    (u) => u.id !== currentUser?.id
  ).filter((u) =>
    (u.displayName || u.username || '').toLowerCase().includes(newDMSearch.toLowerCase())
  );

  return (
    <div className="w-[280px] voxel-nav-panel flex flex-col flex-shrink-0 select-none relative z-10">
      {/* Search Header */}
      <div className="h-11 border-b border-sys-border px-3 flex items-center">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-sys-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversa..."
            className="w-full bg-sys-base text-sys-text text-xs pl-8 pr-3 py-1.5 rounded-lg border border-sys-border focus:outline-none focus:border-sys-accent transition placeholder-sys-muted"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 thin-scrollbar">
        {/* Friends & Directory Link */}
        <div className="space-y-0.5">
          <button 
            onClick={() => selectDM('dm-home')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition group ${
              !currentChannelId || currentChannelId === 'dm-home' || currentChannelId === 'dm-inbox'
                ? 'bg-white/[0.08] text-white'
                : 'bg-white/[0.04] text-sys-text hover:bg-white/[0.08]'
            }`}
          >
            <Users className="w-4 h-4 mr-2.5 text-sys-accent" />
            <span>Amigos & Membros</span>
          </button>
        </div>

        {/* DMs List */}
        <div>
          <div className="flex items-center justify-between px-2 text-[10px] font-bold text-sys-muted uppercase tracking-wider mb-2">
            <span className="cursor-default">Mensagens Diretas</span>
            <button
              onClick={() => setIsNewDMOpen(true)}
              className="hover:text-sys-text transition p-1 rounded hover:bg-sys-s2"
              title="Nova Mensagem Direta"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {filteredDMs.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-sys-muted italic">Nenhuma conversa ativa.</p>
                <button
                  onClick={() => setIsNewDMOpen(true)}
                  className="mt-2 text-xs text-sys-accent hover:underline font-semibold"
                >
                  + Enviar uma DM
                </button>
              </div>
            ) : (
              filteredDMs.map((dm) => {
                const isSelected = dm.id === currentChannelId;
                const recipient = dm.recipient;
                const isOnline = recipient?.status === 'online';

                return (
                  <button
                    key={dm.id}
                    onClick={() => selectDM(dm.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition group ${
                      isSelected
                        ? 'bg-white/[0.08] text-white font-semibold'
                        : 'text-sys-muted hover:bg-white/[0.04] hover:text-sys-text'
                    }`}
                  >
                    <div className="flex items-center truncate space-x-2.5">
                      <div className="relative flex-shrink-0">
                        {recipient?.avatarUrl ? (
                          <AvatarImage
                            src={recipient.avatarUrl}
                            alt={dm.name}
                            className="w-7 h-7 rounded-full object-cover shadow-sm"
                          />
                        ) : (
                          <div
                            className={`w-7 h-7 rounded-full bg-gradient-to-tr ${
                              recipient?.avatarColor || 'from-indigo-500 to-purple-600'
                            } flex items-center justify-center font-bold text-white text-[11px] shadow-sm`}
                          >
                            {(dm.name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-sys-s1 ${
                            isOnline ? 'bg-emerald-500' : 'bg-sys-muted'
                          }`}
                        />
                      </div>
                      <div className="flex flex-col text-left truncate">
                        <span className="truncate leading-tight font-medium text-sys-text">
                          {dm.name}
                        </span>
                        {dm.lastMessage && (
                          <span className="text-[10px] text-sys-muted truncate max-w-[120px]">
                            {dm.lastMessage}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Unread badge */}
                    {(() => {
                      const dmUnread = unread?.[dm.id];
                      const count = dmUnread?.count || 0;
                      if (!count || isSelected) return null;
                      return (
                        <span className="voxel-dm-badge flex-shrink-0">
                          {count > 99 ? '99+' : count}
                        </span>
                      );
                    })()}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* New DM Modal */}
      {isNewDMOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setIsNewDMOpen(false)}
        >
          <div
            className="bg-sys-base border border-sys-border w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 animate-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-sys-text">Selecionar Amigo para Conversar</h3>
              <button
                onClick={() => setIsNewDMOpen(false)}
                className="text-sys-muted hover:text-sys-text p-1 rounded-lg hover:bg-sys-s2 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={newDMSearch}
              onChange={(e) => setNewDMSearch(e.target.value)}
              placeholder="Digite o nome do usuário..."
              className="w-full bg-sys-s1 text-sys-text text-xs px-3 py-2 rounded-xl border border-sys-border focus:outline-none focus:border-sys-accent placeholder-sys-muted"
            />

            <div className="max-h-60 overflow-y-auto space-y-1 thin-scrollbar">
              {availableUsers.length === 0 ? (
                <div className="py-6 text-center text-xs text-sys-muted">
                  Nenhum outro usuário encontrado online no momento.
                </div>
              ) : (
                availableUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      openDM(user.id);
                      setIsNewDMOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-sys-s2 transition group text-left"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="relative">
                        {user.avatarUrl ? (
                          <AvatarImage
                            src={user.avatarUrl}
                            alt={user.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-tr ${
                              user.avatarColor || 'from-indigo-500 to-purple-600'
                            } flex items-center justify-center font-bold text-white text-xs`}
                          >
                            {(user.displayName || user.username || 'U').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-sys-s2 ${
                            user.status === 'online' ? 'bg-emerald-500' : 'bg-sys-muted'
                          }`}
                        />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-sys-text truncate">
                          {user.displayName || user.username}
                        </div>
                        <div className="text-[10px] text-sys-muted">@{user.username}</div>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-sys-accent group-hover:underline">
                      Conversar
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Profile Bar */}
      <div className="relative h-[52px] bg-sys-s2/50 px-3 flex items-center justify-between border-t border-sys-border flex-shrink-0">
        <UserProfileMenuPopover
          isOpen={isStatusPickerOpen}
          onClose={() => setIsStatusPickerOpen(false)}
          anchorRef={statusAnchorRef}
        />

        <div
          ref={statusAnchorRef}
          onClick={(e) => {
            e.stopPropagation();
            setIsStatusPickerOpen((prev) => !prev);
          }}
          className="flex items-center space-x-2 p-1 -ml-1 rounded-lg hover:bg-sys-s1 cursor-pointer transition truncate mr-1 group"
          title="Ver perfil e opções"
        >
          <div className="relative flex-shrink-0">
            {currentUser?.avatarUrl ? (
              <AvatarImage
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                className="w-8 h-8 rounded-full object-cover shadow-sm group-hover:opacity-80 transition"
              />
            ) : (
              <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentUser?.avatarColor || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:opacity-80 transition`}>
                {(currentUser?.username || 'U').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-0 right-0 border-2 border-sys-s2 rounded-full shadow-sm">
              <StatusBadge status={currentUser?.status || 'online'} size="xs" />
            </div>
          </div>

          <div className="flex flex-col truncate">
            <span className="text-xs font-bold text-sys-text truncate leading-tight group-hover:text-sys-accent transition-colors">
              {currentUser?.displayName || currentUser?.username || 'Usuário'}
            </span>
            <span className="text-[10px] text-sys-muted truncate leading-tight flex items-center gap-1">
              {currentUser?.customStatus?.text ? (
                <>
                  {currentUser.customStatus.emoji && <span>{currentUser.customStatus.emoji}</span>}
                  <span className="truncate">{currentUser.customStatus.text}</span>
                </>
              ) : (
                <span>{getStatusInfo(currentUser?.status)?.name || 'Disponível'}</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-0.5">
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded-lg transition ${
              isMuted ? 'text-rose-400 bg-rose-500/10' : 'text-sys-muted hover:text-sys-text hover:bg-sys-s1'
            }`}
            title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleDeafen}
            className={`p-1.5 rounded-lg transition ${
              isDeafened ? 'text-rose-400 bg-rose-500/10' : 'text-sys-muted hover:text-sys-text hover:bg-sys-s1'
            }`}
            title={isDeafened ? 'Desativar Áudio' : 'Silenciar Áudio'}
          >
            <Headphones className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsUserSettingsOpen(true)}
            className="p-1.5 rounded-lg text-sys-muted hover:text-sys-text hover:bg-sys-s1 transition"
            title="Configurações do Usuário"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
