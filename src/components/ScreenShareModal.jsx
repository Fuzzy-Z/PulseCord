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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xl flex items-center justify-center z-50 p-4 select-none">
      <div className="glass-modal w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/15 flex flex-col max-h-[85vh] animate-modal">
        {/* Modal Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/[0.06] bg-black/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <Tv className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Compartilhar Tela</h2>
              <p className="text-xs text-slate-400">Transmita seu jogo ou aplicativos em alta definição</p>
            </div>
          </div>
          <button
            onClick={() => setIsScreenModalOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition btn-interactive"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 thin-scrollbar">
          {/* Tabs: Screens vs Windows (if Electron sources available) */}
          {sources.length > 0 ? (
            <>
              <div className="flex border-b border-white/[0.06] pb-2 space-x-4">
                <button
                  onClick={() => setActiveTab('screens')}
                  className={`flex items-center space-x-2 pb-2 font-semibold text-xs transition border-b-2 -mb-2.5 ${
                    activeTab === 'screens'
                      ? 'border-indigo-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Telas ({screens.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('windows')}
                  className={`flex items-center space-x-2 pb-2 font-semibold text-xs transition border-b-2 -mb-2.5 ${
                    activeTab === 'windows'
                      ? 'border-indigo-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AppWindow className="w-4 h-4" />
                  <span>Janelas ({windows.length})</span>
                </button>
              </div>

              {/* Source Thumbnails Grid */}
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1 thin-scrollbar">
                {displayedSources.map((src) => {
                  const isSelected = selectedSourceId === src.id;
                  return (
                    <div
                      key={src.id}
                      onClick={() => setSelectedSourceId(src.id)}
                      className={`group cursor-pointer rounded-2xl p-2.5 bg-black/40 border transition-all flex flex-col ${
                        isSelected
                          ? 'border-indigo-400 bg-white/10 shadow-[0_0_16px_rgba(99,102,241,0.4)]'
                          : 'border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black/60 mb-2 flex items-center justify-center border border-white/[0.04]">
                        {src.thumbnail ? (
                          <img
                            src={src.thumbnail}
                            alt={src.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Monitor className="w-8 h-8 text-slate-500" />
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {src.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Fallback prompt for browser display media */
            <div className="p-6 glass-panel rounded-3xl text-center space-y-2">
              <Tv className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
              <h3 className="font-bold text-white text-base">Transmissão Direta</h3>
              <p className="text-slate-400 text-xs">
                O sistema abrirá a caixa nativa para você selecionar a tela ou aplicativo que deseja transmitir.
              </p>
            </div>
          )}

          {/* Stream Quality Settings */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Resolução
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['720p', '1080p'].map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolution(res)}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition ${
                      resolution === res
                        ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md'
                        : 'glass-pill text-slate-400 hover:text-white'
                    }`}
                  >
                    {res} {res === '1080p' && 'HD'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Taxa de Quadros
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[30, 60].map((fps) => (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => setFrameRate(fps)}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition ${
                      frameRate === fps
                        ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md'
                        : 'glass-pill text-slate-400 hover:text-white'
                    }`}
                  >
                    {fps} FPS
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-black/30 flex items-center justify-between border-t border-white/[0.06]">
          <span className="text-[11px] text-slate-500">
            Transmissão WebRTC com baixa latência
          </span>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsScreenModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmShare}
              className="px-6 py-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold transition shadow-lg btn-interactive"
            >
              Iniciar Transmissão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
