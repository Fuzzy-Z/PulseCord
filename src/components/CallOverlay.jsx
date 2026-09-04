import React from 'react';
import { useVoice } from '../context/VoiceContext';
import { Phone, PhoneOff, PhoneCall } from 'lucide-react';
import { AvatarImage } from './AvatarImage';

export const CallOverlay = () => {
  const { incomingCall, outgoingCall, acceptDMCall, declineDMCall, cancelDMCall } = useVoice();

  if (!incomingCall && !outgoingCall) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4">
      {/* Incoming Call */}
      {incomingCall && (
        <div className="bg-sys-s2/95 backdrop-blur-xl border border-sys-border shadow-2xl rounded-2xl p-4 w-80 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              {incomingCall.caller?.avatarUrl ? (
                <AvatarImage 
                  src={incomingCall.caller.avatarUrl} 
                  alt={incomingCall.caller.username}
                  className="w-14 h-14 rounded-full object-cover shadow-md border border-sys-border"
                />
              ) : (
                <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${incomingCall.caller?.avatarColor || 'from-indigo-500 to-purple-600'} text-white flex items-center justify-center text-xl font-bold shadow-md`}>
                  {(incomingCall.caller?.username || 'U').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-sys-s2 rounded-full p-1">
                <div className="bg-green-500 rounded-full p-1.5 animate-bounce">
                  <Phone className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-green-400 font-bold tracking-widest uppercase mb-0.5">
                Chamada Recebida
              </div>
              <div className="text-sys-text font-semibold text-lg truncate">
                {incomingCall.caller?.displayName || incomingCall.caller?.username}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={declineDMCall}
              className="flex-1 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/30 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
              Recusar
            </button>
            <button
              onClick={acceptDMCall}
              className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors shadow-md shadow-green-500/20"
            >
              <PhoneCall className="w-4 h-4" />
              Aceitar
            </button>
          </div>
        </div>
      )}

      {/* Outgoing Call */}
      {outgoingCall && (
        <div className="bg-sys-s2/95 backdrop-blur-xl border border-sys-border shadow-2xl rounded-2xl p-4 w-80 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-sys-accent animate-pulse"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-sys-s3 flex items-center justify-center shadow-md border border-sys-border">
                 <PhoneCall className="w-6 h-6 text-sys-muted animate-pulse" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-sys-accent font-bold tracking-widest uppercase mb-0.5 animate-pulse">
                Chamando...
              </div>
              <div className="text-sys-text font-semibold text-sm truncate">
                Aguardando resposta
              </div>
            </div>
          </div>
          
          <button
            onClick={cancelDMCall}
            className="w-full py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/30 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            Cancelar Chamada
          </button>
        </div>
      )}
    </div>
  );
};
