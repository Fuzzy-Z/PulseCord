import React from 'react';
import { Plus, MessageSquare, Settings } from 'lucide-react';
import { useServer } from '../context/ServerContext';

export const ServerSidebar = () => {
    servers,
    currentServerId,
    selectServer,
    activeView,
    setActiveView,
    setIsUserSettingsOpen,
    setIsAddServerOpen
  } = useServer();

  const getMonogram = (server) => {
    if (server.icon && server.icon.length <= 3 && !/[\uD800-\uDFFF]/.test(server.icon)) {
      return server.icon;
    }
    return server.name ? server.name.substring(0, 2).toUpperCase() : 'PC';
  };

  return (
    <div className="w-[72px] bg-sys-s3 flex flex-col items-center py-3 space-y-2 flex-shrink-0 select-none z-20 border-r border-sys-border">
      {/* Direct Messages / Home icon */}
      <div className="relative group flex items-center justify-center w-full">
        <div className={`absolute left-0 w-1 bg-sys-text rounded-r-full transition-all duration-200 ${activeView === 'dms' ? 'h-9' : 'h-0 group-hover:h-5'}`} />
        <button
          onClick={() => setActiveView('dms')}
          className={`w-12 h-12 flex items-center justify-center transition-all duration-200 shadow-md ${
            activeView === 'dms'
              ? 'rounded-[14px] bg-sys-accent text-white ring-2 ring-sys-s2 scale-105'
              : 'apple-squircle bg-sys-s2 border border-sys-border text-sys-muted group-hover:text-white group-hover:bg-sys-accent group-hover:border-sys-accent/20'
          }`}
          title="Mensagens Diretas"
        >
          <MessageSquare className={`w-5 h-5 transition-transform ${activeView !== 'dms' && 'group-hover:scale-105'}`} />
        </button>
      </div>

      <div className="w-8 h-[1px] bg-sys-border rounded-full my-1" />

      {/* Server List */}
      <div className="flex-1 w-full space-y-2.5 overflow-y-auto overflow-x-hidden flex flex-col items-center no-scrollbar py-1">
        {servers.map((server, index) => {
          const isSelected = server.id === currentServerId;
          const monogram = getMonogram(server);

          return (
            <div key={server.id} className="relative group flex items-center justify-center w-full">
              {/* Active Pill indicator */}
              <div
                className={`absolute left-0 w-1 bg-sys-text rounded-r-full transition-all duration-200 ${
                  isSelected && activeView === 'server' ? 'h-9' : 'h-0 group-hover:h-4'
                }`}
              />

              <button
                onClick={() => {
                  setActiveView('server');
                  selectServer(server.id);
                }}
                className={`w-12 h-12 flex items-center justify-center font-bold text-xs tracking-wider transition-all duration-200 shadow-sm ${
                  isSelected && activeView === 'server'
                    ? `rounded-[14px] bg-sys-accent text-white ring-2 ring-sys-s2 scale-105`
                    : 'apple-squircle bg-sys-s2 border border-sys-border text-sys-muted hover:text-sys-text hover:border-sys-accent/20'
                }`}
                title={server.name}
              >
                {monogram}
              </button>
            </div>
          );
        })}

        {/* Add Server Button */}
        <div className="relative group flex items-center justify-center w-full">
          <div className="absolute left-0 w-1 bg-sys-text rounded-r-full transition-all duration-200 h-0 group-hover:h-4" />
          <button
            onClick={() => setIsAddServerOpen(true)}
            className="w-12 h-12 apple-squircle bg-sys-s2 border border-sys-border text-green-500 group-hover:text-white group-hover:bg-green-500 flex items-center justify-center transition-all duration-200 shadow-sm"
            title="Criar um Servidor"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
          </button>
        </div>
      </div>

      {/* Settings at bottom */}
      <div className="pt-2 border-t border-sys-border w-full flex justify-center">
        <button
          onClick={() => setIsUserSettingsOpen(true)}
          className="w-12 h-12 apple-squircle bg-sys-s2 border border-sys-border text-sys-muted hover:text-sys-text flex items-center justify-center transition-all duration-200 shadow-sm hover:border-sys-accent/20 group"
          title="Ajustes do Usuário"
        >
          <Settings className="w-5 h-5 transition-transform group-hover:rotate-45 duration-300" />
        </button>
      </div>
    </div>
  );
};
