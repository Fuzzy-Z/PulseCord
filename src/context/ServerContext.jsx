import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';

const ServerContext = createContext(null);

export const ServerProvider = ({ children }) => {
  const { socket, isConnected, currentUser, initialServersData, isAuthenticated } = useSocket();

  const [servers, setServers] = useState([]);
  const [currentServerId, setCurrentServerId] = useState(null);
  const [currentChannelId, setCurrentChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [voiceRooms, setVoiceRooms] = useState({});
  const [onlineMembers, setOnlineMembers] = useState([]);
  
  // DMs & UI State
  const [activeView, setActiveView] = useState('server'); // 'server' | 'dms'
  const [dms, setDms] = useState([]); // Array of private conversations
  const [pinnedMessages, setPinnedMessages] = useState({}); // { channelId: [messages] }
  const [mutedServers, setMutedServers] = useState({}); // { serverId: expirationTimestamp }
  const [mutedChannels, setMutedChannels] = useState({}); // { channelId: expirationTimestamp }

  // Modals
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [createChannelType, setCreateChannelType] = useState('text');
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [isClipManagerOpen, setIsClipManagerOpen] = useState(false);
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);

  // Sync servers when initialServersData updates (after login / register / session restore)
  useEffect(() => {
    if (initialServersData && initialServersData.length > 0) {
      setServers(initialServersData);
      if (!currentServerId || !initialServersData.some(s => s.id === currentServerId)) {
        setCurrentServerId(initialServersData[0].id);
        const firstText = initialServersData[0].channels?.find(c => c.type === 'text') || initialServersData[0].channels?.[0];
        if (firstText) setCurrentChannelId(firstText.id);
      }
    } else if (!isAuthenticated) {
      setServers([]);
      setCurrentServerId(null);
      setCurrentChannelId(null);
    }
  }, [initialServersData, isAuthenticated]);

  const currentServer = servers.find((s) => s.id === currentServerId) || servers[0] || null;
  const currentChannel =
    currentServer?.channels?.find((c) => c.id === currentChannelId) ||
    currentServer?.channels?.[0] ||
    null;

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('server-created', (newServer) => {
      setServers((prev) => {
        if (prev.some((s) => s.id === newServer.id)) return prev;
        return [...prev, newServer];
      });
      selectServer(newServer.id);
    });

    socket.on('channel-created', ({ serverId, channel }) => {
      setServers((prev) =>
        prev.map((s) => {
          if (s.id === serverId) {
            return { ...s, channels: [...s.channels, channel] };
          }
          return s;
        })
      );
    });

    socket.on('server-roles-updated', ({ serverId, roles }) => {
      setServers((prev) =>
        prev.map((s) => {
          if (s.id === serverId) {
            return { ...s, roles };
          }
          return s;
        })
      );
    });

    socket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('attachments-pruned', () => {
      if (currentChannelId) {
        socket.emit('fetch-messages', { channelId: currentChannelId }, (msgs) => {
          setMessages(msgs || []);
        });
      }
    });

    socket.on('voice-rooms-updated', ({ voiceRooms }) => {
      setVoiceRooms(voiceRooms || {});
    });

    socket.on('user-status-changed', ({ user }) => {
      setOnlineMembers((prev) => {
        const filtered = prev.filter((m) => m.id !== user.id);
        if (user.status !== 'offline') {
          return [...filtered, user];
        }
        return filtered;
      });
    });

    socket.on('user-profile-updated', ({ user }) => {
      setOnlineMembers((prev) => {
        const filtered = prev.filter((m) => m.id !== user.id);
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
      socket.off('attachments-pruned');
      socket.off('voice-rooms-updated');
      socket.off('user-status-changed');
      socket.off('user-profile-updated');
    };
  }, [socket, currentServerId, currentChannelId]);

  // Fetch messages when changing channel
  useEffect(() => {
    if (!socket || !currentChannelId) return;

    socket.emit('fetch-messages', { channelId: currentChannelId }, (msgs) => {
      setMessages(msgs || []);
    });
  }, [socket, currentChannelId]);

  const selectServer = (serverId) => {
    setCurrentServerId(serverId);
    const s = servers.find((srv) => srv.id === serverId);
    if (s && s.channels?.length > 0) {
      const firstText = s.channels.find((c) => c.type === 'text') || s.channels[0];
      setCurrentChannelId(firstText.id);
    }
  };

  const selectChannel = (channelId) => {
    setCurrentChannelId(channelId);
  };

  const selectDM = (dmId) => {
    setActiveView('dms');
    setCurrentChannelId(dmId);
  };

  const toggleMuteServer = (serverId, duration) => {
    setMutedServers(prev => {
      const copy = { ...prev };
      if (copy[serverId]) delete copy[serverId];
      else copy[serverId] = duration === 'forever' ? -1 : Date.now() + duration;
      return copy;
    });
  };

  const toggleMuteChannel = (channelId, duration) => {
    setMutedChannels(prev => {
      const copy = { ...prev };
      if (copy[channelId]) delete copy[channelId];
      else copy[channelId] = duration === 'forever' ? -1 : Date.now() + duration;
      return copy;
    });
  };

  const pinMessage = (channelId, msg) => {
    setPinnedMessages(prev => {
      const current = prev[channelId] || [];
      if (current.find(m => m.id === msg.id)) return prev;
      return { ...prev, [channelId]: [...current, msg] };
    });
  };

  const unpinMessage = (channelId, msgId) => {
    setPinnedMessages(prev => {
      const current = prev[channelId] || [];
      return { ...prev, [channelId]: current.filter(m => m.id !== msgId) };
    });
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

  const joinServer = (serverId) => {
    if (!socket) return;
    socket.emit('join-server', { serverId }, (res) => {
      if (res && res.success && res.server) {
        selectServer(res.server.id);
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
        joinServer,
        createChannel,
        updateRoles,
        
        // DMs & Mutings
        activeView,
        setActiveView,
        dms,
        setDms,
        selectDM,
        pinnedMessages,
        pinMessage,
        unpinMessage,
        mutedServers,
        toggleMuteServer,
        mutedChannels,
        toggleMuteChannel,
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
        setIsScreenModalOpen,
        isAddServerOpen,
        setIsAddServerOpen,
        isClipManagerOpen,
        setIsClipManagerOpen
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = () => useContext(ServerContext);
