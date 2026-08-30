import React, { useState } from 'react';
import { Plus, Compass, MessageSquare, Settings, Disc } from 'lucide-react';
import { useServer } from '../context/ServerContext';

export const ServerSidebar = () => {
  const { servers, currentServerId, selectServer, createServer, setIsUserSettingsOpen } = useServer();
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerIcon, setNewServerIcon] = useState('🎮');

  const icons = ['🎮', '⚡', '🚀', '🔥', '🎧', '👾', '🌟', '💻', '🛡️', '🏆'];

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newServerName.trim()) return;
    createServer(newServerName.trim(), newServerIcon);
    setNewServerName('');
    setIsAddServerOpen(false);
  };

  return (
    <div className="w-[72px] bg-discord-darkest flex flex-col items-center py-3 space-y-2 flex-shrink-0 select-none z-20">
      {/* Direct Messages / Home icon */}
      <div className="relative group flex items-center justify-center w-full">
        <div className="absolute left-0 w-1 bg-white rounded-r transition-all duration-200 h-0 group-hover:h-5" />
        <button
          onClick={() => servers.length > 0 && selectServer(servers[0].id)}
          className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-discord-darker group-hover:bg-discord-brand text-discord-text group-hover:text-white flex items-center justify-center transition-all duration-200"
          title="Início / Mensagens Diretas"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>

      <div className="w-8 h-[2px] bg-discord-hover/60 rounded-full my-1" />

      {/* Server List */}
      <div className="flex-1 w-full space-y-2 overflow-y-auto overflow-x-hidden flex flex-col items-center no-scrollbar">
        {servers.map((server) => {
          const isSelected = server.id === currentServerId;
          return (
            <div key={server.id} className="relative group flex items-center justify-center w-full">
              {/* Active Pill indicator */}
              <div
                className={`absolute left-0 w-1 bg-white rounded-r transition-all duration-200 ${
                  isSelected ? 'h-10' : 'h-0 group-hover:h-5'
                }`}
              />

              <button
                onClick={() => selectServer(server.id)}
                className={`w-12 h-12 flex items-center justify-center font-semibold text-lg transition-all duration-200 shadow-md ${
                  isSelected
                    ? 'rounded-[16px] bg-discord-brand text-white'
                    : 'rounded-[24px] group-hover:rounded-[16px] bg-discord-darker group-hover:bg-discord-brand text-discord-text group-hover:text-white'
                }`}
                title={server.name}
              >
                {server.icon || server.name.charAt(0).toUpperCase()}
              </button>
            </div>
          );
        })}

        {/* Add Server Button */}
        <div className="relative group flex items-center justify-center w-full">
          <div className="absolute left-0 w-1 bg-white rounded-r transition-all duration-200 h-0 group-hover:h-5" />
          <button
            onClick={() => setIsAddServerOpen(true)}
            className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-discord-darker group-hover:bg-discord-green text-discord-green group-hover:text-white flex items-center justify-center transition-all duration-200"
            title="Criar um Servidor"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Settings at bottom */}
      <div className="pt-2">
        <button
          onClick={() => setIsUserSettingsOpen(true)}
          className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-discord-darker hover:bg-discord-hover text-discord-muted hover:text-white flex items-center justify-center transition-all duration-200"
          title="Configurações do Usuário"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Modal Criar Servidor */}
      {isAddServerOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-discord-dark w-full max-w-md rounded-lg shadow-2xl overflow-hidden border border-discord-darker">
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold text-discord-header">Crie seu servidor</h2>
              <p className="text-discord-muted text-sm mt-1">
                Seu servidor é onde você e seus amigos conversam por voz, vídeo e texto.
              </p>

              <form onSubmit={handleCreateSubmit} className="mt-6 text-left space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-discord-muted mb-2">
                    Ícone do Servidor
                  </label>
                  <div className="flex flex-wrap gap-2 justify-center py-2 bg-discord-darker rounded-lg">
                    {icons.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setNewServerIcon(ic)}
                        className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition ${
                          newServerIcon === ic ? 'bg-discord-brand ring-2 ring-white' : 'hover:bg-discord-hover'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-discord-muted mb-2">
                    Nome do Servidor
                  </label>
                  <input
                    type="text"
                    required
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    placeholder="Ex: Servidor dos Amigos"
                    className="w-full bg-discord-darkest text-discord-text px-3 py-2.5 rounded border border-transparent focus:border-discord-brand focus:outline-none text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-discord-darker">
                  <button
                    type="button"
                    onClick={() => setIsAddServerOpen(false)}
                    className="px-4 py-2 text-sm text-discord-text hover:underline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-discord-brand hover:bg-discord-brandHover text-white rounded text-sm font-medium transition"
                  >
                    Criar Servidor
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
