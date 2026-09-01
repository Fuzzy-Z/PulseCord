import React from 'react';
import { Plus, MessageSquare, Settings, Compass, Sparkles } from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { VoxelLogo } from './VoxelLogo';

export const ServerSidebar = () => {
  const {
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
    return server.name ? server.name.substring(0, 2).toUpperCase() : 'VX';
  };

  return (
    <div className="w-[72px] bg-sys-s3 flex flex-col items-center py-3 space-y-2 flex-shrink-0 select-none z-20 border-r border-sys-border">
      {/* Direct Messages / Home icon */}
      <div className="relative group flex items-center justify-center w-full">
        {/* Indicator Pill */}
        <div 
          className={`absolute left-0 w-1 bg-sys-text rounded-r-full transition-all duration-200 ${
            activeView === 'dms' ? 'h-9' : 'h-0 group-hover:h-5'
          }`} 
        />
        <button
          onClick={() => setActiveView('dms')}
          className={`w-12 h-12 flex items-center justify-center transition-all duration-200 btn-interactive ${
            activeView === 'dms'
              ? 'rounded-[16px] bg-sys-accent text-white shadow-sm'
              : 'apple-squircle bg-sys-s2 border border-sys-border text-sys-muted hover:text-white hover:bg-sys-accent'
          }`}
          title="Início & Mensagens Diretas (Voxel)"
        >
          <VoxelLogo className="w-6 h-6" />
        </button>
      </div>

      <div className="w-8 h-[1px] bg-sys-border rounded-full my-1" />

      {/* Server List */}
      <div className="flex-1 w-full space-y-2 overflow-y-auto overflow-x-hidden flex flex-col items-center no-scrollbar py-1">
        {servers.map((server) => {
          const isSelected = server.id === currentServerId && activeView === 'server';
          const monogram = getMonogram(server);

          return (
            <div key={server.id} className="relative group flex items-center justify-center w-full">
              {/* Active Pill indicator */}
              <div
                className={`absolute left-0 w-1 bg-sys-text rounded-r-full transition-all duration-200 ${
                  isSelected ? 'h-9' : 'h-0 group-hover:h-5'
                }`}
              />

              <button
                onClick={() => {
                  setActiveView('server');
                  selectServer(server.id);
                }}
                className={`w-12 h-12 flex items-center justify-center font-bold text-xs tracking-wider transition-all duration-200 btn-interactive ${
                  isSelected
                    ? 'rounded-[16px] bg-sys-accent text-white shadow-sm'
                    : 'apple-squircle bg-sys-s2 border border-sys-border text-sys-muted hover:text-sys-text'
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
            className="w-12 h-12 apple-squircle bg-sys-s2 border border-sys-border text-emerald-400 hover:text-white hover:bg-emerald-600 flex items-center justify-center transition-all duration-200 shadow-sm btn-interactive"
            title="Criar um Servidor"
          >
            <Plus className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>
      </div>

      {/* Settings at bottom */}
      <div className="pt-2 border-t border-white/10 w-full flex justify-center">
        <button
          onClick={() => setIsUserSettingsOpen(true)}
          className="w-12 h-12 apple-squircle bg-sys-s2/80 border border-white/5 text-sys-muted hover:text-sys-text hover:bg-sys-s2 flex items-center justify-center transition-all duration-300 shadow-sm hover:border-sys-accent/30 group btn-interactive"
          title="Ajustes do Usuário"
        >
          <Settings className="w-5 h-5 transition-transform duration-500 group-hover:rotate-90 text-sys-muted group-hover:text-sys-accent" />
        </button>
      </div>
    </div>
  );
};
