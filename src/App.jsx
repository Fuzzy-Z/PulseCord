import React from 'react';
import { SocketProvider } from './context/SocketContext';
import { ServerProvider, useServer } from './context/ServerContext';
import { VoiceProvider, useVoice } from './context/VoiceContext';
import { TitleBar } from './components/TitleBar';
import { ServerSidebar } from './components/ServerSidebar';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChatArea } from './components/ChatArea';
import { VoiceRoomArea } from './components/VoiceRoomArea';
import { ScreenShareModal } from './components/ScreenShareModal';
import { ServerSettingsModal } from './components/ServerSettingsModal';
import { MusicPlayerModal } from './components/MusicPlayerModal';
import { UserSettingsModal } from './components/UserSettingsModal';
import { CreateChannelModal } from './components/CreateChannelModal';

const MainLayout = () => {
  const { currentChannel } = useServer();
  const { activeVoiceChannel } = useVoice();

  // If current selected channel is a voice channel, or user is in active voice channel and selected it
  const isVoiceView = currentChannel?.type === 'voice';

  return (
    <div className="flex-1 flex overflow-hidden">
      <ServerSidebar />
      <ChannelSidebar />
      {isVoiceView ? <VoiceRoomArea /> : <ChatArea />}

      {/* Global Modals */}
      <ScreenShareModal />
      <ServerSettingsModal />
      <MusicPlayerModal />
      <UserSettingsModal />
      <CreateChannelModal />
    </div>
  );
};

export function App() {
  return (
    <SocketProvider>
      <ServerProvider>
        <VoiceProvider>
          <div className="flex flex-col h-screen w-screen bg-discord-darkest overflow-hidden">
            <TitleBar />
            <MainLayout />
          </div>
        </VoiceProvider>
      </ServerProvider>
    </SocketProvider>
  );
}

export default App;
