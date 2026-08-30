import React, { useState, useEffect } from 'react';
import { Tv, Monitor, AppWindow, X, Check } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';
import { useServer } from '../context/ServerContext';

export const ScreenShareModal = () => {
  const { isScreenModalOpen, setIsScreenModalOpen } = useServer();
  const { startScreenShare } = useVoice();

  const [activeTab, setActiveTab] = useState('screens'); // 'screens' or 'windows'
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const [frameRate, setFrameRate] = useState(60);
  const [resolution, setResolution] = useState('1080p');

  useEffect(() => {
    if (!isScreenModalOpen) return;

    const fetchSources = async () => {
      if (window.electronAPI?.getDesktopSources) {
        try {
          const rawSources = await window.electronAPI.getDesktopSources();
          setSources(rawSources);
          if (rawSources.length > 0) {
            setSelectedSourceId(rawSources[0].id);
          }
        } catch (e) {
          console.warn('Error fetching electron desktop sources:', e);
        }
      }
    };

    fetchSources();
  }, [isScreenModalOpen]);

  if (!isScreenModalOpen) return null;

  const screens = sources.filter((s) => s.id.startsWith('screen:'));
  const windows = sources.filter((s) => s.id.startsWith('window:'));

  const displayedSources = activeTab === 'screens' ? screens : windows;

  const handleConfirmShare = () => {
    startScreenShare(selectedSourceId);
    setIsScreenModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-150">
      <div className="bg-discord-dark w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-discord-darker flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 flex items-center justify-between border-b border-discord-darker">
          <div className="flex items-center space-x-2">
            <Tv className="w-6 h-6 text-discord-brand" />
            <h2 className="text-xl font-bold text-discord-header">Compartilhar Tela</h2>
          </div>
          <button
            onClick={() => setIsScreenModalOpen(false)}
            className="text-discord-muted hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Tabs: Screens vs Windows (if Electron sources available) */}
          {sources.length > 0 ? (
            <>
              <div className="flex border-b border-discord-darker pb-2 space-x-4">
                <button
                  onClick={() => setActiveTab('screens')}
                  className={`flex items-center space-x-2 pb-2 font-semibold text-sm transition border-b-2 -mb-2.5 ${
                    activeTab === 'screens'
                      ? 'border-discord-brand text-discord-header'
                      : 'border-transparent text-discord-muted hover:text-discord-text'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Telas Inteiras ({screens.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('windows')}
                  className={`flex items-center space-x-2 pb-2 font-semibold text-sm transition border-b-2 -mb-2.5 ${
                    activeTab === 'windows'
                      ? 'border-discord-brand text-discord-header'
                      : 'border-transparent text-discord-muted hover:text-discord-text'
                  }`}
                >
                  <AppWindow className="w-4 h-4" />
                  <span>Janelas de Aplicativos ({windows.length})</span>
                </button>
              </div>

              {/* Source Thumbnails Grid */}
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {displayedSources.map((src) => {
                  const isSelected = selectedSourceId === src.id;
                  return (
                    <div
                      key={src.id}
                      onClick={() => setSelectedSourceId(src.id)}
                      className={`group cursor-pointer rounded-lg p-2 bg-discord-darkest border-2 transition-all flex flex-col ${
                        isSelected
                          ? 'border-discord-brand shadow-[0_0_12px_rgba(88,101,242,0.4)]'
                          : 'border-transparent hover:border-discord-hover'
                      }`}
                    >
                      <div className="relative aspect-video rounded overflow-hidden bg-black/50 mb-2 flex items-center justify-center">
                        {src.thumbnail ? (
                          <img
                            src={src.thumbnail}
                            alt={src.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Monitor className="w-8 h-8 text-discord-muted" />
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-discord-brand text-white rounded-full flex items-center justify-center shadow">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-discord-header truncate">
                        {src.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Fallback prompt for browser display media */
            <div className="p-6 bg-discord-darkest rounded-lg text-center space-y-2">
              <Tv className="w-12 h-12 text-discord-brand mx-auto mb-2" />
              <h3 className="font-bold text-discord-header text-base">Transmissão de Tela Rápida</h3>
              <p className="text-discord-muted text-xs">
                O navegador ou sistema operacional abrirá a caixa de seleção nativa para você escolher
                a tela, janela de jogo ou aba que deseja transmitir em tempo real.
              </p>
            </div>
          )}

          {/* Stream Quality Settings */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-discord-muted mb-1.5">
                Resolução da Transmissão
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['720p', '1080p'].map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolution(res)}
                    className={`py-2 rounded text-xs font-semibold transition ${
                      resolution === res
                        ? 'bg-discord-brand text-white'
                        : 'bg-discord-darker hover:bg-discord-hover text-discord-text'
                    }`}
                  >
                    {res} {res === '1080p' && '✨ HD'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-discord-muted mb-1.5">
                Taxa de Quadros (FPS)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[30, 60].map((fps) => (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => setFrameRate(fps)}
                    className={`py-2 rounded text-xs font-semibold transition ${
                      frameRate === fps
                        ? 'bg-discord-brand text-white'
                        : 'bg-discord-darker hover:bg-discord-hover text-discord-text'
                    }`}
                  >
                    {fps} FPS {fps === 60 && '🚀'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-discord-darkest flex items-center justify-between border-t border-discord-darker">
          <span className="text-xs text-discord-muted">
            Transmissão ponto a ponto criptografada com baixa latência
          </span>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsScreenModalOpen(false)}
              className="px-4 py-2 text-sm text-discord-text hover:underline"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmShare}
              className="px-6 py-2 bg-discord-brand hover:bg-discord-brandHover text-white rounded-md text-sm font-semibold transition shadow-md"
            >
              Entrar Ao Vivo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
