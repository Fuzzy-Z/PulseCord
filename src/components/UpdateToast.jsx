import React, { useState, useEffect } from 'react';
import { Sparkles, Download, RotateCw, CheckCircle2, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const UpdateToast = () => {
  const { serverUrl } = useSocket();
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [readyToRestart, setReadyToRestart] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    // Listen for automatic background update detection
    window.electronAPI.onUpdateAvailable((info) => {
      if (info && info.hasUpdate) {
        setUpdateInfo(info);
        setDismissed(false);
      }
    });

    // Listen for download progress
    window.electronAPI.onUpdateDownloadProgress((prog) => {
      setProgress(prog.percent || 0);
    });

    // Auto-check on mount
    window.electronAPI.checkForUpdates(serverUrl).then((info) => {
      if (info && info.hasUpdate) {
        setUpdateInfo(info);
        setDismissed(false);
      }
    }).catch(() => {});
  }, [serverUrl]);

  if (!updateInfo || dismissed) return null;

  const handleDownload = async () => {
    if (!window.electronAPI || downloading) return;
    setDownloading(true);
    try {
      const res = await window.electronAPI.downloadUpdate(updateInfo.asarUrl);
      if (res && res.success) {
        setReadyToRestart(true);
      }
    } catch (err) {
      console.error('[Update] Error downloading update:', err);
    }
    setDownloading(false);
  };

  const handleApply = () => {
    if (window.electronAPI) {
      window.electronAPI.applyUpdate();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 bg-[#12131c]/90 shadow-2xl backdrop-blur-xl max-w-sm w-full flex flex-col gap-2.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Nova Atualização Disponível!</h4>
              <p className="text-[11px] text-indigo-300 font-mono">
                v{updateInfo.remoteVersion} <span className="text-slate-400 font-sans">(atual: v{updateInfo.currentVersion})</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {updateInfo.notes && (
          <p className="text-[11px] text-slate-300 bg-black/30 p-2 rounded-xl border border-white/[0.04]">
            {updateInfo.notes}
          </p>
        )}

        {downloading && (
          <div className="w-full space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Baixando atualização...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {readyToRestart ? (
            <button
              onClick={handleApply}
              className="flex-1 py-2 bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 btn-interactive"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Reiniciar e Aplicar</span>
            </button>
          ) : (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 py-2 bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20 btn-interactive"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Baixando...' : 'Atualizar Agora (~450 KB)'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
