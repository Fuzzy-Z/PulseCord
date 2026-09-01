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

const MainLayout = () => {
  const { currentChannel, activeView } = useServer();
  const { activeVoiceChannel } = useVoice();

  // If current selected channel is a voice channel, or user is in active voice channel and selected it
  const isVoiceView = currentChannel?.type === 'voice';
  const isForumView = currentChannel?.type === 'forum';

  return (
    <div className="flex-1 flex overflow-hidden">
      <ServerSidebar />
      {activeView === 'dms' ? <DMSidebar /> : <ChannelSidebar />}
      {isVoiceView ? <VoiceRoomArea /> : isForumView ? <ForumArea /> : <ChatArea />}

      {/* Global Modals */}
      <ScreenShareModal />
      <ServerSettingsModal />
      <MusicPlayerModal />
      <UserSettingsModal />
      <CreateChannelModal />
      <CreateServerModal />
      <ClipManagerModal />
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
            <p className="text-xs font-medium tracking-wide">Conectando ao PulseCord...</p>
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
