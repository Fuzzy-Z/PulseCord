import React, { useState } from 'react';
import { Lock, Mail, User, Check, ArrowRight, Loader2, Zap } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useSocket } from '../context/SocketContext';
import { VoxelLogo } from './VoxelLogo';

export const AuthScreen = () => {
  const { login, loginGuest, loginGoogle, register, authError, setAuthError, isConnected, serverUrl } = useSocket();

  const [authMode, setAuthMode] = useState('quick'); // 'quick' | 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedGradient, setSelectedGradient] = useState('from-indigo-500 to-purple-600');
  const [loading, setLoading] = useState(false);

  const [googlePendingUser, setGooglePendingUser] = useState(null);
  const [chosenGoogleName, setChosenGoogleName] = useState('');
  const [useGooglePhoto, setUseGooglePhoto] = useState(false);

  const gradientOptions = [
    { name: 'Indigo / Roxo', gradient: 'from-indigo-500 to-purple-600' },
    { name: 'Ciano / Azul', gradient: 'from-cyan-500 to-blue-600' },
    { name: 'Rosa / Carmim', gradient: 'from-rose-500 to-pink-600' },
    { name: 'Esmeralda / Verde', gradient: 'from-emerald-500 to-teal-600' },
    { name: 'Âmbar / Laranja', gradient: 'from-amber-500 to-orange-600' },
    { name: 'Escuro / Grafite', gradient: 'from-slate-700 to-zinc-900' }
  ];

  const handleCustomGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setAuthError(null);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const googleUser = await userInfoRes.json();
        
        if (!googleUser || !googleUser.email) {
          setAuthError('Não foi possível obter os dados da conta Google.');
          return;
        }

        // Try direct login first (if already registered)
        const checkRes = await loginGoogle({
          accessToken: tokenResponse.access_token,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          sub: googleUser.sub,
          isInitialCheck: true
        });

        if (checkRes.success) {
          // Returning user: Logged in immediately!
          return;
        }

        if (checkRes.needOnboarding) {
          // New user: Prompt to pick nickname and profile color
          const initialName = (googleUser.name || googleUser.given_name || googleUser.email.split('@')[0]).trim();
          setChosenGoogleName(initialName);
          setGooglePendingUser({
            accessToken: tokenResponse.access_token,
            email: googleUser.email,
            name: initialName,
            picture: googleUser.picture,
            sub: googleUser.sub
          });
        }
      } catch (err) {
        setAuthError('Erro na autenticação com o Google.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setAuthError('Login com o Google cancelado.');
      setLoading(false);
    }
  });

  const handleFinishGoogleAuth = async (e) => {
    if (e) e.preventDefault();
    if (!googlePendingUser) return;
    setLoading(true);
    setAuthError(null);
    try {
      const finalName = chosenGoogleName.trim() || googlePendingUser.name;
      const res = await loginGoogle({
        accessToken: googlePendingUser.accessToken,
        email: googlePendingUser.email,
        name: finalName,
        chosenUsername: finalName,
        avatarUrl: useGooglePhoto ? (googlePendingUser.picture || '') : '',
        useGooglePhoto: useGooglePhoto,
        picture: useGooglePhoto ? googlePendingUser.picture : '',
        sub: googlePendingUser.sub,
        avatarColor: selectedGradient
      });
      if (!res.success) {
        setAuthError(res.error || 'Erro ao entrar com a conta Google.');
      }
    } catch (err) {
      setAuthError('Erro na comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="flex flex-1 items-center justify-center p-4 sm:p-6 select-none overflow-hidden font-sans z-50 w-full h-full relative">
      <div className="w-full max-w-[420px] rounded-3xl p-7 sm:p-8 relative z-10 animate-modal bg-sys-s2/90 backdrop-blur-xl border border-white/10 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.6)]">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-sys-s1 mx-auto flex items-center justify-center text-white shadow-lg mb-3 border border-white/10">
            <VoxelLogo className="w-11 h-11 drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-extrabold text-sys-text tracking-tight">Voxel</h1>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-medium animate-fadeIn">
            {authError}
          </div>
        )}

        {/* Conditional View: Google Onboarding Step vs Standard Login */}
        {googlePendingUser ? (
          <form onSubmit={handleFinishGoogleAuth} className="space-y-4 animate-modal text-left">
            <div className="text-center mb-4">
              <div className="relative inline-block mb-2">
                {useGooglePhoto && googlePendingUser.picture ? (
                  <img
                    src={googlePendingUser.picture}
                    alt={googlePendingUser.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-sys-accent shadow-xl mx-auto"
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${selectedGradient} text-white font-bold text-xl flex items-center justify-center shadow-xl mx-auto ring-2 ring-white/20 transition-all duration-200`}>
                    {((chosenGoogleName || 'VX') + '').trim().substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-sys-s1 border border-sys-border flex items-center justify-center text-sky-400 shadow" title="Conta Google Verificada">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              {googlePendingUser.picture && (
                <div className="flex justify-center mb-1">
                  <button
                    type="button"
                    onClick={() => setUseGooglePhoto(!useGooglePhoto)}
                    className="text-[11px] text-sys-accent hover:underline font-medium cursor-pointer"
                  >
                    {useGooglePhoto ? 'Usar Iniciais com Gradiente' : 'Usar Foto do Google'}
                  </button>
                </div>
              )}

              <h2 className="text-base font-bold text-sys-text tracking-tight mt-2">Escolha seu Nome</h2>
              <p className="text-[11px] text-sys-muted mt-0.5 font-medium">
                Conectado como <span className="text-sys-accent font-mono">{googlePendingUser.email}</span>
              </p>
            </div>

            {/* Custom Nickname Input */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-1.5">
                Nome de Usuário / Apelido
              </label>
              <div className="relative flex items-center bg-sys-s1 border border-sys-border text-sys-text rounded-xl focus-within:border-sys-accent transition">
                <User className="w-4 h-4 text-sys-muted ml-3.5 mr-2" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={chosenGoogleName}
                  onChange={(e) => setChosenGoogleName(e.target.value)}
                  placeholder="Ex: Kayky"
                  className="w-full bg-transparent py-2.5 pr-4 text-sys-text text-xs focus:outline-none placeholder-sys-muted/50 font-medium"
                />
              </div>
            </div>

            {/* Profile Highlight Color */}
            <div className="p-3 rounded-xl bg-sys-s1 border border-sys-border">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-sys-muted mb-2">
                Cor de Destaque do Perfil
              </label>
              <div className="flex gap-2 justify-between">
                {gradientOptions.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setSelectedGradient(opt.gradient)}
                    className={`w-5 h-5 rounded-lg bg-gradient-to-tr ${opt.gradient} transition-transform ${
                      selectedGradient === opt.gradient
                        ? 'ring-2 ring-white scale-110 shadow-md'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    title={opt.name}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading || !chosenGoogleName.trim()}
                className="w-full py-3 bg-sys-accent hover:bg-sys-accentHov disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center space-x-2 btn-interactive cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entrando no Voxel...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Voxel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setGooglePendingUser(null);
                  setAuthError(null);
                }}
                disabled={loading}
                className="w-full py-2 text-sys-muted hover:text-sys-text text-xs font-medium transition cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* 1-Click Custom Google Sign-In Button */}
            <div className="mb-4 flex flex-col items-center">
              <button
                type="button"
                onClick={() => handleCustomGoogleLogin()}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-sys-s1 hover:bg-sys-s3 border border-sys-border hover:border-white/20 text-sys-text transition-all duration-150 shadow-sm flex items-center justify-center gap-3 font-semibold text-xs btn-interactive group cursor-pointer"
              >
                {/* Official Google G Logo */}
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.42 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.58 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="font-semibold tracking-normal">Continuar com o Google</span>
              </button>
              
              <div className="w-full flex items-center my-3.5">
                <div className="flex-1 h-[1px] bg-sys-border" />
                <span className="px-3 text-[10px] uppercase tracking-wider font-semibold text-sys-muted">ou</span>
                <div className="flex-1 h-[1px] bg-sys-border" />
              </div>
            </div>

            {/* Clean Segmented Tab Switcher (No Neon) */}
            <div className="grid grid-cols-3 p-1 rounded-xl bg-sys-s1 border border-sys-border mb-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('quick');
                  setAuthError(null);
                }}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 ${
                  authMode === 'quick'
                    ? 'bg-sys-s3 text-sys-text shadow-sm border border-white/10 font-bold'
                    : 'text-sys-muted hover:text-sys-text'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-sys-accent" />
                <span>Rápido</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  authMode === 'login'
                    ? 'bg-sys-s3 text-sys-text shadow-sm border border-white/10 font-bold'
                    : 'text-sys-muted hover:text-sys-text'
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
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  authMode === 'register'
                    ? 'bg-sys-s3 text-sys-text shadow-sm border border-white/10 font-bold'
                    : 'text-sys-muted hover:text-sys-text'
                }`}
              >
                Criar Conta
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
              {/* Quick Mode or Register Mode: Nickname & Color */}
              {(authMode === 'quick' || authMode === 'register') && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-1">
                      {authMode === 'quick' ? 'Seu Nome / Apelido' : 'Nome de Usuário'}
                    </label>
                    <div className="relative flex items-center bg-sys-s1 border border-sys-border text-sys-text rounded-xl focus-within:border-sys-accent transition">
                      <User className="w-4 h-4 text-sys-muted ml-3.5 mr-2" />
                      <input
                        type="text"
                        required={authMode === 'register'}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ex: Kayky"
                        className="w-full bg-transparent py-2.5 pr-4 text-sys-text text-xs focus:outline-none placeholder-sys-muted/50 font-medium"
                      />
                    </div>
                  </div>

                  {/* Avatar Preview & Gradient Theme */}
                  <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-sys-s1 border border-sys-border">
                    <div
                      className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${selectedGradient} text-sys-text flex items-center justify-center text-xs font-bold shadow-sm border border-white/10 flex-shrink-0`}
                    >
                      {previewInitials}
                    </div>
                    <div className="flex-1">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-sys-muted mb-1">
                        Cor do Perfil
                      </label>
                      <div className="flex gap-1.5">
                        {gradientOptions.map((opt) => (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() => setSelectedGradient(opt.gradient)}
                            className={`w-4 h-4 rounded-md bg-gradient-to-tr ${opt.gradient} transition-transform ${
                              selectedGradient === opt.gradient
                                ? 'ring-2 ring-white scale-110 shadow-sm'
                                : 'opacity-60 hover:opacity-100'
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
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-1">
                      E-mail
                    </label>
                    <div className="relative flex items-center bg-sys-s1 border border-sys-border text-sys-text rounded-xl focus-within:border-sys-accent transition">
                      <Mail className="w-4 h-4 text-sys-muted ml-3.5 mr-2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full bg-transparent py-2.5 pr-4 text-sys-text text-xs focus:outline-none placeholder-sys-muted/50 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-1">
                      Senha
                    </label>
                    <div className="relative flex items-center bg-sys-s1 border border-sys-border text-sys-text rounded-xl focus-within:border-sys-accent transition">
                      <Lock className="w-4 h-4 text-sys-muted ml-3.5 mr-2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent py-2.5 pr-4 text-sys-text text-xs focus:outline-none placeholder-sys-muted/50 font-medium"
                      />
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center space-x-2 pt-0.5">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded bg-sys-s3 border border-sys-border text-sys-accent focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-sys-muted font-medium select-none">
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
                className="w-full py-3 bg-sys-accent hover:bg-sys-accentHov disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center space-x-2 mt-3 btn-interactive cursor-pointer"
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
                        ? 'Entrar no Voxel'
                        : authMode === 'register'
                        ? 'Criar Minha Conta'
                        : 'Entrar com Minha Conta'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
