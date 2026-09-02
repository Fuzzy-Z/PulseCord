import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Copy, Disc3, Settings, Menu, Search } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useServer } from '../context/ServerContext';
import { useVoice } from '../context/VoiceContext';
import { VoxelLogo } from './VoxelLogo';
import { ServerDock } from './ServerDock';

export const TitleBar = () => {
  const { isConnected } = useSocket();
  const {
    currentChannel,
    setIsMusicModalOpen,
    setIsUserSettingsOpen,
    setIsCommandPaletteOpen,
    navOpen,
    setNavOpen,
    unread
  } = useServer();
  const { musicPlayer } = useVoice();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.electronAPI?.onMaximizedChange) {
      window.electronAPI.onMaximizedChange((max) => {
        setIsMaximized(max);
      });
    }
  }, []);

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

  const isMusicPlaying = musicPlayer?.isPlaying && musicPlayer?.currentTrack;
  const unreadTotal = Object.values(unread || {}).reduce((sum, item) => sum + (item?.count || 0), 0);

  return (
    <div className="voxel-titlebar flex items-center justify-between px-3 text-xs text-sys-muted border-b border-sys-border select-none app-drag-region z-50 flex-shrink-0">
      {/* Left: Brand */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0 app-no-drag">
        <button
          type="button"
          onClick={() => setNavOpen(!navOpen)}
          className="voxel-mobile-only relative p-1.5 rounded-md hover:bg-sys-s3 text-sys-muted hover:text-sys-text"
          title="Canais"
        >
          <Menu className="w-4 h-4" />
          {unreadTotal > 0 && (
            <span className="voxel-badge voxel-badge--dot">{unreadTotal > 9 ? '9+' : unreadTotal}</span>
          )}
        </button>
        <div className="flex items-center gap-2 font-semibold tracking-tight cursor-default flex-shrink-0">
          <div className="w-6 h-6 flex items-center justify-center rounded-md bg-sys-accent/15 border border-sys-accent/25">
            <VoxelLogo className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sys-text text-[12px] tracking-tight hidden sm:block">Voxel</span>
        </div>

        {currentChannel && (
          <div className="hidden md:flex items-center gap-1.5 text-[11px] min-w-0">
            <span className="text-sys-border">|</span>
            <span className="text-sys-muted truncate max-w-[120px]">
              {currentChannel.type === 'dm' ? '@' : '#'}{currentChannel.name}
            </span>
          </div>
        )}
      </div>

      {/* Center: Server Dock */}
      <div className="flex-1 flex justify-center px-4 min-w-0 max-w-xl mx-auto">
        <ServerDock />
      </div>

      {/* Right: Status & Controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0 app-no-drag">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sys-muted hover:text-sys-text bg-sys-s3/60 border border-sys-border btn-interactive"
          title="Busca global (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Buscar</span>
          <kbd className="hidden xl:inline text-[9px] px-1 rounded bg-sys-s1 border border-sys-border">Ctrl+K</kbd>
        </button>
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-sys-s3/80 border border-sys-border text-[10px]">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
          <span className={`font-medium uppercase tracking-wider ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isConnected ? 'Online' : 'Off'}
          </span>
        </div>

        <button
          onClick={() => setIsMusicModalOpen(true)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition btn-interactive ${
            isMusicPlaying
              ? 'text-amber-300 border border-amber-400/20 bg-amber-400/10'
              : 'text-sys-muted hover:text-sys-text bg-sys-s3/60 border border-sys-border'
          }`}
          title="Abrir Player de Áudio"
        >
          <Disc3
            className={`w-3 h-3 ${isMusicPlaying ? 'animate-spin text-amber-300' : 'text-sys-muted'}`}
            style={{ animationDuration: '4s' }}
          />
          <span className="hidden lg:inline text-[11px] max-w-[100px] truncate">
            {isMusicPlaying
              ? musicPlayer.currentTrack.title.length > 14
                ? musicPlayer.currentTrack.title.substring(0, 12) + '…'
                : musicPlayer.currentTrack.title
              : 'Player'}
          </span>
        </button>

        <button
          onClick={() => setIsUserSettingsOpen(true)}
          className="p-1.5 rounded-md hover:bg-sys-s3 text-sys-muted hover:text-sys-text transition btn-interactive group"
          title="Ajustes"
        >
          <Settings className="w-3.5 h-3.5 transition-transform group-hover:rotate-45" />
        </button>

        <div className="w-px h-5 bg-sys-border mx-1" />

        <div className="flex items-center -mr-3">
          <button
            onClick={handleMinimize}
            className="w-10 h-9 flex items-center justify-center hover:bg-white/[0.06] text-sys-muted hover:text-sys-text transition-colors"
            title="Minimizar"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-10 h-9 flex items-center justify-center hover:bg-white/[0.06] text-sys-muted hover:text-sys-text transition-colors"
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
          >
            {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={handleClose}
            className="w-10 h-9 flex items-center justify-center hover:bg-rose-500 text-sys-muted hover:text-white transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
