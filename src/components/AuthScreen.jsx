import React, { useState } from 'react';
import { Radio, Lock, Mail, User, Sparkles, Check, ArrowRight, Loader2, Zap, Globe } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const AuthScreen = () => {
  const { login, loginGuest, register, authError, setAuthError, isConnected, serverUrl } = useSocket();

  const [authMode, setAuthMode] = useState('quick'); // 'quick' | 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedGradient, setSelectedGradient] = useState('from-indigo-500 to-purple-600');
  const [loading, setLoading] = useState(false);

  const gradientOptions = [
    { name: 'Indigo / Roxo', gradient: 'from-indigo-500 to-purple-600' },
    { name: 'Ciano / Azul', gradient: 'from-cyan-500 to-blue-600' },
    { name: 'Rosa / Carmim', gradient: 'from-rose-500 to-pink-600' },
    { name: 'Esmeralda / Verde', gradient: 'from-emerald-500 to-teal-600' },
    { name: 'Âmbar / Laranja', gradient: 'from-amber-500 to-orange-600' },
    { name: 'Escuro / Grafite', gradient: 'from-slate-700 to-zinc-900' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'quick') {
        const cleanName = username.trim() || `User_${Math.floor(1000 + Math.random() * 9000)}`;
        await loginGuest(cleanName, selectedGradient);
      } else if (authMode === 'register') {
        if (!email.trim() || !password.trim()) {
          setAuthError('E-mail e senha são obrigatórios.');
          setLoading(false);
          return;
        }
        await register(email.trim(), password.trim(), username.trim(), selectedGradient, rememberMe);
      } else {
        if (!email.trim() || !password.trim()) {
          setAuthError('E-mail e senha são obrigatórios.');
          setLoading(false);
          return;
        }
        await login(email.trim(), password.trim(), rememberMe);
      }
    } catch (err) {
      setAuthError('Erro ao conectar com o servidor.');
    }

    setLoading(false);
  };

  const previewInitials = (username.trim() || (email ? email.split('@')[0] : 'PC'))
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 bg-[#090a0f] text-slate-100 flex items-center justify-center p-6 select-none relative overflow-hidden font-sans z-50">
      {/* Liquid Glass Background Orbs */}
      <div className="liquid-ambient-glow">
        <div className="liquid-orb-1" />
        <div className="liquid-orb-2" />
        <div className="liquid-orb-3" />
      </div>

      <div className="glass-modal w-full max-w-md rounded-3xl p-8 shadow-2xl border border-white/15 relative z-10 animate-modal">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 mx-auto flex items-center justify-center text-white shadow-xl mb-3 border border-white/20">
            <Radio className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">PulseCord</h1>
          <p className="text-xs text-slate-400 mt-1">
            Comunicação por voz em tempo real e compartilhamento 60 FPS
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-black/40 border border-white/[0.08] mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMode('quick');
              setAuthError(null);
            }}
            className={`py-2 rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1.5 ${
              authMode === 'quick'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Rápido</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setAuthError(null);
            }}
            className={`py-2 rounded-xl text-[11px] font-semibold transition ${
              authMode === 'login'
                ? 'bg-white/15 text-white shadow-md border border-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setAuthError(null);
            }}
            className={`py-2 rounded-xl text-[11px] font-semibold transition ${
              authMode === 'register'
                ? 'bg-white/15 text-white shadow-md border border-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-medium animate-fadeIn">
            {authError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Quick Mode or Register Mode: Nickname & Color */}
          {(authMode === 'quick' || authMode === 'register') && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {authMode === 'quick' ? 'Seu Nome / Apelido' : 'Nome de Usuário'}
                </label>
                <div className="relative flex items-center glass-input rounded-2xl">
                  <User className="w-4 h-4 text-slate-400 ml-3.5 mr-2" />
                  <input
                    type="text"
                    required={authMode === 'register'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: Kayky"
                    className="w-full bg-transparent py-3 pr-4 text-white text-xs focus:outline-none placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Avatar Preview & Gradient Theme */}
              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-black/30 border border-white/[0.06]">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${selectedGradient} text-white flex items-center justify-center text-sm font-bold shadow-md border border-white/15`}
                >
                  {previewInitials}
                </div>
                <div className="flex-1">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Cor do Perfil
                  </label>
                  <div className="flex gap-1.5">
                    {gradientOptions.map((opt) => (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setSelectedGradient(opt.gradient)}
                        className={`w-5 h-5 rounded-lg bg-gradient-to-tr ${opt.gradient} transition ${
                          selectedGradient === opt.gradient
                            ? 'ring-2 ring-white scale-110'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        title={opt.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Login or Register: Email & Password */}
          {(authMode === 'login' || authMode === 'register') && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  E-mail
                </label>
                <div className="relative flex items-center glass-input rounded-2xl">
                  <Mail className="w-4 h-4 text-slate-400 ml-3.5 mr-2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full bg-transparent py-3 pr-4 text-white text-xs focus:outline-none placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Senha
                </label>
                <div className="relative flex items-center glass-input rounded-2xl">
                  <Lock className="w-4 h-4 text-slate-400 ml-3.5 mr-2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent py-3 pr-4 text-white text-xs focus:outline-none placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2.5 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-lg bg-black/50 border border-white/20 text-indigo-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 font-medium select-none">
                    Lembrar neste dispositivo
                  </span>
                </label>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-60 text-white rounded-2xl text-xs font-bold transition shadow-xl flex items-center justify-center space-x-2 mt-4 btn-interactive cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <span>
                  {authMode === 'quick'
                    ? 'Entrar no PulseCord Agora'
                    : authMode === 'register'
                    ? 'Criar Minha Conta'
                    : 'Entrar com Minha Conta'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Server Status Footer */}
        <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{isConnected ? 'Servidor Nuvem Conectado' : 'Conectando à Nuvem...'}</span>
          </div>
          <span className="font-mono text-[10px] text-indigo-300/80">
            {serverUrl?.replace('https://', '').split('.')[0] || 'onrender'}
          </span>
        </div>
      </div>
    </div>
  );
};
