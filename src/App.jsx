import React, { useEffect } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ServerProvider, useServer } from './context/ServerContext';
import { VoiceProvider, useVoice } from './context/VoiceContext';
import { TitleBar } from './components/TitleBar';
import { ServerSidebar } from './components/ServerSidebar';
import { ChannelSidebar } from './components/ChannelSidebar';
import { DMSidebar } from './components/DMSidebar';
import { ChatArea } from './components/ChatArea';
import { ForumArea } from './components/ForumArea';
import { VoiceRoomArea } from './components/VoiceRoomArea';
import { ScreenShareModal } from './components/ScreenShareModal';
import { ServerSettingsModal } from './components/ServerSettingsModal';
import { MusicPlayerModal } from './components/MusicPlayerModal';
import { UserSettingsModal } from './components/UserSettingsModal';
import { CreateChannelModal } from './components/CreateChannelModal';
import { CreateServerModal } from './components/CreateServerModal';
import { ClipManagerModal } from './components/ClipManagerModal';
import { AuthScreen } from './components/AuthScreen';
import { UpdateToast } from './components/UpdateToast';
import { GlobalAudioEngine } from './components/GlobalAudioEngine';
import { Loader2 } from 'lucide-react';

import { DMHomeArea } from './components/DMHomeArea';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PulseCord ErrorBoundary caught an error:", error, errorInfo);
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

const MainLayout = () => {
  const { currentChannel, currentChannelId, activeView } = useServer();
  const { activeVoiceChannel } = useVoice();

  // View routing
  const isVoiceView = currentChannel?.type === 'voice';
  const isForumView = currentChannel?.type === 'forum';
  const isDMHome = activeView === 'dms' && (!currentChannelId || currentChannelId === 'dm-home' || currentChannelId === 'dm-inbox' || !currentChannel);

  return (
    <div className="flex-1 flex overflow-hidden">
      <ServerSidebar />
      {activeView === 'dms' ? <DMSidebar /> : <ChannelSidebar />}
      {isVoiceView ? (
        <VoiceRoomArea />
      ) : isForumView ? (
        <ForumArea />
      ) : isDMHome ? (
        <DMHomeArea />
      ) : (
        <ChatArea />
      )}

      {/* Global Modals wrapped in ErrorBoundary */}
      <ErrorBoundary>
        <ScreenShareModal />
        <ServerSettingsModal />
        <MusicPlayerModal />
        <UserSettingsModal />
        <CreateChannelModal />
        <CreateServerModal />
        <ClipManagerModal />
      </ErrorBoundary>
    </div>
  );
};

const AppContent = () => {
  const { isAuthenticated, authLoading, currentUser } = useSocket();

  useEffect(() => {
    let savedTheme = localStorage.getItem('pulsecord-theme') || 'theme-grafite';
    if (currentUser?.appTheme) {
      savedTheme = `theme-${currentUser.appTheme}`;
    }
    document.body.className = savedTheme;
  }, [currentUser?.appTheme]);

  return (
    <div className="flex flex-col h-screen w-screen bg-sys-base text-sys-text overflow-hidden relative font-sans">
      {/* App Content */}
      <div className="relative z-10 flex flex-col h-full w-full">
        <TitleBar />
        {authLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-sys-muted gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-sys-accent" />
            <p className="text-xs font-medium tracking-wide">Conectando ao Voxel...</p>
          </div>
        ) : !isAuthenticated ? (
          <AuthScreen />
        ) : (
          <MainLayout />
        )}
        <UpdateToast />
        <GlobalAudioEngine />
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
