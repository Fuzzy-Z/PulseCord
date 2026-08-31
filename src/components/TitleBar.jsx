import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Copy, Radio, Disc3 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useServer } from '../context/ServerContext';

export const TitleBar = () => {
  const { isConnected, serverUrl } = useSocket();
  const { currentServer, currentChannel, setIsMusicModalOpen } = useServer();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.electronAPI?.onMaximizedChange) {
      window.electronAPI.onMaximizedChange((max) => {
        setIsMaximized(max);
      });
    }
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximize();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.close();
  };

  return (
    <div className="h-9 bg-sys-s2 backdrop-blur-2xl flex items-center justify-between px-3.5 text-xs text-sys-muted border-b border-sys-border select-none app-drag-region z-50">
      {/* Left: App Logo & Current Location */}
      <div className="flex items-center space-x-2.5 app-no-drag">
        <div className="flex items-center space-x-2 font-semibold tracking-tight cursor-default">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.5)]">
            <Radio className="w-3 h-3 text-sys-text" />
          </div>
          <span className="font-bold text-sys-text/90 text-[13px] tracking-wide">PulseCord</span>
        </div>
        <span className="text-sys-text/15">/</span>
        <span className="text-sys-muted font-medium truncate max-w-[200px] text-[11px]">
          {currentServer ? currentServer.name : 'Início'}
        </span>
        {currentChannel && (
          <>
            <span className="text-sys-text/15">/</span>
            <span className="text-sys-muted truncate max-w-[150px] text-[11px] font-medium">
              {currentChannel.name}
            </span>
          </>
        )}
      </div>

      {/* Center: Server Connection Status Badge */}
      <div className="flex items-center space-x-2.5 app-no-drag">
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full glass-pill text-[11px]">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`} />
          <span className={isConnected ? 'text-green-500 font-medium' : 'text-rose-400 font-medium'}>
            {isConnected ? 'Render Online' : 'Desconectado'}
          </span>
        </div>

        <button
          onClick={() => setIsMusicModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-full glass-pill text-amber-300 text-[11px] font-medium btn-interactive"
          title="Abrir Bot de Música"
        >
          <Disc3 className="w-3.5 h-3.5 animate-spin text-amber-300" style={{ animationDuration: '6s' }} />
          <span>Player de Áudio</span>
        </button>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center app-no-drag -mr-3.5 space-x-0.5">
        <button
          onClick={handleMinimize}
          className="w-10 h-9 flex items-center justify-center hover:bg-white/[0.08] text-sys-muted hover:text-sys-text transition-colors"
          title="Minimizar"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-9 flex items-center justify-center hover:bg-white/[0.08] text-sys-muted hover:text-sys-text transition-colors"
          title={isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
        </button>
        <button
          onClick={handleClose}
          className="w-10 h-9 flex items-center justify-center hover:bg-rose-500/80 text-sys-muted hover:text-sys-text transition-colors"
          title="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

