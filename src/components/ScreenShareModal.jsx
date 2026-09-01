import React, { useState, useEffect } from 'react';
import { Tv, Monitor, AppWindow, X, Check, Volume2, VolumeX } from 'lucide-react';
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
  const [shareAudio, setShareAudio] = useState(false);

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
    startScreenShare(selectedSourceId, { resolution, frameRate, shareAudio });
    setIsScreenModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-sys-s3 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-sys-base border border-sys-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-sys-border flex flex-col max-h-[85vh] animate-modal">
        {/* Modal Header */}
        <div className="p-5 flex items-center justify-between border-b border-sys-border bg-sys-s2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sys-accent/15 border border-indigo-500/30 flex items-center justify-center">
              <Tv className="w-5 h-5 text-sys-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sys-text tracking-tight">Compartilhar Tela</h2>
              <p className="text-xs text-sys-muted">Transmita seu jogo ou aplicativos em alta definição</p>
            </div>
          </div>
          <button
            onClick={() => setIsScreenModalOpen(false)}
            className="text-sys-muted hover:text-sys-text p-1.5 rounded-xl hover:bg-sys-s1 transition btn-interactive"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 thin-scrollbar">
          {/* Tabs: Screens vs Windows (if Electron sources available) */}
          {sources.length > 0 ? (
            <>
              <div className="flex border-b border-sys-border pb-2 space-x-4">
                <button
                  onClick={() => setActiveTab('screens')}
                  className={`flex items-center space-x-2 pb-2 font-semibold text-xs transition border-b-2 -mb-2.5 ${
                    activeTab === 'screens'
                      ? 'border-indigo-400 text-sys-text'
                      : 'border-transparent text-sys-muted hover:text-sys-text'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Telas ({screens.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('windows')}
                  className={`flex items-center space-x-2 pb-2 font-semibold text-xs transition border-b-2 -mb-2.5 ${
                    activeTab === 'windows'
                      ? 'border-indigo-400 text-sys-text'
                      : 'border-transparent text-sys-muted hover:text-sys-text'
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
                      className={`group cursor-pointer rounded-2xl p-2.5 bg-sys-s2 border transition-all flex flex-col ${
                        isSelected
                          ? 'border-indigo-400 bg-white/10 shadow-[0_0_16px_rgba(99,102,241,0.4)]'
                          : 'border-sys-border hover:border-sys-border'
                      }`}
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-sys-s3 mb-2 flex items-center justify-center border border-sys-border">
                        {src.thumbnail ? (
                          <img
                            src={src.thumbnail}
                            alt={src.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Monitor className="w-8 h-8 text-sys-muted/50" />
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-sys-accent text-sys-text rounded-full flex items-center justify-center shadow-lg">
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
            <div className="p-6 bg-sys-s3 border-sys-border rounded-3xl text-center space-y-2">
              <Tv className="w-10 h-10 text-sys-accent mx-auto mb-2" />
              <h3 className="font-bold text-sys-text text-base">Transmissão Direta</h3>
              <p className="text-sys-muted text-xs">
                O sistema abrirá a caixa nativa para você selecionar a tela ou aplicativo que deseja transmitir.
              </p>
            </div>
          )}

          {/* Audio Sharing Toggle */}
          <div className="p-4 bg-sys-s2 border border-sys-border rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3 pr-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition flex-shrink-0 ${
                shareAudio 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-sys-s3 text-sys-muted border border-sys-border'
              }`}>
                {shareAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-bold text-sys-text flex items-center space-x-2">
                  <span>Compartilhar Áudio</span>
                  {shareAudio ? (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded">Ativado</span>
                  ) : (
                    <span className="bg-sys-s3 text-sys-muted text-[9px] font-bold px-1.5 py-0.5 rounded">Desativado</span>
                  )}
                </div>
                <p className="text-[11px] text-sys-muted mt-0.5">
                  {shareAudio 
                    ? 'Transmite o áudio do jogo ou aplicativo.' 
                    : 'Transmite apenas o vídeo (evita que outros ouçam o eco da própria voz).'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShareAudio(!shareAudio)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${
                shareAudio ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  shareAudio ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Stream Quality Settings */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-1.5">
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
                        ? 'bg-sys-accent text-sys-text shadow-md'
                        : 'glass-pill text-sys-muted hover:text-sys-text'
                    }`}
                  >
                    {res} {res === '1080p' && 'HD'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-1.5">
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
                        ? 'bg-sys-accent text-sys-text shadow-md'
                        : 'glass-pill text-sys-muted hover:text-sys-text'
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
        <div className="p-4 bg-sys-s2 flex items-center justify-between border-t border-sys-border">
          <span className="text-[11px] text-sys-muted/50">
            Transmissão WebRTC com baixa latência
          </span>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsScreenModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-sys-muted hover:text-sys-text"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmShare}
              className="px-6 py-2.5 bg-sys-accent hover:bg-sys-accentHov text-sys-text rounded-xl text-xs font-semibold transition shadow-lg btn-interactive"
            >
              Iniciar Transmissão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

