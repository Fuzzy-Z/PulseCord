import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Copy, Radio, Disc3, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useServer } from '../context/ServerContext';
import { useVoice } from '../context/VoiceContext';
import { VoxelLogo } from './VoxelLogo';

export const TitleBar = () => {
  const { isConnected, serverUrl } = useSocket();
  const { currentServer, currentChannel, setIsMusicModalOpen } = useServer();
  const { musicPlayer, activeVoiceChannel } = useVoice();
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
  };

  const handleClose = () => {
    window.electronAPI?.close();
  };

  const isMusicPlaying = musicPlayer?.isPlaying && musicPlayer?.currentTrack;

  return (
    <div className="h-9 bg-sys-s2 flex items-center justify-between px-3 text-xs text-sys-muted border-b border-sys-border select-none app-drag-region z-50">
      {/* Left: App Logo & Current Location */}
      <div className="flex items-center space-x-2 app-no-drag">
        <div className="flex items-center space-x-2 font-semibold tracking-tight cursor-default">
          <div className="w-5 h-5 flex items-center justify-center">
            <VoxelLogo className="w-4 h-4" />
          </div>
          <span className="font-bold text-sys-text text-[12px] tracking-tight">Voxel</span>
        </div>
        
        <span className="text-white/10">/</span>
        
        <span className="text-sys-text/90 font-medium text-[11px] truncate max-w-[180px]">
          {currentServer ? currentServer.name : 'Início'}
        </span>

        {currentChannel && (
          <>
            <span className="text-white/10">/</span>
            <span className="text-sys-muted truncate max-w-[140px] text-[11px]">
              #{currentChannel.name}
            </span>
          </>
        )}
      </div>

      {/* Center: Connection Status & Music Shortcut */}
      <div className="flex items-center space-x-2 app-no-drag">
        <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/5 text-[11px]">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
          <span className={isConnected ? 'text-emerald-400 font-medium text-[10px] uppercase tracking-wider' : 'text-rose-400 font-medium text-[10px] uppercase tracking-wider'}>
            {isConnected ? 'Online' : 'Desconectado'}
          </span>
        </div>

        <button
          onClick={() => setIsMusicModalOpen(true)}
          className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition btn-interactive ${
            isMusicPlaying 
              ? 'text-amber-300 border border-amber-400/20 bg-amber-400/10' 
              : 'text-sys-muted hover:text-sys-text bg-white/[0.03] border border-white/5'
          }`}
          title="Abrir Player de Áudio"
        >
          <Disc3 className={`w-3 h-3 ${isMusicPlaying ? 'animate-spin text-amber-300' : 'text-sys-muted'}`} style={{ animationDuration: '4s' }} />
          <span className="text-[11px]">{isMusicPlaying ? (musicPlayer.currentTrack.title.length > 18 ? musicPlayer.currentTrack.title.substring(0, 16) + '...' : musicPlayer.currentTrack.title) : 'Player'}</span>
        </button>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center app-no-drag -mr-4 space-x-0.5">
        <button
          onClick={handleMinimize}
          className="w-11 h-10 flex items-center justify-center hover:bg-white/[0.08] text-sys-muted hover:text-sys-text transition-colors"
          title="Minimizar"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-11 h-10 flex items-center justify-center hover:bg-white/[0.08] text-sys-muted hover:text-sys-text transition-colors"
          title={isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
        </button>
        <button
          onClick={handleClose}
          className="w-11 h-10 flex items-center justify-center hover:bg-rose-500 text-sys-muted hover:text-white transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

