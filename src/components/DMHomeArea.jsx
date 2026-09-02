import React, { useState } from 'react';
import { useServer } from '../context/ServerContext';
import { useSocket } from '../context/SocketContext';
import { MessageSquare, Users, Search, UserCheck, Sparkles, Gamepad2, Shield } from 'lucide-react';
import { UserProfileCard } from './UserProfileCard';
import { AvatarImage } from './AvatarImage';

export const DMHomeArea = () => {
  const { servers, onlineMembers, openDM, dms } = useServer();
  const { currentUser } = useSocket();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'online' | 'active'
  const [selectedUserForCard, setSelectedUserForCard] = useState(null);

  // Collect all unique members from all servers + online members
  const allKnownMembers = (() => {
    const memberMap = new Map();

    // Add server members
    servers.forEach((srv) => {
      (srv.members || []).forEach((m) => {
        if (m.id && m.id !== currentUser?.id) {
          memberMap.set(m.id, m);
        }
      });
    });

    // Add online members
    onlineMembers.forEach((om) => {
      if (om.id && om.id !== currentUser?.id) {
        memberMap.set(om.id, { ...memberMap.get(om.id), ...om });
      }
    });

    return Array.from(memberMap.values());
  })();

  const filteredMembers = allKnownMembers.filter((user) => {
    const name = (user.displayName || user.username || '').toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());

    const isOnline = onlineMembers.some((om) => om.id === user.id) || user.status === 'online';
    const hasActiveDM = dms.some((dm) => dm.participants?.includes(user.id) || dm.recipient?.id === user.id);

    if (!matchesSearch) return false;
    if (filterTab === 'online') return isOnline;
    if (filterTab === 'active') return hasActiveDM;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none voxel-workspace-inner">
      {/* Header Bar */}
      <div className="h-12 border-b border-sys-border px-6 flex items-center justify-between flex-shrink-0 bg-sys-s3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-sys-accent" />
            <h2 className="font-extrabold text-sys-text text-sm tracking-tight">Amigos & Membros</h2>
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-2" />

          {/* Filter Pills */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterTab === 'all'
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-sys-muted hover:text-sys-text hover:bg-white/[0.03]'
              }`}
            >
              Todos ({allKnownMembers.length})
            </button>
            <button
              onClick={() => setFilterTab('online')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterTab === 'online'
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-sys-muted hover:text-sys-text hover:bg-white/[0.03]'
              }`}
            >
              Online ({allKnownMembers.filter((u) => onlineMembers.some((om) => om.id === u.id) || u.status === 'online').length})
            </button>
            <button
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterTab === 'active'
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-sys-muted hover:text-sys-text hover:bg-white/[0.03]'
              }`}
            >
              Conversas Ativas ({dms.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 thin-scrollbar">
        {/* Search Input Bar */}
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-sys-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome de usuário para enviar mensagem..."
            className="w-full bg-sys-s2 text-sys-text text-xs pl-10 pr-4 py-2.5 rounded-xl border border-sys-border focus:outline-none focus:border-sys-accent transition placeholder-sys-muted shadow-sm"
          />
        </div>

        {/* Member Grid / List */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-sys-muted mb-3 px-1">
            {filterTab === 'all'
              ? `Membros Disponíveis (${filteredMembers.length})`
              : filterTab === 'online'
              ? `Membros Online (${filteredMembers.length})`
              : `Conversas em Andamento (${filteredMembers.length})`}
          </div>

          {filteredMembers.length === 0 ? (
            <div className="py-16 text-center text-sys-muted space-y-2 bg-sys-s1/40 rounded-2xl border border-white/5 p-8">
              <Users className="w-10 h-10 mx-auto text-sys-muted/40" />
              <p className="text-sm font-semibold text-sys-text">Nenhum membro encontrado.</p>
              <p className="text-xs text-sys-muted max-w-sm mx-auto">
                Quando outros usuários entrarem no servidor ou se cadastrarem, eles aparecerão aqui para troca de mensagens diretas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredMembers.map((user) => {
                const isOnline = onlineMembers.some((om) => om.id === user.id) || user.status === 'online';
                const name = user.displayName || user.username || 'Usuário';

                return (
                  <div
                    key={user.id}
                    className="p-3.5 bg-sys-s2 border border-sys-border hover:border-white/15 rounded-2xl transition flex items-center justify-between space-x-3 group shadow-sm"
                  >
                    <div
                      className="flex items-center space-x-3 truncate cursor-pointer flex-1"
                      onClick={() => setSelectedUserForCard(user)}
                    >
                      <div className="relative flex-shrink-0">
                        {user.avatarUrl ? (
                          <AvatarImage
                            src={user.avatarUrl}
                            alt={name}
                            className="w-10 h-10 rounded-full object-cover shadow-sm"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-tr ${
                              user.avatarColor || 'from-indigo-500 to-purple-600'
                            } flex items-center justify-center font-bold text-white text-xs shadow-sm`}
                          >
                            {(name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-sys-s2 ${
                            isOnline ? 'bg-emerald-500 shadow-sm' : 'bg-sys-muted'
                          }`}
                        />
                      </div>

                      <div className="truncate">
                        <div className="flex items-center space-x-1.5 truncate">
                          <span className="text-xs font-bold text-sys-text truncate group-hover:underline">
                            {name}
                          </span>
                        </div>
                        <span className="text-[10px] text-sys-muted block truncate">
                          @{user.username || 'usuario'}
                        </span>
                        {user.customStatus?.text && (
                          <span className="text-[10px] text-gray-300 truncate block mt-0.5">
                            {user.customStatus.text}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action button to open DM directly */}
                    <button
                      onClick={() => openDM(user.id, user)}
                      className="px-3 py-2 bg-sys-accent hover:bg-sys-accentHov text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-sm btn-interactive flex-shrink-0"
                      title="Enviar Mensagem Direta"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Conversar</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedUserForCard && (
        <UserProfileCard
          user={selectedUserForCard}
          onClose={() => setSelectedUserForCard(null)}
        />
      )}
    </div>
  );
};
