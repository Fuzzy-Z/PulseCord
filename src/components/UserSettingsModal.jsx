import React, { useState, useEffect } from 'react';
import { Settings, Mic, Globe, X, Check, Volume2, User, Server } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useServer } from '../context/ServerContext';

export const UserSettingsModal = () => {
  const { isUserSettingsOpen, setIsUserSettingsOpen } = useServer();
  const { currentUser, updateCurrentUser, serverUrl, updateServerUrl } = useSocket();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'voice' | 'connection'
  const [username, setUsername] = useState(currentUser?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || '👑');
  const [customServerUrl, setCustomServerUrl] = useState(serverUrl || 'http://localhost:4000');
  const [micTestActive, setMicTestActive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const avatars = ['👑', '⚡', '🚀', '🔥', '🎧', '👾', '🌟', '💻', '🛡️', '🏆', '🐱', '🐺', '🦊', '🐼', '🤖'];

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
    updateCurrentUser({
      ...currentUser,
      username: username.trim(),
      avatar: selectedAvatar
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 select-none animate-in fade-in">
      <div className="bg-discord-dark w-full max-w-3xl h-[80vh] rounded-xl shadow-2xl overflow-hidden border border-discord-darker flex">
        {/* Left Nav */}
        <div className="w-56 bg-discord-darker p-4 flex flex-col justify-between border-r border-discord-darkest">
          <div>
            <h3 className="text-xs font-bold text-discord-muted uppercase px-2 mb-2">
              Configurações
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition ${
                  activeTab === 'profile'
                    ? 'bg-discord-hover text-white'
                    : 'text-discord-channel hover:bg-discord-hover/50 hover:text-discord-text'
                }`}
              >
                <User className="w-4 h-4 text-discord-brand" />
                <span>Meu Perfil</span>
              </button>

              <button
                onClick={() => setActiveTab('voice')}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition ${
                  activeTab === 'voice'
                    ? 'bg-discord-hover text-white'
                    : 'text-discord-channel hover:bg-discord-hover/50 hover:text-discord-text'
                }`}
              >
                <Mic className="w-4 h-4 text-discord-green" />
                <span>Voz & Vídeo</span>
              </button>

              <button
                onClick={() => setActiveTab('connection')}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition ${
                  activeTab === 'connection'
                    ? 'bg-discord-hover text-white'
                    : 'text-discord-channel hover:bg-discord-hover/50 hover:text-discord-text'
                }`}
              >
                <Server className="w-4 h-4 text-discord-yellow" />
                <span>Servidor / Nuvem</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-discord-darkest">
            <button
              onClick={() => {
                setMicTestActive(false);
                setIsUserSettingsOpen(false);
              }}
              className="flex items-center space-x-2 text-discord-muted hover:text-white text-xs font-semibold"
            >
              <X className="w-4 h-4" />
              <span>ESC / Fechar</span>
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-discord-dark">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-discord-header">Perfil do Usuário</h2>
                <p className="text-xs text-discord-muted mt-1">
                  Personalize como outros usuários verão você nos canais de texto e voz.
                </p>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-discord-muted mb-2">
                  Escolha seu Avatar
                </label>
                <div className="flex flex-wrap gap-2 py-3 px-3 bg-discord-darkest rounded-lg">
                  {avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition ${
                        selectedAvatar === av
                          ? 'bg-discord-brand ring-2 ring-white scale-105'
                          : 'hover:bg-discord-hover'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold uppercase text-discord-muted mb-2">
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full max-w-md bg-discord-darkest text-discord-text px-3 py-2 rounded border border-discord-dark focus:border-discord-brand focus:outline-none text-sm"
                />
              </div>

              <div className="pt-4 border-t border-discord-darker flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-discord-brand hover:bg-discord-brandHover text-white rounded text-sm font-semibold transition"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-discord-header">Configurações de Voz & Áudio</h2>
                <p className="text-xs text-discord-muted mt-1">
                  Teste o seu microfone e ajuste o cancelamento de ruído WebRTC.
                </p>
              </div>

              {/* Microphone Test */}
              <div className="p-4 bg-discord-darkest rounded-lg space-y-3 border border-discord-darker">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-discord-header">Teste de Microfone</div>
                  <button
                    type="button"
                    onClick={() => setMicTestActive(!micTestActive)}
                    className={`px-4 py-1.5 rounded text-xs font-bold transition ${
                      micTestActive
                        ? 'bg-discord-red text-white'
                        : 'bg-discord-brand hover:bg-discord-brandHover text-white'
                    }`}
                  >
                    {micTestActive ? 'Parar Teste' : 'Testar Microfone'}
                  </button>
                </div>

                {/* Live Volume Meter */}
                <div>
                  <div className="text-xs text-discord-muted mb-1">Sensibilidade de Entrada</div>
                  <div className="w-full h-3 bg-discord-darker rounded-full overflow-hidden">
                    <div
                      className="h-full bg-discord-green transition-all duration-75"
                      style={{ width: `${micLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-discord-muted">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-discord-green" />
                  <span>Cancelamento de Eco Ativado (Acoustic Echo Cancellation)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-discord-green" />
                  <span>Supressão de Ruído de Fundo Ativado (Noise Suppression)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-discord-green" />
                  <span>Controle Automático de Ganho (Auto Gain Control)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'connection' && (
            <form onSubmit={handleSaveConnection} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-discord-header">Servidor de Sinalização & Nuvem</h2>
                <p className="text-xs text-discord-muted mt-1">
                  Altere a URL do servidor Socket.io / WebRTC para conectar a um servidor remoto na nuvem.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-discord-muted mb-2">
                  URL do Servidor de Sinalização (Signaling Backend)
                </label>
                <input
                  type="text"
                  required
                  value={customServerUrl}
                  onChange={(e) => setCustomServerUrl(e.target.value)}
                  placeholder="Ex: https://meu-pulsecord.onrender.com ou http://localhost:4000"
                  className="w-full bg-discord-darkest text-discord-text px-3 py-2 rounded border border-discord-dark focus:border-discord-yellow focus:outline-none text-sm font-mono"
                />
                <p className="text-[11px] text-discord-muted mt-2">
                  Por padrão roda localmente em <code>http://localhost:4000</code>. Quando você fizer o deploy gratuito no Render, Railway ou VPS, basta colar o link HTTPS aqui!
                </p>
              </div>

              <div className="pt-4 border-t border-discord-darker flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-discord-brand hover:bg-discord-brandHover text-white rounded text-sm font-semibold transition"
                >
                  Conectar ao Servidor
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
