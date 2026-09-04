import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import { encodeServerToInvite, decodeInviteToId } from '../utils/inviteUtils';

const ServerContext = createContext(null);

export const ServerProvider = ({ children }) => {
  const { socket, isConnected, currentUser, initialServersData, initialVoiceRoomsData, isAuthenticated } = useSocket();

  const [servers, setServers] = useState([]);
  const [currentServerId, setCurrentServerId] = useState(null);
  const [currentChannelId, setCurrentChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [voiceRooms, setVoiceRooms] = useState({});
  const [onlineMembers, setOnlineMembers] = useState([]);

  // Sync voice rooms from initial authentication response immediately
  useEffect(() => {
    if (initialVoiceRoomsData) {
      setVoiceRooms(initialVoiceRoomsData);
    }
  }, [initialVoiceRoomsData]);

  // Request fresh voice rooms sync whenever socket connects or reconnects
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('sync-voice-rooms', (res) => {
        if (res && res.voiceRooms) {
          setVoiceRooms(res.voiceRooms);
        }
      });
    }
  }, [socket, isConnected]);

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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [unread, setUnread] = useState({}); // { channelId: { count, mentions } }

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

  const resolveDM = (dmId) => {
    if (!dmId || !dmId.startsWith('dm-')) return null;
    const existing = dms.find((d) => d.id === dmId);
    if (existing && existing.recipient && existing.name && existing.name !== 'Mensagem Direta') {
      return existing;
    }

    const parts = dmId.replace('dm-', '').split('_');
    const myId = currentUser?.id;
    const otherId = parts.find((id) => id !== myId) || parts[0];

    // Find other user in onlineMembers or all server members
    let otherUser = onlineMembers.find((m) => m.id === otherId);
    if (!otherUser) {
      for (const srv of servers) {
        const found = (srv.members || []).find((m) => m.id === otherId);
        if (found) {
          otherUser = found;
          break;
        }
      }
    }

    const name = otherUser?.displayName || otherUser?.username || existing?.name || 'Amigo';
    return {
      id: dmId,
      type: 'dm',
      name,
      recipient: otherUser || { id: otherId, username: name, displayName: name },
      participants: parts
    };
  };

  const currentDM = resolveDM(currentChannelId);
  const currentChannel =
    activeView === 'dms'
      ? currentDM || (currentChannelId ? { id: currentChannelId, name: 'Conversa Direta', type: 'dm' } : null)
      : currentServer?.channels?.find((c) => c.id === currentChannelId) ||
        currentServer?.channels?.[0] ||
        null;

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Load initial DMs
    socket.emit('fetch-dms', (list) => {
      if (list && Array.isArray(list)) {
        setDms(list);
      }
    });

    socket.on('server-created', (newServer) => {
      setServers((prev) => {
        if (prev.some((s) => s.id === newServer.id)) {
          return prev.map((s) => (s.id === newServer.id ? newServer : s));
        }
        return [...prev, newServer];
      });
      setActiveView('server');
      setCurrentServerId(newServer.id);
      const firstText = newServer.channels?.find((c) => c.type === 'text') || newServer.channels?.[0];
      if (firstText) setCurrentChannelId(firstText.id);
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

    socket.on('server-roles-updated', ({ serverId, roles, server }) => {
      setServers((prev) =>
        prev.map((s) => {
          if (s.id === serverId) {
            return server || { ...s, roles };
          }
          return s;
        })
      );
    });

    socket.on('server-member-role-updated', ({ serverId, targetUserId, roleId, server }) => {
      setServers((prev) =>
        prev.map((s) => {
          if (s.id === serverId) {
            if (server) return server;
            const updatedMembers = (s.members || []).map((m) =>
              m.id === targetUserId ? { ...m, roleId } : m
            );
            return {
              ...s,
              members: updatedMembers,
              memberRoles: { ...(s.memberRoles || {}), [targetUserId]: roleId }
            };
          }
          return s;
        })
      );
    });

    socket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
      if (message.channelId?.startsWith('dm-')) {
        socket.emit('fetch-dms', (list) => {
          if (list && Array.isArray(list)) setDms(list);
        });
      }

      const isOwn = message.userId === currentUser?.id || message.authorId === currentUser?.id;
      if (!isOwn && message.channelId && message.channelId !== currentChannelId) {
        const mentionNames = [currentUser?.username, currentUser?.displayName]
          .filter(Boolean)
          .map((n) => n.toLowerCase());
        const content = (message.content || '').toLowerCase();
        const isMention = mentionNames.some((name) => content.includes(`@${name}`));
        setUnread((prev) => {
          const current = prev[message.channelId] || { count: 0, mentions: 0 };
          return {
            ...prev,
            [message.channelId]: {
              count: current.count + 1,
              mentions: current.mentions + (isMention ? 1 : 0)
            }
          };
        });
      }
    });

    socket.on('dm-received', (newDM) => {
      setDms((prev) => {
        if (prev.some((d) => d.id === newDM.id)) return prev;
        return [newDM, ...prev];
      });
    });

    socket.on('message-pinned', ({ channelId, messageId, message }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isPinned: true, pinnedAt: message.pinnedAt, pinnedBy: message.pinnedBy } : m))
      );
      setPinnedMessages((prev) => {
        const list = prev[channelId] || [];
        if (list.some((m) => m.id === messageId)) return prev;
        return { ...prev, [channelId]: [...list, message] };
      });
    });

    socket.on('message-unpinned', ({ channelId, messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isPinned: false } : m))
      );
      setPinnedMessages((prev) => {
        const list = prev[channelId] || [];
        return { ...prev, [channelId]: list.filter((m) => m.id !== messageId) };
      });
    });

    socket.on('messages-pruned', () => {
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
      socket.off('server-member-role-updated');
      socket.off('new-message');
      socket.off('dm-received');
      socket.off('message-pinned');
      socket.off('message-unpinned');
      socket.off('messages-pruned');
      socket.off('voice-rooms-updated');
      socket.off('user-status-changed');
      socket.off('user-profile-updated');
    };
  }, [socket, currentServerId, currentChannelId, currentUser]);

  // Fetch messages when changing channel or DM
  useEffect(() => {
    if (!socket || !currentChannelId) return;

    socket.emit('fetch-messages', { channelId: currentChannelId }, (msgs) => {
      setMessages(msgs || []);
    });
  }, [socket, currentChannelId]);

  const closeMobileNav = () => setNavOpen(false);

  const markChannelRead = (channelId) => {
    if (!channelId) return;
    setUnread((prev) => {
      if (!prev[channelId]) return prev;
      const next = { ...prev };
      delete next[channelId];
      return next;
    });
  };

  useEffect(() => {
    if (currentChannelId) markChannelRead(currentChannelId);
  }, [currentChannelId]);

  const selectServer = (serverId) => {
    setActiveView('server');
    setCurrentServerId(serverId);
    closeMobileNav();
    const s = servers.find((srv) => srv.id === serverId);
    if (s && s.channels?.length > 0) {
      const firstText = s.channels.find((c) => c.type === 'text') || s.channels[0];
      setCurrentChannelId(firstText.id);
    }
  };

  const selectChannel = (channelId) => {
    setCurrentChannelId(channelId);
    markChannelRead(channelId);
    closeMobileNav();
  };

  const selectDM = (dmId) => {
    setActiveView('dms');
    setCurrentChannelId(dmId);
    markChannelRead(dmId);
    closeMobileNav();
  };

  const openDM = (targetUserId, targetUserData) => {
    const rawId = typeof targetUserId === 'object' ? (targetUserId.id || targetUserId.userId) : targetUserId;
    if (!rawId) return;

    const myId = currentUser?.id || 'usr-local';
    const sortedIds = [myId, rawId].sort();
    const dmId = `dm-${sortedIds[0]}_${sortedIds[1]}`;

    const fallbackUser = typeof targetUserId === 'object' ? targetUserId : (targetUserData || { id: rawId, username: 'Usuário', displayName: 'Usuário' });

    const localDM = {
      id: dmId,
      type: 'dm',
      name: fallbackUser.displayName || fallbackUser.username || 'Usuário',
      recipient: fallbackUser,
      participants: [myId, rawId]
    };

    setDms((prev) => {
      const exists = prev.find((d) => d.id === dmId);
      if (exists) return prev;
      return [localDM, ...prev];
    });

    setActiveView('dms');
    setCurrentChannelId(dmId);
    markChannelRead(dmId);
    closeMobileNav();

    if (socket) {
      socket.emit('open-or-create-dm', { targetUserId: rawId }, (res) => {
        if (res && res.success && res.dm) {
          setDms((prev) => {
            const index = prev.findIndex((d) => d.id === res.dm.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = res.dm;
              return updated;
            }
            return [res.dm, ...prev];
          });
        }
      });
      socket.emit('fetch-messages', { channelId: dmId }, (msgs) => {
        setMessages(msgs || []);
      });
    }
  };

  const toggleMuteServer = (serverId, duration) => {
    setMutedServers((prev) => {
      const copy = { ...prev };
      if (copy[serverId]) delete copy[serverId];
      else copy[serverId] = duration === 'forever' ? -1 : Date.now() + duration;
      return copy;
    });
  };

  const toggleMuteChannel = (channelId, duration) => {
    setMutedChannels((prev) => {
      const copy = { ...prev };
      if (copy[channelId]) delete copy[channelId];
      else copy[channelId] = duration === 'forever' ? -1 : Date.now() + duration;
      return copy;
    });
  };

  const pinMessage = (channelId, msg) => {
    if (!channelId || !msg?.id) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, isPinned: true } : m))
    );
    setPinnedMessages((prev) => {
      const list = prev[channelId] || [];
      if (list.some((m) => m.id === msg.id)) return prev;
      return { ...prev, [channelId]: [{ ...msg, isPinned: true }, ...list] };
    });
    if (socket) {
      socket.emit('pin-message', { channelId, messageId: msg.id });
    }
  };

  const unpinMessage = (channelId, msgId) => {
    if (!channelId || !msgId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isPinned: false } : m))
    );
    setPinnedMessages((prev) => {
      const list = prev[channelId] || [];
      return { ...prev, [channelId]: list.filter((m) => m.id !== msgId) };
    });
    if (socket) {
      socket.emit('unpin-message', { channelId, messageId: msgId });
    }
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
        setServers((prev) => {
          if (prev.some((s) => s.id === newServer.id)) {
            return prev.map((s) => (s.id === newServer.id ? newServer : s));
          }
          return [...prev, newServer];
        });
        setActiveView('server');
        setCurrentServerId(newServer.id);
        const firstText = newServer.channels?.find((c) => c.type === 'text') || newServer.channels?.[0];
        if (firstText) setCurrentChannelId(firstText.id);
      }
    });
  };

  const joinServer = (serverId) => {
    if (!socket) return;
    socket.emit('join-server', { serverId }, (res) => {
      if (res && res.success && res.server) {
        setServers((prev) => {
          if (prev.some((s) => s.id === res.server.id)) {
            return prev.map((s) => (s.id === res.server.id ? res.server : s));
          }
          return [...prev, res.server];
        });
        setActiveView('server');
        setCurrentServerId(res.server.id);
        const firstText = res.server.channels?.find((c) => c.type === 'text') || res.server.channels?.[0];
        if (firstText) setCurrentChannelId(firstText.id);
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

  const assignMemberRole = (targetUserId, roleId, serverId = null) => {
    const sId = serverId || currentServerId;
    if (!sId) return;

    // Optimistic local state update
    setServers((prev) =>
      prev.map((s) => {
        if (s.id === sId) {
          const updatedMembers = (s.members || []).map((m) =>
            m.id === targetUserId ? { ...m, roleId } : m
          );
          return {
            ...s,
            members: updatedMembers,
            memberRoles: { ...(s.memberRoles || {}), [targetUserId]: roleId }
          };
        }
        return s;
      })
    );

    if (socket) {
      socket.emit('assign-member-role', {
        serverId: sId,
        targetUserId,
        roleId
      });
    }
  };

  const getServerInvite = (serverId = null) => {
    return new Promise((resolve) => {
      const sId = serverId || currentServerId;
      if (!sId) return resolve({ success: false, error: 'Servidor indisponível.' });
      
      const s = servers.find((srv) => srv.id === sId);
      const fallbackCode = encodeServerToInvite(s);

      const timer = setTimeout(() => {
        resolve({
          success: true,
          inviteCode: fallbackCode,
          inviteUrl: `https://voxel.gg/invite/${fallbackCode}`,
          serverId: sId,
          serverName: s?.name || 'Espaço',
          memberCount: s?.members?.length || 1
        });
      }, 600);

      if (socket) {
        socket.emit('get-server-invite', { serverId: sId }, (res) => {
          clearTimeout(timer);
          if (res && res.success && res.inviteCode) {
            resolve(res);
          } else {
            resolve({
              success: true,
              inviteCode: fallbackCode,
              inviteUrl: `https://voxel.gg/invite/${fallbackCode}`,
              serverId: sId,
              serverName: s?.name || 'Espaço',
              memberCount: s?.members?.length || 1
            });
          }
        });
      }
    });
  };

  const generateNewInvite = (serverId = null) => {
    return new Promise((resolve) => {
      const sId = serverId || currentServerId;
      if (!sId) return resolve({ success: false, error: 'Servidor indisponível.' });

      const s = servers.find((srv) => srv.id === sId);
      const code = encodeServerToInvite(s, true);

      const timer = setTimeout(() => {
        resolve({
          success: true,
          inviteCode: code,
          inviteUrl: `https://voxel.gg/invite/${code}`,
          serverId: sId
        });
      }, 600);

      if (socket) {
        socket.emit('generate-new-invite', { serverId: sId }, (res) => {
          clearTimeout(timer);
          resolve(res || {
            success: true,
            inviteCode: code,
            inviteUrl: `https://voxel.gg/invite/${code}`,
            serverId: sId
          });
        });
      }
    });
  };

  const joinServerInvite = (inviteCode) => {
    return new Promise((resolve) => {
      if (!inviteCode || typeof inviteCode !== 'string') {
        return resolve({ success: false, error: 'Código de convite inválido.' });
      }

      const decodedId = decodeInviteToId(inviteCode);
      let cleaned = inviteCode.trim();
      const urlMatch = cleaned.match(/invite\/([a-zA-Z0-9_-]+)/i);
      if (urlMatch) {
        cleaned = urlMatch[1];
      } else {
        cleaned = cleaned.replace(/^PC-?/i, '').trim();
      }

      const applyServerJoin = (joinedServer) => {
        if (!joinedServer) return;
        setServers((prev) => {
          if (prev.some((s) => s.id === joinedServer.id)) {
            return prev.map((s) => (s.id === joinedServer.id ? joinedServer : s));
          }
          return [...prev, joinedServer];
        });
        setActiveView('server');
        setCurrentServerId(joinedServer.id);
        const firstText = joinedServer.channels?.find((c) => c.type === 'text') || joinedServer.channels?.[0];
        if (firstText) setCurrentChannelId(firstText.id);
      };

      if (!socket) {
        return resolve({ success: false, error: 'Desconectado do servidor.' });
      }

      const primaryId = decodedId || (cleaned.startsWith('server-') ? cleaned : `server-${cleaned}`);

      // Emit standard join-server which works on Render and all backend versions
      socket.emit('join-server', { serverId: primaryId }, (res) => {
        if (res && res.success && res.server) {
          applyServerJoin(res.server);
          resolve({ success: true, server: res.server });
        } else {
          // If primaryId wasn't found directly, fallback to cleaned string
          socket.emit('join-server', { serverId: cleaned }, (res2) => {
            if (res2 && res2.success && res2.server) {
              applyServerJoin(res2.server);
              resolve({ success: true, server: res2.server });
            } else {
              resolve({
                success: false,
                error: res2?.error || res?.error || 'Servidor não encontrado ou convite expirado.'
              });
            }
          });
        }
      });
    });
  };

  const sendInviteDM = (targetUserId, serverId = null) => {
    return new Promise((resolve) => {
      const sId = serverId || currentServerId;
      if (!targetUserId || !sId) return resolve({ success: false });

      const timer = setTimeout(() => {
        resolve({ success: true });
      }, 1000);

      if (socket) {
        socket.emit('send-server-invite-dm', { targetUserId, serverId: sId }, (res) => {
          clearTimeout(timer);
          resolve(res || { success: false });
        });
      }
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
        joinServerInvite,
        getServerInvite,
        generateNewInvite,
        sendInviteDM,
        createChannel,
        updateRoles,
        assignMemberRole,
        
        // DMs & Mutings
        activeView,
        setActiveView,
        dms,
        setDms,
        selectDM,
        openDM,
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
        isInviteModalOpen,
        setIsInviteModalOpen,
        isClipManagerOpen,
        setIsClipManagerOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        navOpen,
        setNavOpen,
        closeMobileNav,
        unread,
        markChannelRead
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = () => useContext(ServerContext);
