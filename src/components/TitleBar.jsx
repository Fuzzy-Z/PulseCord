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
    <div className="h-8 bg-discord-darkest flex items-center justify-between px-3 text-xs text-discord-muted border-b border-discord-darker select-none app-drag-region z-50">
      {/* Left: App Logo & Current Location */}
      <div className="flex items-center space-x-2 app-no-drag">
        <div className="flex items-center space-x-1.5 font-bold text-discord-header tracking-wide">
          <span className="text-discord-brand text-sm">⚡</span>
          <span>PulseCord</span>
        </div>
        <span className="text-discord-muted/40">|</span>
        <span className="text-discord-text/90 font-medium truncate max-w-[200px]">
          {currentServer ? currentServer.name : 'Início'}
        </span>
        {currentChannel && (
          <>
            <span className="text-discord-muted/40">/</span>
            <span className="text-discord-muted truncate max-w-[150px]">
              {currentChannel.type === 'voice' ? '🔊 ' : '# '}{currentChannel.name}
            </span>
          </>
        )}
      </div>

      {/* Center: Server Connection Status Badge */}
      <div className="flex items-center space-x-2 app-no-drag">
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-discord-dark text-[11px]">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-discord-green animate-pulse' : 'bg-discord-red'}`} />
          <span className={isConnected ? 'text-discord-green font-medium' : 'text-discord-red'}>
            {isConnected ? 'Servidor Conectado' : 'Desconectado'}
          </span>
        </div>

        <button
          onClick={() => setIsMusicModalOpen(true)}
          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-discord-hover hover:bg-discord-active text-discord-header text-[11px] transition"
          title="Abrir Bot de Música"
        >
          <Disc3 className="w-3.5 h-3.5 text-discord-yellow animate-spin" style={{ animationDuration: '6s' }} />
          <span>Música</span>
        </button>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center app-no-drag">
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center hover:bg-discord-hover text-discord-muted hover:text-white transition"
          title="Minimizar"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center hover:bg-discord-hover text-discord-muted hover:text-white transition"
          title={isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center hover:bg-discord-red text-discord-muted hover:text-white transition"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
