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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 select-none animate-in fade-in">
      <div className="bg-discord-dark w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-discord-darker">
        <div className="p-5 flex items-center justify-between border-b border-discord-darker">
          <h2 className="text-xl font-bold text-discord-header">Criar Canal</h2>
          <button
            onClick={() => setIsCreateChannelOpen(false)}
            className="text-discord-muted hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Channel Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-discord-muted mb-2">
              Tipo de Canal
            </label>
            <div className="space-y-2">
              <div
                onClick={() => setCreateChannelType('text')}
                className={`p-3 rounded-lg flex items-center space-x-3 cursor-pointer border transition ${
                  createChannelType === 'text'
                    ? 'bg-discord-hover border-discord-brand'
                    : 'bg-discord-darkest border-transparent hover:bg-discord-hover/50'
                }`}
              >
                <Hash className="w-6 h-6 text-discord-channel" />
                <div>
                  <div className="text-sm font-semibold text-discord-header">Texto</div>
                  <div className="text-xs text-discord-muted">
                    Poste mensagens, imagens, memes e comandos de bot
                  </div>
                </div>
              </div>

              <div
                onClick={() => setCreateChannelType('voice')}
                className={`p-3 rounded-lg flex items-center space-x-3 cursor-pointer border transition ${
                  createChannelType === 'voice'
                    ? 'bg-discord-hover border-discord-brand'
                    : 'bg-discord-darkest border-transparent hover:bg-discord-hover/50'
                }`}
              >
                <Volume2 className="w-6 h-6 text-discord-channel" />
                <div>
                  <div className="text-sm font-semibold text-discord-header">Voz & Vídeo</div>
                  <div className="text-xs text-discord-muted">
                    Converse por voz, compartilhe tela e ouça música junto
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-xs font-bold uppercase text-discord-muted mb-2">
              Nome do Canal
            </label>
            <div className="relative flex items-center bg-discord-darkest rounded border border-discord-dark focus-within:border-discord-brand">
              <span className="pl-3 text-discord-muted text-sm font-semibold">
                {createChannelType === 'text' ? '#' : '🔊'}
              </span>
              <input
                type="text"
                required
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder={createChannelType === 'text' ? 'novo-canal' : 'Sala de Conversa'}
                className="w-full bg-transparent px-2.5 py-2.5 text-discord-text text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Channel Topic (if text) */}
          {createChannelType === 'text' && (
            <div>
              <label className="block text-xs font-bold uppercase text-discord-muted mb-2">
                Tópico do Canal (Opcional)
              </label>
              <input
                type="text"
                value={channelTopic}
                onChange={(e) => setChannelTopic(e.target.value)}
                placeholder="Sobre o que é este canal?"
                className="w-full bg-discord-darkest text-discord-text px-3 py-2.5 rounded border border-discord-dark focus:border-discord-brand focus:outline-none text-sm"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-discord-darker">
            <button
              type="button"
              onClick={() => setIsCreateChannelOpen(false)}
              className="px-4 py-2 text-sm text-discord-text hover:underline"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-discord-brand hover:bg-discord-brandHover text-white rounded text-sm font-semibold transition"
            >
              Criar Canal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
