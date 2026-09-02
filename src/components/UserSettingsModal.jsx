import React, { useState, useEffect } from 'react';
import { Settings, Mic, Globe, X, Check, Volume2, User, Server, Sparkles, LogOut, Download, RotateCw, RefreshCw, Layers, Palette, Lock, Video, Upload, Trash2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useServer } from '../context/ServerContext';
import { useVoice } from '../context/VoiceContext';
import { UserProfileCard } from './UserProfileCard';
import { AvatarImage } from './AvatarImage';
import Swal from 'sweetalert2';

export const UserSettingsModal = () => {
  const { isUserSettingsOpen, setIsUserSettingsOpen } = useServer();
  const { currentUser, updateCurrentUser, updateProfile, serverUrl, updateServerUrl, logout, deleteAccount } = useSocket();
  const {
    krispEnabled,
    setKrispEnabled,
    micSensitivity,
    setMicSensitivity,
    micGain,
    setMicGain,
    inputDevices,
    outputDevices,
    selectedInputDevice,
    selectedOutputDevice,
    setInputDevice,
    setOutputDevice,
    refreshAudioDevices
  } = useVoice();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'voice' | 'connection'
  const [showPreview, setShowPreview] = useState(false);
  const [username, setUsername] = useState(currentUser?.username || '');
  const [displayName, setDisplayName] = useState(currentUser?.displayName || currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [pronouns, setPronouns] = useState(currentUser?.pronouns || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(currentUser?.bannerUrl || '');
  const [customStatusText, setCustomStatusText] = useState(currentUser?.customStatus?.text || '');
  const [customStatusEmoji, setCustomStatusEmoji] = useState(currentUser?.customStatus?.emoji || '');
  const [gameStatus, setGameStatus] = useState(currentUser?.gameStatus || '');

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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (isUserSettingsOpen && currentUser) {
      setUsername(currentUser.username || '');
      setDisplayName(currentUser.displayName || currentUser.username || '');
      setBio(currentUser.bio || '');
      setPronouns(currentUser.pronouns || '');
      setAvatarUrl(currentUser.avatarUrl || '');
      setBannerUrl(currentUser.bannerUrl || '');
      setCustomStatusText(currentUser.customStatus?.text || '');
      setCustomStatusEmoji(currentUser.customStatus?.emoji || '');
      setGameStatus(currentUser.gameStatus || '');
      setSelectedGradient(currentUser.avatarColor || 'from-indigo-500 to-purple-600');
      setAvatarInitials(
        (currentUser.avatar && currentUser.avatar.length <= 2 && !/[\uD800-\uDFFF]/.test(currentUser.avatar))
          ? currentUser.avatar
          : (currentUser.username || 'PC').substring(0, 2).toUpperCase()
      );
    }
  }, [isUserSettingsOpen, currentUser]);

  const [roundedButtons, setRoundedButtons] = useState(() => {
    if (currentUser?.roundedButtons !== undefined) return currentUser.roundedButtons;
    return localStorage.getItem('pulsecord_rounded_buttons') === 'true';
  });

  const handleToggleRoundedButtons = () => {
    const newValue = !roundedButtons;
    setRoundedButtons(newValue);
    localStorage.setItem('pulsecord_rounded_buttons', newValue.toString());
    if (newValue) {
      document.documentElement.classList.add('rounded-mode');
      document.body.classList.add('rounded-mode');
    } else {
      document.documentElement.classList.remove('rounded-mode');
      document.body.classList.remove('rounded-mode');
    }
    updateProfile({ roundedButtons: newValue });
  };

  const [compactMode, setCompactMode] = useState(() => {
    if (currentUser?.compactMode !== undefined) return currentUser.compactMode;
    return localStorage.getItem('pulsecord_compact_mode') === 'true';
  });

  const [clipSettings, setClipSettings] = useState(() => {
    if (currentUser?.clipSettings) return currentUser.clipSettings;
    try {
      return JSON.parse(localStorage.getItem('pulsecord_clip_settings')) || {
        keybind: 'Alt+C',
        quality: '1080p',
        saveLocation: 'Downloads/Voxel Clips'
      };
    } catch {
      return { keybind: 'Alt+C', quality: '1080p', saveLocation: 'Downloads/Voxel Clips' };
    }
  });

  // Auto-Updater State
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);
  const [downloadingUpdate, setDownloadingUpdate] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateReady, setUpdateReady] = useState(false);

  const appThemes = [
    { id: 'grafite', name: 'Voxel (Padrão)', color: '#0A0C0E', accent: '#64748B' },
    { id: 'porcelana', name: 'Porcelana', color: '#E2E0D8', accent: '#8C8576' },
    { id: 'marinho', name: 'Marinho', color: '#0A111F', accent: '#4B77C2' },
    { id: 'floresta', name: 'Floresta', color: '#0B140E', accent: '#5A9468' },
    { id: 'arenito', name: 'Arenito', color: '#1C1613', accent: '#B38B71' },
    { id: 'rosewood', name: 'Rosewood', color: '#1A0C10', accent: '#B86A81' },
    { id: 'lavanda', name: 'Lavanda', color: '#110D17', accent: '#9071BD' },
    { id: 'cobre', name: 'Bronze', color: '#12100E', accent: '#8C7B70' },
    { id: 'cobalto', name: 'Cobalto', color: '#080F1F', accent: '#3C70D6' },
    { id: 'oliva', name: 'Oliva', color: '#15170D', accent: '#8F9C62' },
    { id: 'petroleo', name: 'Petróleo', color: '#081717', accent: '#46A3A3' },
    { id: 'chocolate', name: 'Chocolate', color: '#17100D', accent: '#A3725D' },
    { id: 'celeste', name: 'Celeste', color: '#0D141A', accent: '#6289A8' },
    { id: 'menta', name: 'Menta', color: '#0B1A16', accent: '#5FB39C' },
    { id: 'ameixa', name: 'Ameixa', color: '#150B15', accent: '#A35EA3' },
    { id: 'carmesim', name: 'Carmesim', color: '#1C0A0A', accent: '#C74A4A' },
    { id: 'stonewash', name: 'Stonewash', color: '#0E1317', accent: '#6987A3' },
    { id: 'dourado', name: 'Dourado', color: '#1A170A', accent: '#BDA646' },
    { id: 'ardosia', name: 'Ardósia', color: '#101317', accent: '#728399' },
    { id: 'marfim', name: 'Marfim', color: '#FAFAFA', accent: '#52525B' },
    { id: 'quartz-skin', name: 'Quartz Skin', color: '#E6C3B3', accent: '#C19A8B' },
    { id: 'petal-mist', name: 'Petal Mist', color: '#FFF1F2', accent: '#D9777F' },
  ];

  const [selectedAppTheme, setSelectedAppTheme] = useState(() => {
    if (currentUser?.appTheme) return currentUser.appTheme;
    const saved =
      localStorage.getItem('voxel-theme') ||
      localStorage.getItem('pulsecord-theme');
    return saved ? saved.replace('theme-', '') : 'grafite';
  });

  // UI Style state — soft (default), aggressive, liquid
  const [selectedUiStyle, setSelectedUiStyle] = useState(() => {
    if (currentUser?.uiStyle) return currentUser.uiStyle;
    const s = localStorage.getItem('pulsecord_ui_style');
    return (s === 'aggressive' || s === 'liquid') ? s : 'soft';
  });

  const [bgBlur, setBgBlur] = useState(() => {
    const saved = localStorage.getItem('voxel_bg_blur');
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const handleSetTheme = (themeId) => {
    setSelectedAppTheme(themeId);
    const themeClass = `theme-${themeId}`;
    localStorage.setItem('voxel-theme', themeClass);
    localStorage.setItem('pulsecord-theme', themeClass); // legacy compat

    // Remove only theme-* classes, preserve ui-style-* and rounded-mode
    Array.from(document.body.classList)
      .filter((c) => c.startsWith('theme-'))
      .forEach((c) => document.body.classList.remove(c));
    document.body.classList.add(themeClass);

    // Set wallpaper
    document.body.style.setProperty('--app-bg', `url('/themes/${themeId}.jpg')`);

    // Re-apply blur settings
    const savedBlur = localStorage.getItem('voxel_bg_blur') || '0';
    document.body.style.setProperty('--bg-blur', `${savedBlur}px`);
    document.body.style.setProperty('--bg-opacity', '1');

    updateProfile({ appTheme: themeId });
  };

  const handleSetUiStyle = (style) => {
    setSelectedUiStyle(style);
    // Apply via DOM manipulation (same logic as appearance.js)
    const STYLE_CLASSES = ['ui-style-soft', 'ui-style-aggressive', 'ui-style-liquid'];
    const targets = [document.documentElement, document.body];
    targets.forEach((el) => {
      STYLE_CLASSES.forEach((cls) => el.classList.remove(cls));
      el.classList.remove('rounded-mode');
      el.classList.add(`ui-style-${style}`);
      if (style !== 'aggressive') el.classList.add('rounded-mode');
    });
    localStorage.setItem('pulsecord_ui_style', style);
    localStorage.setItem('pulsecord_rounded_buttons', style !== 'aggressive' ? 'true' : 'false');
    
    // Auto-adjust blur when changing styles
    const newBlur = style === 'liquid' ? 0 : 0;
    if (localStorage.getItem('voxel_bg_blur') === null) {
      setBgBlur(newBlur);
      document.body.style.setProperty('--bg-blur', `${newBlur}px`);
    }
    document.body.style.setProperty('--bg-opacity', '1');

    updateProfile({ uiStyle: style });
  };

  const handleSetBgBlur = (e) => {
    const val = parseInt(e.target.value, 10);
    setBgBlur(val);
    localStorage.setItem('voxel_bg_blur', val.toString());
    document.body.style.setProperty('--bg-blur', `${val}px`);
  };

  const handleToggleCompactMode = () => {
    const newValue = !compactMode;
    setCompactMode(newValue);
    localStorage.setItem('pulsecord_compact_mode', newValue.toString());
    updateProfile({ compactMode: newValue }).then(() => {
      window.location.reload(); // Reload to apply layout changes
    });
  };

  const handleSaveClipSettings = (newSettings) => {
    setClipSettings(newSettings);
    localStorage.setItem('pulsecord_clip_settings', JSON.stringify(newSettings));
    updateProfile({ clipSettings: newSettings });
  };

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
    } catch (e) { }
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
          let lastUpdate = 0;
          const update = (timestamp) => {
            if (timestamp - lastUpdate >= 35) {
              lastUpdate = timestamp;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = (sum / dataArray.length / 255) * 100;
              setMicLevel(Math.min(100, Math.round(avg * 2.5)));
            }
            animId = requestAnimationFrame(update);
          };
          animId = requestAnimationFrame(update);
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

  const handleImageUpload = (e, setter, isBanner) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: 'Arquivo muito grande!',
        text: 'O tamanho limite para envio é 5MB.',
        icon: 'error',
        confirmButtonText: 'Entendi',
        buttonsStyling: false,
        background: 'var(--color-bg-base)',
        color: 'var(--color-text-main)',
        customClass: {
          popup: 'border border-sys-border rounded-2xl shadow-2xl',
          title: 'font-bold tracking-tight',
          htmlContainer: 'text-sys-muted text-sm',
          confirmButton: 'bg-sys-accent hover:opacity-80 text-white px-6 py-2.5 rounded-xl font-bold transition mt-4'
        }
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;

      // If it's a GIF, just pass it through without resizing to keep animation
      if (file.type === 'image/gif') {
        setter(dataUrl);
        return;
      }

      // Otherwise, compress and resize it using Canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = isBanner ? 800 : 250;

        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.floor(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert back to base64 WebP for better compression
        const webpDataUrl = canvas.toDataURL('image/webp', 0.85);
        setter(webpDataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmDeleteAccount = async (e) => {
    if (e) e.preventDefault();
    if (!deleteConfirmText.trim() || deleteConfirmText.trim() !== currentUser?.username) {
      setDeleteError(`O nome digitado não confere. Digite exatamente "${currentUser?.username}".`);
      return;
    }

    setDeletingAccount(true);
    setDeleteError(null);

    const res = await deleteAccount(deleteConfirmText.trim());
    if (res && res.success) {
      setIsDeleteModalOpen(false);
      setIsUserSettingsOpen(false);
      Swal.fire({
        title: 'Conta Excluída',
        text: 'Sua conta e todos os dados vinculados foram permanentemente removidos.',
        icon: 'success',
        background: '#13151c',
        color: '#fff',
        confirmButtonColor: '#6366f1'
      });
    } else {
      setDeleteError(res?.error || 'Erro ao excluir conta.');
    }
    setDeletingAccount(false);
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    const cleanUsername = ((username || currentUser?.username || 'usuario') + '').trim();
    if (!cleanUsername) return;
    const finalInitials = (((avatarInitials || cleanUsername) + '').trim().substring(0, 2)).toUpperCase();

    await updateProfile({
      username: cleanUsername,
      displayName: ((displayName || cleanUsername) + '').trim(),
      bio: ((bio || '') + '').trim(),
      pronouns: ((pronouns || '') + '').trim(),
      avatarUrl: ((avatarUrl || '') + '').trim(),
      bannerUrl: ((bannerUrl || '') + '').trim(),
      customStatus: { text: ((customStatusText || '') + '').trim(), emoji: ((customStatusEmoji || '') + '').trim() },
      gameStatus: ((gameStatus || '') + '').trim(),
      avatar: finalInitials,
      avatarColor: selectedGradient || 'from-indigo-500 to-purple-600'
    });

    setIsUserSettingsOpen(false);
  };

  const handleSaveConnection = (e) => {
    e.preventDefault();
    if (!customServerUrl.trim()) return;
    updateServerUrl(customServerUrl.trim());
    setIsUserSettingsOpen(false);
  };

  if (!isUserSettingsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 select-none animate-fadeIn">
      <div className="bg-sys-base w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl overflow-hidden border border-sys-border flex animate-modal">
        {/* Left Sidebar */}
        <div className="w-60 bg-sys-s2 p-4 flex flex-col justify-between border-r border-sys-border flex-shrink-0">
          <div>
            <div className="px-3 py-2 text-[11px] font-bold text-sys-muted uppercase tracking-wider">
              Ajustes do Usuário
            </div>
            <div className="space-y-1 mt-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'profile'
                    ? 'bg-sys-s3 text-sys-text shadow-sm border border-white/10'
                    : 'text-sys-muted hover:bg-sys-s1 hover:text-sys-text'
                }`}
              >
                <User className="w-4 h-4 text-sys-accent" />
                <span>Perfil</span>
              </button>

              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'appearance'
                    ? 'bg-sys-s3 text-sys-text shadow-sm border border-white/10'
                    : 'text-sys-muted hover:bg-sys-s1 hover:text-sys-text'
                }`}
              >
                <Palette className="w-4 h-4 text-sys-muted group-hover:text-sys-text" />
                <span>Aparência</span>
              </button>

              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'privacy'
                    ? 'bg-sys-s3 text-sys-text shadow-sm border border-white/10'
                    : 'text-sys-muted hover:bg-sys-s1 hover:text-sys-text'
                }`}
              >
                <Lock className="w-4 h-4 text-sys-muted" />
                <span>Privacidade</span>
              </button>

              <button
                onClick={() => setActiveTab('clips')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'clips'
                    ? 'bg-sys-s3 text-sys-text shadow-sm border border-white/10'
                    : 'text-sys-muted hover:bg-sys-s1 hover:text-sys-text'
                }`}
              >
                <Video className="w-4 h-4 text-sys-muted" />
                <span>Clipes (Gravação)</span>
              </button>

              <button
                onClick={() => setActiveTab('voice')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'voice'
                    ? 'bg-sys-s3 text-sys-text shadow-sm border border-white/10'
                    : 'text-sys-muted hover:bg-sys-s1 hover:text-sys-text'
                }`}
              >
                <Mic className="w-4 h-4 text-sys-muted" />
                <span>Voz & Áudio</span>
              </button>

              <button
                onClick={() => setActiveTab('connection')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'connection'
                    ? 'bg-sys-s3 text-sys-text shadow-sm border border-white/10'
                    : 'text-sys-muted hover:bg-sys-s1 hover:text-sys-text'
                }`}
              >
                <Server className="w-4 h-4 text-sys-muted" />
                <span>Servidor / Nuvem</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-sys-border space-y-1">
            <button
              onClick={() => {
                setMicTestActive(false);
                setIsUserSettingsOpen(false);
                logout();
              }}
              className="flex items-center space-x-2.5 text-sys-muted hover:text-sys-text text-xs font-semibold px-3 py-2 rounded-xl hover:bg-sys-s1 w-full transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>

            <button
              onClick={() => {
                setDeleteConfirmText('');
                setDeleteError(null);
                setIsDeleteModalOpen(true);
              }}
              className="flex items-center space-x-2.5 text-rose-400/90 hover:text-rose-300 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-rose-500/10 w-full transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Conta</span>
            </button>

            <button
              onClick={() => {
                setMicTestActive(false);
                setIsUserSettingsOpen(false);
              }}
              className="flex items-center space-x-2.5 text-sys-muted hover:text-sys-text text-xs font-semibold px-3 py-2 rounded-xl hover:bg-sys-s1 w-full transition"
            >
              <X className="w-4 h-4" />
              <span>Fechar</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto thin-scrollbar">
          {activeTab === 'profile' && (
            <div className="flex flex-col xl:flex-row gap-8 items-start">
              {/* Form Column */}
              <form onSubmit={handleSaveProfile} className="flex-1 space-y-5 w-full">
                <div>
                  <h2 className="text-xl font-extrabold text-sys-text tracking-tight">Perfil de Usuário</h2>
                  <p className="text-xs text-sys-muted mt-1">
                    Personalize sua identidade, avatar, banner e status no servidor.
                  </p>
                </div>

                {/* Banner & Avatar Upload Cards (Full card backgrounds with centered buttons) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Banner Card */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-sys-muted">Banner do Perfil</span>
                      {bannerUrl && (
                        <button
                          type="button"
                          onClick={() => setBannerUrl('')}
                          className="text-[11px] text-rose-400 hover:text-rose-300 font-medium hover:underline"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    
                    <div className="relative h-28 w-full rounded-xl overflow-hidden border border-sys-border flex items-center justify-center group shadow-sm bg-sys-s1">
                      {/* Background Banner */}
                      {bannerUrl ? (
                        <img src={bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className={`absolute inset-0 w-full h-full bg-gradient-to-tr ${selectedGradient}`} />
                      )}
                      <div className="absolute inset-0 bg-black/35" />
                      
                      {/* Centered Upload Button */}
                      <label className="relative z-10 px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white text-xs font-semibold rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 shadow-md btn-interactive">
                        <Upload className="w-3.5 h-3.5 text-white/80" />
                        <span>{bannerUrl ? 'Trocar Banner' : 'Enviar Banner'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setBannerUrl, true)} />
                      </label>
                    </div>
                  </div>

                  {/* Avatar Card with Strong Blur */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-sys-muted">Avatar de Perfil</span>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="text-[11px] text-rose-400 hover:text-rose-300 font-medium hover:underline"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    
                    <div className="relative h-28 w-full rounded-xl overflow-hidden border border-sys-border flex items-center justify-center group shadow-sm bg-sys-s1">
                      {/* Background Avatar with Strong Blur */}
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="Avatar Blur" className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110" />
                      ) : (
                        <div className={`absolute inset-0 w-full h-full bg-gradient-to-tr ${selectedGradient} filter blur-lg scale-110`} />
                      )}
                      <div className="absolute inset-0 bg-black/45" />
                      
                      {/* Centered Upload Button */}
                      <label className="relative z-10 px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white text-xs font-semibold rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 shadow-md btn-interactive">
                        <Upload className="w-3.5 h-3.5 text-white/80" />
                        <span>{avatarUrl ? 'Trocar Avatar' : 'Enviar Avatar'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setAvatarUrl, false)} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Color Gradient Theme Picker (Clean 3-col grid, no text cut-off) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-sys-muted mb-2">
                    Cor de Destaque / Gradiente
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {gradientOptions.map((opt) => {
                      const isSelected = selectedGradient === opt.gradient;
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => setSelectedGradient(opt.gradient)}
                          className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-sys-s3 border-sys-accent text-sys-text font-semibold ring-1 ring-sys-accent'
                              : 'bg-sys-s2 border-sys-border/60 hover:bg-sys-s3 hover:border-sys-border text-sys-muted'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full bg-gradient-to-tr ${opt.gradient} flex-shrink-0 shadow-sm`} />
                          <span className="text-xs truncate">{opt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Identity Form Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-sys-muted">Nome de Exibição</label>
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                      placeholder="Seu apelido" 
                      className="w-full bg-sys-s1 border border-sys-border text-sys-text px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sys-accent transition" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-sys-muted">Nome de Usuário (@)</label>
                    <input 
                      type="text" 
                      required 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder="usuario" 
                      className="w-full bg-sys-s1 border border-sys-border text-sys-text px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sys-accent transition" 
                    />
                  </div>
                </div>

                {/* Pronouns */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-sys-muted">Pronomes</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Ele/Dele, Ela/Dela" 
                    value={pronouns} 
                    onChange={(e) => setPronouns(e.target.value)} 
                    className="w-full bg-sys-s1 border border-sys-border text-sys-text px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sys-accent transition" 
                  />
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-sys-muted">Sobre Mim (Biografia)</label>
                  <textarea 
                    rows={3} 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    className="w-full bg-sys-s1 border border-sys-border text-sys-text px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sys-accent transition resize-none" 
                    placeholder="Conte um pouco sobre você..." 
                  />
                </div>

                {/* Status & Activity Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-sys-muted">Status Customizado</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Programando em React..." 
                      value={customStatusText} 
                      onChange={(e) => setCustomStatusText(e.target.value)} 
                      className="w-full bg-sys-s1 border border-sys-border text-sys-text px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sys-accent transition" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-sys-muted">Atividade / Jogo</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Jogando Terraria" 
                      value={gameStatus} 
                      onChange={(e) => setGameStatus(e.target.value)} 
                      className="w-full bg-sys-s1 border border-sys-border text-sys-text px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-sys-accent transition" 
                    />
                  </div>
                </div>

                {/* Danger Zone: Delete Account */}
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Zona de Perigo: Excluir Conta
                    </h4>
                    <p className="text-[11px] text-sys-muted mt-0.5">
                      Apaga permanentemente sua conta, servidores criados, mídias e todas as mensagens do banco de dados.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmText('');
                      setDeleteError(null);
                      setIsDeleteModalOpen(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Conta</span>
                  </button>
                </div>

                {/* Submit button bar */}
                <div className="pt-4 border-t border-sys-border flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-sys-accent hover:bg-sys-accentHov text-white rounded-xl text-xs font-bold transition shadow-sm btn-interactive"
                  >
                    Salvar Perfil
                  </button>
                </div>
              </form>

              {/* Right Live Preview Column */}
              <div className="w-full xl:w-[320px] flex-shrink-0 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sys-muted">
                    Prévia ao Vivo
                  </span>
                  <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Em tempo real</span>
                  </div>
                </div>
                
                <div className="w-full sticky top-0 flex justify-center">
                  <UserProfileCard
                    inline={true}
                    user={{
                      id: currentUser?.id || 'me',
                      displayName: (displayName || username || 'Usuário'),
                      username: (username || 'usuario'),
                      avatarUrl: avatarUrl || '',
                      bannerUrl: bannerUrl || '',
                      avatar: ((avatarInitials || username || 'PC') + '').trim().substring(0, 2).toUpperCase(),
                      avatarColor: selectedGradient || 'from-indigo-500 to-purple-600',
                      bio: bio || '',
                      pronouns: pronouns || '',
                      customStatus: { text: customStatusText || '', emoji: customStatusEmoji || '' },
                      gameStatus: gameStatus || '',
                      status: 'online',
                      badges: currentUser?.badges || [],
                      createdAt: currentUser?.createdAt || new Date().toISOString()
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-extrabold text-sys-text tracking-tight">Aparência</h2>
                <p className="text-xs text-sys-muted mt-1">
                  Personalize o visual do Voxel — estilo, tema de cores e densidade. Tudo salvo por conta.
                </p>
              </div>

              {/* ── UI Style ────────────────────────────────── */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-sys-text">Estilo Visual</h3>
                  <p className="text-[11px] text-sys-muted mt-0.5">Controla cantos, sombras e o feeling geral dos botões e painéis.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Suave */}
                  <button
                    type="button"
                    onClick={() => handleSetUiStyle('soft')}
                    className={`relative flex flex-col items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedUiStyle === 'soft'
                        ? 'border-sys-accent bg-sys-s3 shadow-md'
                        : 'border-transparent bg-sys-s1 hover:bg-sys-s2 hover:border-sys-border'
                    }`}
                  >
                    {selectedUiStyle === 'soft' && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-sys-accent flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                    {/* Preview mockup */}
                    <div className="w-full flex gap-2">
                      <div className="flex-1 h-8 rounded-xl bg-sys-s3 border border-sys-border" />
                      <div className="w-12 h-8 rounded-xl bg-sys-accent/70" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-sys-text">Suave</p>
                      <p className="text-[10px] text-sys-muted mt-0.5 leading-relaxed">Cantos arredondados, sombras suaves. Visual padrão do Voxel.</p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Padrão</span>
                  </button>

                  {/* Agressivo */}
                  <button
                    type="button"
                    onClick={() => handleSetUiStyle('aggressive')}
                    className={`relative flex flex-col items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedUiStyle === 'aggressive'
                        ? 'border-sys-accent bg-sys-s3 shadow-md'
                        : 'border-transparent bg-sys-s1 hover:bg-sys-s2 hover:border-sys-border'
                    }`}
                  >
                    {selectedUiStyle === 'aggressive' && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-sys-accent flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                    <div className="w-full flex gap-2">
                      <div className="flex-1 h-8 rounded-sm bg-sys-s3 border border-sys-border" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.6)' }} />
                      <div className="w-12 h-8 rounded-sm bg-sys-accent/70" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.6)' }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-sys-text">Agressivo</p>
                      <p className="text-[10px] text-sys-muted mt-0.5 leading-relaxed">Cantos duros, botões táteis com sombra mecânica. Feeling hardcore.</p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm bg-sys-s3 text-sys-muted border border-sys-border">Tático</span>
                  </button>

                  {/* Liquid Glass */}
                  <button
                    type="button"
                    onClick={() => handleSetUiStyle('liquid')}
                    className={`relative flex flex-col items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedUiStyle === 'liquid'
                        ? 'border-sys-accent bg-sys-s3 shadow-md'
                        : 'border-transparent bg-sys-s1 hover:bg-sys-s2 hover:border-sys-border'
                    }`}
                  >
                    {selectedUiStyle === 'liquid' && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-sys-accent flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                    <div className="w-full flex gap-2">
                      <div className="flex-1 h-8 rounded-xl border border-white/20" style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(6px)' }} />
                      <div className="w-12 h-8 rounded-xl" style={{ background: 'rgba(var(--color-accent-rgb, 100,116,139), 0.4)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-sys-text">Liquid Glass</p>
                      <p className="text-[10px] text-sys-muted mt-0.5 leading-relaxed">Painéis translúcidos, blur e reflexos — como vidro líquido.</p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">Translúcido</span>
                  </button>
                </div>
              </div>

              {/* ── Color Theme ──────────────────────────────── */}
              <div className="space-y-3 pt-4 border-t border-sys-border">
                <div>
                  <h3 className="text-sm font-bold text-sys-text">Tema de Cores</h3>
                  <p className="text-[11px] text-sys-muted mt-0.5">Paleta de cores do aplicativo. Aplicado instantaneamente.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {appThemes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleSetTheme(theme.id)}
                      className={`group flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                        selectedAppTheme === theme.id
                          ? 'bg-sys-s3 border-sys-accent ring-1 ring-sys-accent'
                          : 'bg-sys-s1 border-transparent hover:bg-sys-s2 hover:border-sys-border'
                      }`}
                    >
                      {/* Color swatch pair */}
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-7 h-7 rounded-full border border-black/20 shadow-sm"
                          style={{ backgroundColor: theme.color }}
                        />
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-sys-s1"
                          style={{ backgroundColor: theme.accent }}
                        />
                      </div>
                      <span className={`text-[11px] font-semibold truncate ${
                        selectedAppTheme === theme.id ? 'text-sys-text' : 'text-sys-muted group-hover:text-sys-text'
                      }`}>
                        {theme.name}
                      </span>
                      {selectedAppTheme === theme.id && (
                        <Check className="w-3 h-3 text-sys-accent ml-auto flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Layout & Background ────────────────────────────────────── */}
              <div className="space-y-3 pt-4 border-t border-sys-border">
                <div>
                  <h3 className="text-sm font-bold text-sys-text">Layout e Fundo</h3>
                  <p className="text-[11px] text-sys-muted mt-0.5">Ajuste a densidade do layout e desfoque do papel de parede.</p>
                </div>
                
                {/* Wallpaper Blur Slider */}
                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-sys-s3 border border-sys-border">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-xs font-bold text-sys-text">Desfoque do Fundo</h4>
                      <p className="text-[11px] text-sys-muted mt-0.5 max-w-sm">
                        Deixa o papel de parede mais nítido ou mais fosco.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-sys-muted bg-sys-s1 px-2 py-0.5 rounded-md border border-sys-border">{bgBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={bgBlur}
                    onChange={handleSetBgBlur}
                    className="w-full mt-2 h-1.5 bg-sys-s1 rounded-lg appearance-none cursor-pointer accent-sys-accent"
                  />
                  <div className="flex justify-between text-[9px] text-sys-muted px-1 font-semibold uppercase tracking-wider">
                    <span>Nítido</span>
                    <span>Fosco</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-sys-s3 border border-sys-border">
                  <div>
                    <h4 className="text-xs font-bold text-sys-text">Modo Compacto</h4>
                    <p className="text-[11px] text-sys-muted mt-0.5 max-w-sm">
                      Oculta avatares no chat para exibir mais mensagens simultaneamente. (Requer reinício)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleCompactMode}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-200 switch-toggle-btn ${
                      compactMode
                        ? 'bg-sys-accent justify-end shadow-sm'
                        : 'bg-sys-s1 justify-start border border-sys-border'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                {/* Reset tour */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-sys-s3 border border-sys-border">
                  <div>
                    <h4 className="text-xs font-bold text-sys-text">Reiniciar Tour de Boas-vindas</h4>
                    <p className="text-[11px] text-sys-muted mt-0.5">
                      Exibe novamente o tour de apresentação na próxima vez que abrir o app.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('voxel_onboarded');
                      setIsUserSettingsOpen(false);
                    }}
                    className="px-3 py-2 bg-sys-s1 border border-sys-border rounded-xl text-xs font-semibold text-sys-muted hover:text-sys-text hover:border-sys-accent/50 transition btn-interactive"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-sys-text tracking-tight">Privacidade e Segurança</h2>
                <p className="text-xs text-sys-muted mt-1">
                  Controle quem pode interagir com você e visualizar suas informações.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-sys-s3 border border-sys-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-sys-text">Permitir Mensagens Diretas</h3>
                    <p className="text-[11px] text-sys-muted mt-0.5">Permitir que membros do mesmo servidor enviem DMs.</p>
                  </div>
                  <button className="w-12 h-6 bg-sys-accent rounded-full p-1 flex justify-end transition-all shadow-sm">
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-sys-s3 border border-sys-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-sys-text">Filtragem Automática</h3>
                    <p className="text-[11px] text-sys-muted mt-0.5">Ocultar links suspeitos e imagens NSFW em DMs.</p>
                  </div>
                  <button className="w-12 h-6 bg-sys-accent rounded-full p-1 flex justify-end transition-all shadow-sm">
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-sys-muted uppercase tracking-wider mb-2 mt-6">
                    Usuários Bloqueados
                  </h3>
                  <div className="p-6 rounded-2xl bg-sys-s3 border border-sys-border flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-sys-muted">Você não bloqueou ninguém.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clips' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-sys-text tracking-tight">Clipes & Gravações</h2>
                <p className="text-xs text-sys-muted mt-1">
                  Grave os melhores momentos das suas partidas diretamente pelo Voxel.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-sys-s3 border border-sys-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-sys-text">Ativar Clipes</h3>
                      <p className="text-[11px] text-sys-muted mt-0.5">Captura os últimos 30 segundos da sua tela e áudio.</p>
                    </div>
                    <button className="w-12 h-6 bg-sys-accent rounded-full p-1 flex justify-end transition-all shadow-sm">
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-sys-border">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-2">
                        Atalho de Gravação
                      </label>
                      <input
                        type="text"
                        value={clipSettings.keybind}
                        readOnly
                        className="w-full bg-sys-s1 border border-sys-border text-sys-text px-4 py-2.5 rounded-xl text-xs font-mono focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-2">
                        Qualidade do Clipe
                      </label>
                      <select
                        value={clipSettings.quality}
                        onChange={(e) => handleSaveClipSettings({ ...clipSettings, quality: e.target.value })}
                        className="w-full bg-sys-s1 text-sys-text text-xs px-4 py-2.5 rounded-xl border border-sys-border focus:outline-none cursor-pointer"
                      >
                        <option value="720p">Alta (720p 60fps)</option>
                        <option value="1080p">Ultra (1080p 60fps)</option>
                        <option value="4k">Extrema (4K 60fps)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-2">
                        Local de Salvamento
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={clipSettings.saveLocation}
                          readOnly
                          className="flex-1 bg-sys-s1 border border-sys-border text-sys-text px-4 py-2.5 rounded-xl text-xs focus:outline-none transition-colors"
                        />
                        <button className="px-4 py-2.5 bg-sys-s2 hover:bg-sys-s1 border border-sys-border rounded-xl text-xs text-sys-text transition font-medium">
                          Alterar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-sys-text tracking-tight">Dispositivos & Áudio</h2>
                <p className="text-xs text-sys-muted mt-1">
                  Selecione seu microfone e fone de ouvido, ajuste a sensibilidade e ative o cancelamento de ruídos.
                </p>
              </div>

              {/* Audio Device Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input Device (Microphone) */}
                <div className="p-4 bg-sys-s3 rounded-2xl space-y-2 border border-sys-border">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-sys-muted flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-sys-accent" />
                      <span>Dispositivo de Entrada</span>
                    </label>
                    <button
                      type="button"
                      onClick={refreshAudioDevices}
                      className="text-[10px] text-sys-accent hover:text-sys-accentHov transition"
                    >
                      Recarregar
                    </button>
                  </div>
                  <select
                    value={selectedInputDevice}
                    onChange={(e) => setInputDevice(e.target.value)}
                    className="w-full bg-sys-s1 text-sys-text text-xs px-3 py-2.5 rounded-xl border border-sys-border focus:outline-none focus:border-sys-accent cursor-pointer"
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
                <div className="p-4 bg-sys-s3 rounded-2xl space-y-2 border border-sys-border">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-sys-muted flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-sys-accent" />
                      <span>Dispositivo de Saída</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleTestAudioOutput}
                      className="text-[10px] text-green-500 hover:text-green-400 font-semibold transition"
                    >
                      {playingSoundTest ? 'Tocando Som...' : 'Testar Som'}
                    </button>
                  </div>
                  <select
                    value={selectedOutputDevice}
                    onChange={(e) => setOutputDevice(e.target.value)}
                    className="w-full bg-sys-s1 text-sys-text text-xs px-3 py-2.5 rounded-xl border border-sys-border focus:outline-none focus:border-sys-accent cursor-pointer"
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
              <div className="p-5 bg-sys-s3 rounded-2xl flex items-center justify-between border border-sys-border shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-sys-accent" />
                    <span className="text-xs font-bold text-sys-text">Supressão de Ruído Krisp (Filtro IA)</span>
                  </div>
                  <p className="text-[11px] text-sys-muted">
                    Corta ruídos de fundo como ventiladores, cliques de teclado mecânico e estática.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setKrispEnabled(!krispEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-200 ${krispEnabled
                      ? 'bg-sys-accent justify-end shadow-sm'
                      : 'bg-sys-s1 justify-start border border-sys-border'
                    }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              {/* Sensitivity / Noise Gate Slider */}
              <div className="p-5 bg-sys-s3 border border-sys-border rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sys-text">
                    Sensibilidade de Entrada (Noise Gate)
                  </label>
                  <span className="text-xs font-mono font-bold text-sys-accent">
                    {micSensitivity}%
                  </span>
                </div>

                <p className="text-[11px] text-sys-muted">
                  Aumente se o microfone for muito sensível e captar ruídos ambientes. Apenas sons acima da linha de limite serão transmitidos.
                </p>

                {/* Interactive Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={micSensitivity}
                  onChange={(e) => setMicSensitivity(Number(e.target.value))}
                  className="w-full h-2 bg-sys-s1 rounded-lg appearance-none cursor-pointer accent-sys-accent border border-sys-border"
                />

                {/* Live Volume Meter with Sensitivity Marker */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-sys-muted">
                    <span>Nível do Sinal</span>
                    <span className={`font-semibold ${micLevel >= micSensitivity ? 'text-green-500' : 'text-sys-muted'}`}>
                      {micLevel >= micSensitivity ? 'Transmitindo Voz' : (micTestActive ? 'Bloqueando Ruído' : 'Aguardando Teste')}
                    </span>
                  </div>

                  <div className="relative w-full h-3 bg-sys-s1 rounded-full overflow-hidden border border-sys-border">
                    {/* Live signal level */}
                    <div
                      className="h-full bg-sys-accent transition-all duration-75"
                      style={{ width: `${micLevel}%` }}
                    />
                    {/* Threshold marker pin */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-sm z-10"
                      style={{ left: `${micSensitivity}%` }}
                      title={`Limite: ${micSensitivity}%`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-sys-muted">
                    Teste seu tom de voz normal para ajustar o limite.
                  </div>
                  <button
                    type="button"
                    onClick={() => setMicTestActive(!micTestActive)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition btn-interactive ${micTestActive
                        ? 'bg-red-500 text-white'
                        : 'bg-sys-accent hover:bg-sys-accentHov text-white shadow-sm'
                      }`}
                  >
                    {micTestActive ? 'Parar Teste' : 'Testar Microfone'}
                  </button>
                </div>
              </div>

              {/* Mic Input Gain */}
              <div className="p-5 bg-sys-s3 border border-sys-border rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sys-text">
                    Volume / Ganho de Entrada
                  </label>
                  <span className="text-xs font-mono font-bold text-sys-accent">
                    {micGain}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={micGain}
                  onChange={(e) => setMicGain(Number(e.target.value))}
                  className="w-full h-2 bg-sys-s1 rounded-lg appearance-none cursor-pointer accent-sys-accent border border-sys-border"
                />
              </div>

              {/* DSP Features Active */}
              <div className="space-y-2 text-xs text-sys-muted">
                <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-sys-s2 border border-sys-border">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Acoustic Echo Cancellation (Sem retorno de áudio para amigos)</span>
                </div>
                <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-sys-s2 border border-sys-border">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>High-Pass Filter 85Hz (Elimina tremores de mesa e graves)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'connection' && (
            <form onSubmit={handleSaveConnection} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-sys-text tracking-tight">Servidor de Sinalização</h2>
                <p className="text-xs text-sys-muted mt-1">
                  Gerencie o endpoint WebRTC / Socket.io para comunicação em nuvem.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-2">
                  URL do Servidor na Nuvem
                </label>
                <input
                  type="text"
                  required
                  value={customServerUrl}
                  onChange={(e) => setCustomServerUrl(e.target.value)}
                  placeholder="https://pulsecord-1-w3xw.onrender.com"
                  className="w-full bg-sys-s1 border border-sys-border text-sys-text px-4 py-3 rounded-2xl text-xs font-mono focus:outline-none focus:border-sys-accent/50 transition-colors"
                />
                <p className="text-[11px] text-sys-muted mt-2">
                  Servidor padrão conectado: <code className="text-sys-accent">https://pulsecord-1-w3xw.onrender.com</code>.
                </p>
              </div>

              {/* OTA In-App Auto-Updater Card */}
              <div className="p-4 rounded-2xl bg-sys-s3 border border-sys-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sys-accent/20 text-sys-accent flex items-center justify-center border border-sys-accent/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-sys-text">Atualizações do Voxel</h4>
                      <p className="text-[11px] text-sys-muted font-mono">Versão Atual: v{appVersion}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckUpdates}
                    disabled={checkingUpdate}
                    className="px-3 py-1.5 rounded-xl bg-sys-s2 hover:bg-sys-s1 text-sys-text text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-60 border border-sys-border"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
                    <span>{checkingUpdate ? 'Verificando...' : 'Verificar Atualização'}</span>
                  </button>
                </div>

                {updateResult && (
                  <div className="pt-2 border-t border-sys-border text-xs">
                    {updateResult.hasUpdate ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-green-500 font-semibold flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            Nova versão v{updateResult.remoteVersion} disponível!
                          </p>
                          <span className="text-[10px] text-sys-muted font-mono">~450 KB</span>
                        </div>
                        {updateResult.notes && (
                          <p className="text-[11px] text-sys-muted bg-sys-s1 p-2 rounded-xl border border-sys-border">
                            {updateResult.notes}
                          </p>
                        )}
                        {downloadingUpdate && (
                          <div className="w-full space-y-1">
                            <div className="flex justify-between text-[10px] text-sys-muted font-mono">
                              <span>Baixando pacote...</span>
                              <span>{downloadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-sys-s1 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-sys-accent transition-all duration-200"
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
                              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>Reiniciar e Aplicar Atualização</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleDownloadUpdate}
                              disabled={downloadingUpdate}
                              className="w-full py-2 bg-sys-accent hover:bg-sys-accentHov text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{downloadingUpdate ? 'Baixando...' : 'Baixar Atualização (~450 KB)'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : updateResult.error ? (
                      <p className="text-red-500 text-[11px]">{updateResult.error}</p>
                    ) : (
                      <p className="text-sys-muted text-[11px] flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-green-500" />
                        Você já está usando a versão mais recente do Voxel (v{appVersion}).
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-sys-border flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sys-accent hover:bg-sys-accentHov text-white rounded-xl text-xs font-semibold transition shadow-sm btn-interactive"
                >
                  Conectar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 select-none animate-fadeIn">
          <div className="bg-sys-s2 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-rose-500/30 animate-modal text-left space-y-4 relative">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 flex-shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Excluir Conta Permanentemente?</h3>
                <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                  Esta ação é <strong>irreversível</strong>. Todos os seus servidores criados, mensagens enviadas, arquivos de mídia e conversas serão apagados definitivamente do banco de dados.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-sys-s1 border border-sys-border space-y-2">
              <label className="block text-[11px] font-medium text-sys-muted">
                Para confirmar a exclusão, digite exatamente o seu nome de usuário:
              </label>
              <div className="px-3 py-1 rounded-xl bg-sys-s3 border border-sys-border text-center font-mono text-xs font-bold text-white select-all">
                {currentUser?.username}
              </div>
              <input
                type="text"
                autoFocus
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  setDeleteError(null);
                }}
                placeholder="Digite seu nome exato aqui..."
                className="w-full bg-sys-s2 border border-sys-border focus:border-rose-500 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition"
              />
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-medium animate-fadeIn">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                disabled={deletingAccount}
                className="flex-1 py-3 rounded-2xl bg-sys-s1 hover:bg-sys-s3 text-sys-text text-xs font-semibold transition border border-sys-border cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={deletingAccount || deleteConfirmText.trim() !== currentUser?.username}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {deletingAccount ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Definitivamente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
