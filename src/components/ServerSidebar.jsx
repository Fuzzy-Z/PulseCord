import React from 'react';
import { Plus, MessageSquare, Settings } from 'lucide-react';
import { useServer } from '../context/ServerContext';

export const ServerSidebar = () => {
  const {
    servers,
    currentServerId,
    selectServer,
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
    <div className="w-[72px] bg-black/35 backdrop-blur-2xl flex flex-col items-center py-3 space-y-2 flex-shrink-0 select-none z-20 border-r border-white/[0.06]">
      {/* Direct Messages / Home icon */}
      <div className="relative group flex items-center justify-center w-full">
        <div className="absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 h-0 group-hover:h-5" />
        <button
          onClick={() => servers.length > 0 && selectServer(servers[0].id)}
          className="w-12 h-12 apple-squircle glass-pill text-slate-300 group-hover:text-white flex items-center justify-center shadow-lg group-hover:bg-gradient-to-tr group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:border-white/20"
          title="Início"
        >
          <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-105" />
        </button>
      </div>

      <div className="w-8 h-[1px] bg-white/10 rounded-full my-1" />

      {/* Server List */}
      <div className="flex-1 w-full space-y-2.5 overflow-y-auto overflow-x-hidden flex flex-col items-center no-scrollbar py-1">
        {servers.map((server, index) => {
          const isSelected = server.id === currentServerId;
          const monogram = getMonogram(server);
          const gradients = [
            'from-indigo-600 to-purple-600',
            'from-sky-600 to-blue-600',
            'from-emerald-600 to-teal-600',
            'from-rose-600 to-pink-600',
            'from-amber-600 to-orange-600'
          ];
          const bgGrad = gradients[index % gradients.length];

          return (
            <div key={server.id} className="relative group flex items-center justify-center w-full">
              {/* Active Pill indicator */}
              <div
                className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
                  isSelected ? 'h-9' : 'h-0 group-hover:h-4'
                }`}
              />

              <button
                onClick={() => selectServer(server.id)}
                className={`w-12 h-12 flex items-center justify-center font-bold text-xs tracking-wider transition-all duration-200 shadow-lg ${
                  isSelected
                    ? `rounded-[14px] bg-gradient-to-tr ${bgGrad} text-white ring-2 ring-white/30 shadow-[0_0_16px_rgba(99,102,241,0.5)] scale-105`
                    : 'apple-squircle glass-pill text-slate-300 hover:text-white hover:border-white/25'
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
          <div className="absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 h-0 group-hover:h-4" />
          <button
            onClick={() => setIsAddServerOpen(true)}
            className="w-12 h-12 apple-squircle glass-pill text-emerald-400 group-hover:text-white group-hover:bg-gradient-to-tr group-hover:from-emerald-600 group-hover:to-teal-600 flex items-center justify-center transition-all duration-200 shadow-md group-hover:shadow-[0_0_16px_rgba(16,185,129,0.4)]"
            title="Criar um Servidor"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
          </button>
        </div>
      </div>

      {/* Settings at bottom */}
      <div className="pt-2 border-t border-white/[0.06] w-full flex justify-center">
        <button
          onClick={() => setIsUserSettingsOpen(true)}
          className="w-12 h-12 apple-squircle glass-pill text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200 shadow-md hover:border-white/20 group"
          title="Ajustes do Usuário"
        >
          <Settings className="w-5 h-5 transition-transform group-hover:rotate-45 duration-300" />
        </button>
      </div>
    </div>
  );
};
