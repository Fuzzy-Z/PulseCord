import React, { useState } from 'react';
import { Hash, Volume2, X } from 'lucide-react';
import { useServer } from '../context/ServerContext';

export const CreateChannelModal = () => {
  const {
    isCreateChannelOpen,
    setIsCreateChannelOpen,
    createChannelType,
    setCreateChannelType,
    createChannel
  } = useServer();

  const [channelName, setChannelName] = useState('');
  const [channelTopic, setChannelTopic] = useState('');

  if (!isCreateChannelOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    createChannel(channelName.trim(), createChannelType, channelTopic.trim());
    setChannelName('');
    setChannelTopic('');
    setIsCreateChannelOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xl flex items-center justify-center z-50 p-4 select-none">
      <div className="glass-modal w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/15 animate-modal">
        <div className="p-5 flex items-center justify-between border-b border-white/[0.06] bg-black/30">
          <h2 className="text-lg font-bold text-white tracking-tight">Criar Novo Canal</h2>
          <button
            onClick={() => setIsCreateChannelOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition btn-interactive"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Channel Type Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Tipo de Canal
            </label>
            <div className="space-y-2">
              <div
                onClick={() => setCreateChannelType('text')}
                className={`p-3.5 rounded-2xl flex items-center space-x-3 cursor-pointer border transition ${
                  createChannelType === 'text'
                    ? 'bg-white/15 border-indigo-400 shadow-sm'
                    : 'bg-black/30 border-white/[0.04] hover:bg-white/[0.04]'
                }`}
              >
                <Hash className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Texto</div>
                  <div className="text-[10px] text-slate-400">
                    Mensagens, arquivos, anexos e comandos
                  </div>
                </div>
              </div>

              <div
                onClick={() => setCreateChannelType('voice')}
                className={`p-3.5 rounded-2xl flex items-center space-x-3 cursor-pointer border transition ${
                  createChannelType === 'voice'
                    ? 'bg-white/15 border-indigo-400 shadow-sm'
                    : 'bg-black/30 border-white/[0.04] hover:bg-white/[0.04]'
                }`}
              >
                <Volume2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Voz & Transmissão</div>
                  <div className="text-[10px] text-slate-400">
                    Comunicação por voz em tempo real e compartilhamento
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Nome do Canal
            </label>
            <div className="relative flex items-center glass-input rounded-2xl">
              <span className="pl-3.5 text-slate-400 text-xs font-semibold">
                {createChannelType === 'text' ? '#' : <Volume2 className="w-3.5 h-3.5" />}
              </span>
              <input
                type="text"
                required
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder={createChannelType === 'text' ? 'novo-canal' : 'Sala de Conversa'}
                className="w-full bg-transparent px-3 py-3 text-white text-xs focus:outline-none placeholder-slate-500"
              />
            </div>
          </div>

          {/* Channel Topic (if text) */}
          {createChannelType === 'text' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Tópico (Opcional)
              </label>
              <input
                type="text"
                value={channelTopic}
                onChange={(e) => setChannelTopic(e.target.value)}
                placeholder="Descrição curta deste canal"
                className="w-full glass-input text-white px-4 py-3 rounded-2xl text-xs focus:outline-none placeholder-slate-500"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setIsCreateChannelOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold transition shadow-lg btn-interactive"
            >
              Criar Canal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
