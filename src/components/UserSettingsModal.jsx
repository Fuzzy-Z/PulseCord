import React, { useState, useEffect } from 'react';
import { Settings, Mic, Globe, X, Check, Volume2, User, Server, Sparkles, LogOut, Download, RotateCw, RefreshCw, Layers } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useServer } from '../context/ServerContext';
import { useVoice } from '../context/VoiceContext';

export const UserSettingsModal = () => {
  const { isUserSettingsOpen, setIsUserSettingsOpen } = useServer();
  const { currentUser, updateCurrentUser, serverUrl, updateServerUrl, logout } = useSocket();
  const {
    krispEnabled,
    setKrispEnabled,
    micSensitivity,
    setMicSensitivity,
    micGain,
    setMicGain,
    micLiveLevel,
    isGateOpen,
    inputDevices,
    outputDevices,
    selectedInputDevice,
    selectedOutputDevice,
    setInputDevice,
    setOutputDevice,
    refreshAudioDevices
  } = useVoice();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'voice' | 'connection'
  const [username, setUsername] = useState(currentUser?.username || '');
  const [avatarInitials, setAvatarInitials] = useState(
    (currentUser?.avatar && currentUser.avatar.length <= 2 && !/[\uD800-\uDFFF]/.test(currentUser.avatar))
      ? currentUser.avatar
      : (currentUser?.username || 'PC').substring(0, 2).toUpperCase()
  );
  const [selectedGradient, setSelectedGradient] = useState(currentUser?.avatarColor || 'from-indigo-500 to-purple-600');
  const [customServerUrl, setCustomServerUrl] = useState(serverUrl || 'https://pulsecord-1-w3xw.onrender.com');
  const [micTestActive, setMicTestActive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [playingSoundTest, setPlayingSoundTest] = useState(false);

  // Auto-Updater State
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);
  const [downloadingUpdate, setDownloadingUpdate] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateReady, setUpdateReady] = useState(false);

  const handleTestAudioOutput = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
      setPlayingSoundTest(true);
      setTimeout(() => setPlayingSoundTest(false), 500);
    } catch (e) {}
  };

  const gradientOptions = [
    { name: 'Indigo / Roxo', gradient: 'from-indigo-500 to-purple-600' },
    { name: 'Ciano / Azul', gradient: 'from-cyan-500 to-blue-600' },
    { name: 'Rosa / Carmim', gradient: 'from-rose-500 to-pink-600' },
    { name: 'Esmeralda / Verde', gradient: 'from-emerald-500 to-teal-600' },
    { name: 'Âmbar / Laranja', gradient: 'from-amber-500 to-orange-600' },
    { name: 'Escuro / Grafite', gradient: 'from-slate-700 to-zinc-900' }
  ];

  useEffect(() => {
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then((v) => {
        if (v) setAppVersion(v);
      });
    }

    if (window.electronAPI?.onUpdateDownloadProgress) {
      window.electronAPI.onUpdateDownloadProgress((prog) => {
        setDownloadProgress(prog.percent || 0);
      });
    }
  }, []);

  const handleCheckUpdates = async () => {
    if (!window.electronAPI) return;
    setCheckingUpdate(true);
    setUpdateResult(null);
    try {
      const res = await window.electronAPI.checkForUpdates(serverUrl);
      setUpdateResult(res);
    } catch (e) {
      setUpdateResult({ hasUpdate: false, error: 'Erro ao verificar atualizações.' });
    }
    setCheckingUpdate(false);
  };

  const handleDownloadUpdate = async () => {
    if (!window.electronAPI || !updateResult?.asarUrl || downloadingUpdate) return;
    setDownloadingUpdate(true);
    try {
      const res = await window.electronAPI.downloadUpdate(updateResult.asarUrl);
      if (res && res.success) {
        setUpdateReady(true);
      }
    } catch (err) {
      console.error(err);
    }
    setDownloadingUpdate(false);
  };

  const handleApplyUpdate = () => {
    if (window.electronAPI) {
      window.electronAPI.applyUpdate();
    }
  };

  useEffect(() => {
    let audioContext;
    let analyser;
    let stream;
    let animId;

    if (micTestActive) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((s) => {
          stream = s;
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          audioContext = new AudioCtx();
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          const source = audioContext.createMediaStreamSource(s);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const update = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = (sum / dataArray.length / 255) * 100;
            setMicLevel(Math.min(100, Math.round(avg * 2.5)));
            animId = requestAnimationFrame(update);
          };
          update();
        })
        .catch((err) => console.warn('Mic test error:', err));
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
      setMicLevel(0);
    };
  }, [micTestActive]);

  if (!isUserSettingsOpen) return null;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    const finalInitials = (avatarInitials.trim() || username.trim().substring(0, 2)).toUpperCase();
    updateCurrentUser({
      ...currentUser,
      username: username.trim(),
      avatar: finalInitials,
      avatarColor: selectedGradient
    });
    setIsUserSettingsOpen(false);
  };

  const handleSaveConnection = (e) => {
    e.preventDefault();
    if (!customServerUrl.trim()) return;
    updateServerUrl(customServerUrl.trim());
    setIsUserSettingsOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xl flex items-center justify-center z-50 p-6 select-none">
      <div className="glass-modal w-full max-w-3xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden border border-white/15 flex animate-modal">
        {/* Left Nav */}
        <div className="w-56 bg-black/30 p-5 flex flex-col justify-between border-r border-white/[0.06]">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">
              Ajustes
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  activeTab === 'profile'
                    ? 'bg-white/15 text-white shadow-sm border border-white/10'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                }`}
              >
                <User className="w-4 h-4 text-indigo-400" />
                <span>Perfil</span>
              </button>

              <button
                onClick={() => setActiveTab('voice')}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  activeTab === 'voice'
                    ? 'bg-white/15 text-white shadow-sm border border-white/10'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                }`}
              >
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>Voz & Áudio</span>
              </button>

              <button
                onClick={() => setActiveTab('connection')}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  activeTab === 'connection'
                    ? 'bg-white/15 text-white shadow-sm border border-white/10'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                }`}
              >
                <Server className="w-4 h-4 text-amber-300" />
                <span>Servidor / Nuvem</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] space-y-2">
            <button
              onClick={() => {
                setMicTestActive(false);
                setIsUserSettingsOpen(false);
                logout();
              }}
              className="flex items-center space-x-2 text-rose-400 hover:text-rose-300 text-xs font-semibold px-2 py-1.5 rounded-xl hover:bg-rose-500/10 w-full transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>

            <button
              onClick={() => {
                setMicTestActive(false);
                setIsUserSettingsOpen(false);
              }}
              className="flex items-center space-x-2 text-slate-400 hover:text-white text-xs font-semibold px-2 py-1.5 rounded-xl hover:bg-white/[0.05] w-full transition"
            >
              <X className="w-4 h-4" />
              <span>Fechar</span>
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 p-8 overflow-y-auto thin-scrollbar">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Perfil de Usuário</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Personalize sua identidade e cores nos canais de texto e voz.
                </p>
              </div>

              {/* Avatar Preview & Monogram */}
              <div className="flex items-center space-x-5 p-4 rounded-2xl bg-black/30 border border-white/[0.08]">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${selectedGradient} text-white flex items-center justify-center text-xl font-bold shadow-xl border border-white/20`}
                >
                  {(avatarInitials || username || 'PC').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Iniciais do Avatar (1-2 Letras)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={avatarInitials}
                    onChange={(e) => setAvatarInitials(e.target.value.toUpperCase())}
                    placeholder="Ex: KY"
                    className="w-24 glass-input text-white px-3 py-1.5 rounded-xl text-center font-bold text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Color Gradient Theme Picker */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Tema de Cor do Perfil
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {gradientOptions.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setSelectedGradient(opt.gradient)}
                      className={`flex items-center space-x-2.5 p-2 rounded-xl transition ${
                        selectedGradient === opt.gradient
                          ? 'bg-white/15 ring-1 ring-white/30 text-white'
                          : 'bg-black/30 hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-lg bg-gradient-to-tr ${opt.gradient} shadow-md`} />
                      <span className="text-xs font-medium truncate">{opt.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full glass-input text-white px-4 py-3 rounded-2xl text-xs focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold transition shadow-lg btn-interactive"
                >
                  Salvar Perfil
                </button>
              </div>
            </form>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Dispositivos & Áudio</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione seu microfone e fone de ouvido, ajuste a sensibilidade e ative o cancelamento de ruídos.
                </p>
              </div>

              {/* Audio Device Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input Device (Microphone) */}
                <div className="p-4 glass-panel rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Dispositivo de Entrada</span>
                    </label>
                    <button
                      type="button"
                      onClick={refreshAudioDevices}
                      className="text-[10px] text-indigo-300 hover:text-white transition"
                    >
                      Recarregar
                    </button>
                  </div>
                  <select
                    value={selectedInputDevice}
                    onChange={(e) => setInputDevice(e.target.value)}
                    className="w-full bg-[#161722] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="default">Padrão do Sistema (Microfone)</option>
                    {inputDevices.map((device, idx) => (
                      <option key={device.deviceId || idx} value={device.deviceId}>
                        {device.label || `Microfone ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Output Device (Speakers / Headphones) */}
                <div className="p-4 glass-panel rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Dispositivo de Saída</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleTestAudioOutput}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold transition"
                    >
                      {playingSoundTest ? 'Tocando Som...' : 'Testar Som'}
                    </button>
                  </div>
                  <select
                    value={selectedOutputDevice}
                    onChange={(e) => setOutputDevice(e.target.value)}
                    className="w-full bg-[#161722] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="default">Padrão do Sistema (Fones / Alto-falantes)</option>
                    {outputDevices.map((device, idx) => (
                      <option key={device.deviceId || idx} value={device.deviceId}>
                        {device.label || `Alto-falante / Fone ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Krisp Noise Suppression Toggle Card */}
              <div className="p-5 glass-panel rounded-2xl flex items-center justify-between border border-indigo-500/20 shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Supressão de Ruído Krisp (Filtro IA)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Corta ruídos de fundo como ventiladores, cliques de teclado mecânico e estática.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setKrispEnabled(!krispEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-200 ${
                    krispEnabled
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 justify-end shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                      : 'bg-black/50 justify-start border border-white/10'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Sensitivity / Noise Gate Slider */}
              <div className="p-5 glass-panel rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">
                    Sensibilidade de Entrada (Noise Gate)
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    {micSensitivity}%
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Aumente se o microfone for muito sensível e captar ruídos ambientes. Apenas sons acima da linha amarela serão transmitidos.
                </p>

                {/* Interactive Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={micSensitivity}
                  onChange={(e) => setMicSensitivity(Number(e.target.value))}
                  className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-white/10"
                />

                {/* Live Volume Meter with Sensitivity Marker */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Nível do Sinal</span>
                    <span className={`font-semibold ${isGateOpen || micLevel >= micSensitivity ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {isGateOpen || micLevel >= micSensitivity ? 'Transmitindo Voz' : 'Bloqueando Ruído'}
                    </span>
                  </div>

                  <div className="relative w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/10">
                    {/* Live signal level */}
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-400 transition-all duration-75"
                      style={{ width: `${micTestActive ? micLevel : (micLiveLevel || micLevel)}%` }}
                    />
                    {/* Threshold marker pin */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] z-10"
                      style={{ left: `${micSensitivity}%` }}
                      title={`Limite: ${micSensitivity}%`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400">
                    Teste seu tom de voz normal para ajustar a linha amarela.
                  </div>
                  <button
                    type="button"
                    onClick={() => setMicTestActive(!micTestActive)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition btn-interactive ${
                      micTestActive
                        ? 'bg-rose-500/80 text-white'
                        : 'bg-indigo-500/80 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    {micTestActive ? 'Parar Teste' : 'Testar Microfone'}
                  </button>
                </div>
              </div>

              {/* Mic Input Gain */}
              <div className="p-5 glass-panel rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">
                    Volume / Ganho de Entrada
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    {micGain}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={micGain}
                  onChange={(e) => setMicGain(Number(e.target.value))}
                  className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-white/10"
                />
              </div>

              {/* DSP Features Active */}
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-black/20">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Acoustic Echo Cancellation (Sem retorno de áudio para amigos)</span>
                </div>
                <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-black/20">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>High-Pass Filter 85Hz (Elimina tremores de mesa e graves)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'connection' && (
            <form onSubmit={handleSaveConnection} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Servidor de Sinalização</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Gerencie o endpoint WebRTC / Socket.io para comunicação em nuvem.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  URL do Servidor na Nuvem
                </label>
                <input
                  type="text"
                  required
                  value={customServerUrl}
                  onChange={(e) => setCustomServerUrl(e.target.value)}
                  placeholder="https://pulsecord-1-w3xw.onrender.com"
                  className="w-full glass-input text-white px-4 py-3 rounded-2xl text-xs font-mono focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-2">
                  Servidor padrão conectado: <code className="text-indigo-300">https://pulsecord-1-w3xw.onrender.com</code>.
                </p>
              </div>

              {/* OTA In-App Auto-Updater Card */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Atualizações do PulseCord</h4>
                      <p className="text-[11px] text-slate-400 font-mono">Versão Atual: v{appVersion}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckUpdates}
                    disabled={checkingUpdate}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-60 border border-white/10"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
                    <span>{checkingUpdate ? 'Verificando...' : 'Verificar Atualização'}</span>
                  </button>
                </div>

                {updateResult && (
                  <div className="pt-2 border-t border-white/[0.06] text-xs">
                    {updateResult.hasUpdate ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            Nova versão v{updateResult.remoteVersion} disponível!
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">~450 KB</span>
                        </div>
                        {updateResult.notes && (
                          <p className="text-[11px] text-slate-300 bg-black/40 p-2 rounded-xl border border-white/[0.04]">
                            {updateResult.notes}
                          </p>
                        )}
                        {downloadingUpdate && (
                          <div className="w-full space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>Baixando pacote...</span>
                              <span>{downloadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-200"
                                style={{ width: `${downloadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          {updateReady ? (
                            <button
                              type="button"
                              onClick={handleApplyUpdate}
                              className="w-full py-2 bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>Reiniciar e Aplicar Atualização</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleDownloadUpdate}
                              disabled={downloadingUpdate}
                              className="w-full py-2 bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{downloadingUpdate ? 'Baixando...' : 'Baixar Atualização (~450 KB)'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : updateResult.error ? (
                      <p className="text-rose-400 text-[11px]">{updateResult.error}</p>
                    ) : (
                      <p className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Você já está usando a versão mais recente do PulseCord (v{appVersion}).
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold transition shadow-lg btn-interactive"
                >
                  Conectar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
