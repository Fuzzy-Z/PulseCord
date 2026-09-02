import React from 'react';
import { Video, X } from 'lucide-react';
import { useServer } from '../context/ServerContext';

export const ClipManagerModal = () => {
  const { isClipManagerOpen, setIsClipManagerOpen } = useServer();

  if (!isClipManagerOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 select-none">
      <div className="bg-sys-base w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-sys-border animate-modal">
        <div className="h-14 px-6 border-b border-sys-border bg-sys-s2 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Video className="w-5 h-5 text-sys-accent" />
            <h2 className="text-sm font-bold text-sys-text">Clipes</h2>
          </div>
          <button
            onClick={() => setIsClipManagerOpen(false)}
            className="p-2 text-sys-muted hover:text-sys-text hover:bg-sys-s3 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-10 text-center space-y-3">
          <Video className="w-10 h-10 mx-auto text-sys-muted opacity-40" />
          <h3 className="text-sm font-bold text-sys-text">Gravação ainda não está pronta</h3>
          <p className="text-xs text-sys-muted max-w-sm mx-auto leading-relaxed">
            A biblioteca de clipes sai da tela até a captura de tela e áudio funcionar de verdade. Nada de placeholders por enquanto.
          </p>
        </div>
      </div>
    </div>
  );
};
