import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';

const ServerContext = createContext(null);

export const ServerProvider = ({ children }) => {
  const { socket, isConnected, currentUser } = useSocket();

  const [servers, setServers] = useState([]);
  const [currentServerId, setCurrentServerId] = useState(null);
  const [currentChannelId, setCurrentChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [voiceRooms, setVoiceRooms] = useState({});
  const [onlineMembers, setOnlineMembers] = useState([]);

  // Modals
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [createChannelType, setCreateChannelType] = useState('text');
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);

  const currentServer = servers.find(s => s.id === currentServerId) || servers[0] || null;
  const currentChannel = currentServer?.channels.find(c => c.id === currentChannelId) || currentServer?.channels[0] || null;

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Initial sync
    const handleInitResponse = (data) => {
      if (data && data.servers) {
        setServers(data.servers);
        if (!currentServerId && data.servers.length > 0) {
          setCurrentServerId(data.servers[0].id);
          const firstText = data.servers[0].channels.find(c => c.type === 'text');
          if (firstText) setCurrentChannelId(firstText.id);
        }
      }
      if (data && data.voiceRooms) {
        setVoiceRooms(data.voiceRooms);
      }
    };

    socket.on('server-created', (newServer) => {
      setServers(prev => [...prev, newServer]);
    });

    socket.on('channel-created', ({ serverId, channel }) => {
      setServers(prev => prev.map(s => {
        if (s.id === serverId) {
          return { ...s, channels: [...s.channels, channel] };
        }
        return s;
      }));
    });

    socket.on('server-roles-updated', ({ serverId, roles }) => {
      setServers(prev => prev.map(s => {
        if (s.id === serverId) {
          return { ...s, roles };
        }
        return s;
      }));
    });

    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('voice-rooms-updated', ({ voiceRooms }) => {
      setVoiceRooms(voiceRooms || {});
    });

    socket.on('user-status-changed', ({ user }) => {
      setOnlineMembers(prev => {
        const filtered = prev.filter(m => m.id !== user.id);
        if (user.status !== 'offline') {
          return [...filtered, user];
        }
        return filtered;
      });
    });

    return () => {
      socket.off('server-created');
      socket.off('channel-created');
      socket.off('server-roles-updated');
      socket.off('new-message');
      socket.off('voice-rooms-updated');
      socket.off('user-status-changed');
    };
  }, [socket, currentServerId]);

  // Fetch messages when changing channel
  useEffect(() => {
    if (!socket || !currentChannelId) return;

    socket.emit('fetch-messages', { channelId: currentChannelId }, (msgs) => {
      setMessages(msgs || []);
    });
  }, [socket, currentChannelId]);

  const selectServer = (serverId) => {
    setCurrentServerId(serverId);
    const s = servers.find(srv => srv.id === serverId);
    if (s && s.channels.length > 0) {
      const firstText = s.channels.find(c => c.type === 'text') || s.channels[0];
      setCurrentChannelId(firstText.id);
    }
  };

  const selectChannel = (channelId) => {
    setCurrentChannelId(channelId);
  };

  const sendMessage = (content, attachments = []) => {
    if (!socket || !currentChannelId) return;
    socket.emit('send-message', {
      channelId: currentChannelId,
      content,
      attachments
    });
  };

  const createServer = (name, icon) => {
    if (!socket) return;
    socket.emit('create-server', { name, icon }, (newServer) => {
      if (newServer) {
        selectServer(newServer.id);
      }
    });
  };

  const createChannel = (name, type, topic) => {
    if (!socket || !currentServerId) return;
    socket.emit('create-channel', {
      serverId: currentServerId,
      name,
      type,
      topic
    });
  };

  const updateRoles = (roles) => {
    if (!socket || !currentServerId) return;
    socket.emit('update-roles', {
      serverId: currentServerId,
      roles
    });
  };

  return (
    <ServerContext.Provider
      value={{
        servers,
        currentServer,
        currentServerId,
        selectServer,
        currentChannel,
        currentChannelId,
        selectChannel,
        messages,
        sendMessage,
        voiceRooms,
        onlineMembers,
        createServer,
        createChannel,
        updateRoles,
        // Modals
        isServerSettingsOpen,
        setIsServerSettingsOpen,
        isUserSettingsOpen,
        setIsUserSettingsOpen,
        isCreateChannelOpen,
        setIsCreateChannelOpen,
        createChannelType,
        setCreateChannelType,
        isMusicModalOpen,
        setIsMusicModalOpen,
        isScreenModalOpen,
        setIsScreenModalOpen
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = () => useContext(ServerContext);
