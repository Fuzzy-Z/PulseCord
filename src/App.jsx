import React, { Suspense, lazy, useEffect } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ServerProvider, useServer } from './context/ServerContext';
import { VoiceProvider, useVoice } from './context/VoiceContext';
import { TitleBar } from './components/TitleBar';
import { UpdateToast } from './components/UpdateToast';
import { GlobalAudioEngine } from './components/GlobalAudioEngine';
import { CallOverlay } from './components/CallOverlay';
import { CommandPalette } from './components/CommandPalette';
import { OnboardingTour } from './components/OnboardingTour';
import { applyUiStyle, getSavedUiStyle } from './utils/appearance';
import { Loader2 } from 'lucide-react';

const ChannelSidebar = lazy(() =>
  import('./components/ChannelSidebar').then((m) => ({ default: m.ChannelSidebar }))
);
const DMSidebar = lazy(() =>
  import('./components/DMSidebar').then((m) => ({ default: m.DMSidebar }))
);
const ChatArea = lazy(() =>
  import('./components/ChatArea').then((m) => ({ default: m.ChatArea }))
);
const AuthScreen = lazy(() =>
  import('./components/AuthScreen').then((m) => ({ default: m.AuthScreen }))
);
const DMHomeArea = lazy(() =>
  import('./components/DMHomeArea').then((m) => ({ default: m.DMHomeArea }))
);

