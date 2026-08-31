import React from 'react';
import { useServer } from '../context/ServerContext';
import { useSocket } from '../context/SocketContext';
import { MessageSquare, Users, PhoneCall, Plus } from 'lucide-react';

export const DMSidebar = () => {
  const { dms, selectDM, currentChannelId } = useServer();
  const { currentUser } = useSocket();

  return (
    <div className="w-60 bg-sys-s1 flex flex-col flex-shrink-0 select-none relative z-10 border-r border-sys-border">
      {/* Search / Header */}
      <div className="h-12 border-b border-sys-border px-4 flex items-center justify-center">
        <button className="w-full bg-sys-base text-sys-muted text-[11px] font-medium py-1.5 rounded-md border border-sys-border hover:bg-sys-s2 transition text-left px-3">
          Buscar conversa...
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 thin-scrollbar">
        {/* Friends & Nitro Links */}
        <div className="space-y-0.5">
          <button className="w-full flex items-center px-3 py-2 rounded-xl text-xs transition-all group bg-sys-accent/10 text-sys-accent font-medium shadow-sm border border-sys-accent/20">
            <Users className="w-4 h-4 mr-3" />
            <span>Amigos</span>
          </button>
          <button className="w-full flex items-center px-3 py-2 rounded-xl text-xs transition-all group text-sys-muted hover:bg-sys-s2 hover:text-sys-text">
            <div className="w-4 h-4 mr-3 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">N</span>
            </div>
            <span>Nitro</span>
          </button>
        </div>

        {/* DMs List */}
        <div>
          <div className="flex items-center justify-between px-2 text-[10px] font-semibold text-sys-muted uppercase tracking-wider mb-2 mt-2">
            <span className="cursor-default">Mensagens Diretas</span>
            <button className="hover:text-sys-text transition" title="Nova Mensagem">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {dms.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-sys-muted text-center italic">
                Nenhuma conversa ainda.
              </div>
            ) : (
              dms.map(dm => {
                const isSelected = dm.id === currentChannelId;
                return (
                  <button
                    key={dm.id}
                    onClick={() => selectDM(dm.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all group ${
                      isSelected
                        ? 'bg-sys-accent/20 text-sys-text font-medium shadow-sm border border-sys-accent/30'
                        : 'text-sys-muted hover:bg-sys-s2 hover:text-sys-text'
                    }`}
                  >
                    <div className="flex items-center truncate">
                      <div className="w-7 h-7 rounded-full bg-sys-s3 mr-2 flex items-center justify-center font-bold text-white shadow-sm border border-sys-border">
                        {(dm.name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{dm.name}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Profile Bar (Similar to ChannelSidebar) */}
      <div className="h-[54px] bg-sys-s2 px-3 flex items-center justify-between border-t border-sys-border">
        <div className="flex items-center space-x-2.5 p-1 rounded-xl truncate mr-1">
          <div className="w-8 h-8 rounded-full bg-sys-accent flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {(currentUser?.username || 'U').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-semibold text-sys-text truncate">
              {currentUser?.username || 'Usuário'}
            </span>
            <span className="text-[10px] text-sys-muted leading-none">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};
