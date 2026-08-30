import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [serverUrl, setServerUrl] = useState(() => {
    return localStorage.getItem('pulsecord_server_url') || 'http://localhost:4000';
  });
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('pulsecord_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const rand = Math.floor(1000 + Math.random() * 9000);
    return {
      id: 'usr-' + rand,
      username: 'User_' + rand,
      avatar: '👑',
      roleId: 'role-admin'
    };
  });

  const socketRef = useRef(null);

  const updateServerUrl = (url) => {
    localStorage.setItem('pulsecord_server_url', url);
    setServerUrl(url);
  };

  const updateCurrentUser = (newUser) => {
    setCurrentUser(newUser);
    localStorage.setItem('pulsecord_user', JSON.stringify(newUser));
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('user-init', newUser);
    }
  };

  useEffect(() => {
    console.log(`[Socket] Connecting to ${serverUrl}...`);
    const newSocket = io(serverUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket] Connected with ID:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('user-init', currentUser);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket] Connect error:', err.message);
      setIsConnected(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        serverUrl,
        updateServerUrl,
        currentUser,
        updateCurrentUser
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