const VoiceRoomArea = lazy(() =>
  import('./components/VoiceRoomArea').then((m) => ({ default: m.VoiceRoomArea }))
);
const ForumArea = lazy(() =>
  import('./components/ForumArea').then((m) => ({ default: m.ForumArea }))
);
const ScreenShareModal = lazy(() =>
  import('./components/ScreenShareModal').then((m) => ({ default: m.ScreenShareModal || m.default }))
);
const ServerSettingsModal = lazy(() =>
  import('./components/ServerSettingsModal').then((m) => ({ default: m.ServerSettingsModal }))
);
const MusicPlayerModal = lazy(() =>
  import('./components/MusicPlayerModal').then((m) => ({ default: m.MusicPlayerModal }))
);
const UserSettingsModal = lazy(() =>
  import('./components/UserSettingsModal').then((m) => ({ default: m.UserSettingsModal }))
);
const CreateChannelModal = lazy(() =>
  import('./components/CreateChannelModal').then((m) => ({ default: m.CreateChannelModal }))
);
const CreateServerModal = lazy(() =>
  import('./components/CreateServerModal').then((m) => ({ default: m.CreateServerModal }))
);
const ClipManagerModal = lazy(() =>
  import('./components/ClipManagerModal').then((m) => ({ default: m.ClipManagerModal }))
);
const InviteModal = lazy(() =>
  import('./components/InviteModal').then((m) => ({ default: m.InviteModal }))
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Voxel ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 text-left">
          <div className="bg-sys-s2 border border-rose-500/50 p-6 rounded-2xl max-w-2xl w-full text-sys-text shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-rose-400">⚠️ Ops! Ocorreu um erro no componente:</h2>
            <div className="p-3 bg-sys-s1 rounded-xl font-mono text-xs text-rose-300 overflow-auto max-h-40 border border-sys-border">
              {this.state.error?.toString()}
            </div>
            {this.state.errorInfo?.componentStack && (
              <pre className="p-3 bg-sys-s1 rounded-xl font-mono text-[10px] text-sys-muted overflow-auto max-h-48 border border-sys-border">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="px-4 py-2 bg-sys-accent text-white text-xs font-bold rounded-xl"
              >
                Tentar Recuperar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-sys-s1 text-sys-text text-xs font-semibold rounded-xl border border-sys-border"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const WorkspaceFallback = () => (
  <div className="flex-1 flex items-center justify-center text-sys-muted">
    <Loader2 className="w-6 h-6 animate-spin text-sys-accent" />
  </div>
);

const MainLayout = () => {
  const {
    currentChannel,
    currentChannelId,
    activeView,
    navOpen,
    setNavOpen,
    isScreenModalOpen,
    isServerSettingsOpen,
    isMusicModalOpen,
    isUserSettingsOpen,
    isCreateChannelOpen,
    isAddServerOpen,
    isInviteModalOpen,
    isClipManagerOpen
  } = useServer();

  const isVoiceView = currentChannel?.type === 'voice';
  const isForumView = currentChannel?.type === 'forum';
  const isDMHome = activeView === 'dms' && (!currentChannelId || currentChannelId === 'dm-home' || currentChannelId === 'dm-inbox' || !currentChannel);

  return (
    <div className="flex-1 flex overflow-hidden voxel-app-shell relative">
      {navOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="voxel-nav-backdrop"
          onClick={() => setNavOpen(false)}
        />
      )}
      <Suspense fallback={<WorkspaceFallback />}>
        {activeView === 'dms' ? <DMSidebar /> : <ChannelSidebar />}
      </Suspense>
      <div className="flex-1 min-w-0 voxel-workspace overflow-hidden">
        <Suspense fallback={<WorkspaceFallback />}>
          {isVoiceView ? (
            <VoiceRoomArea />
          ) : isForumView ? (
            <ForumArea />
          ) : isDMHome ? (
            <DMHomeArea />
          ) : (
            <ChatArea />
          )}
        </Suspense>
      </div>

      <ErrorBoundary>
        <Suspense fallback={null}>
          {isScreenModalOpen && <ScreenShareModal />}
          {isServerSettingsOpen && <ServerSettingsModal />}
          {isMusicModalOpen && <MusicPlayerModal />}
          {isUserSettingsOpen && <UserSettingsModal />}
          {isCreateChannelOpen && <CreateChannelModal />}
          {isAddServerOpen && <CreateServerModal />}
          {isInviteModalOpen && <InviteModal />}
          {isClipManagerOpen && <ClipManagerModal />}
        </Suspense>
      </ErrorBoundary>
      <CommandPalette />
      <OnboardingTour />
    </div>
  );
};

const AppContent = () => {
  const { isAuthenticated, authLoading, currentUser } = useSocket();

  useEffect(() => {
    // Support both legacy 'pulsecord-theme' and new 'voxel-theme' keys
    let savedTheme =
      localStorage.getItem('voxel-theme') ||
      localStorage.getItem('pulsecord-theme') ||
      'theme-grafite';
    if (currentUser?.appTheme) {
      savedTheme = `theme-${currentUser.appTheme}`;
    }
    Array.from(document.body.classList)
      .filter((c) => c.startsWith('theme-'))
      .forEach((c) => document.body.classList.remove(c));
    document.body.classList.add(savedTheme);
    
    // Apply UI style
    const uiStyle = getSavedUiStyle(currentUser);
    applyUiStyle(uiStyle);

    // Apply dynamic wallpaper
    const themeId = savedTheme.replace('theme-', '');
    document.body.style.setProperty('--app-bg', `url('/themes/${themeId}.jpg')`);

    // Apply wallpaper blur & opacity
    const savedBlur = localStorage.getItem('voxel_bg_blur') || '0';
    document.body.style.setProperty('--bg-blur', `${savedBlur}px`);
    document.body.style.setProperty('--bg-opacity', '1');

  }, [currentUser?.appTheme, currentUser?.uiStyle]);

  return (
    <div className="flex flex-col h-screen w-screen text-sys-text overflow-hidden relative font-sans voxel-grid-bg">
      <div className="relative z-10 flex flex-col h-full w-full">
        <TitleBar />
        {authLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-sys-muted gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-sys-accent" />
            <p className="text-xs font-medium tracking-wide">Conectando ao Voxel...</p>
          </div>
        ) : !isAuthenticated ? (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-sys-accent" /></div>}>
            <AuthScreen />
          </Suspense>
        ) : (
          <MainLayout />
        )}
        <UpdateToast />
        <GlobalAudioEngine />
        <CallOverlay />
      </div>
    </div>
  );
};

export function App() {
  return (
    <SocketProvider>
      <ServerProvider>
        <VoiceProvider>
          <AppContent />
        </VoiceProvider>
      </ServerProvider>
    </SocketProvider>
  );
}

export default App;
