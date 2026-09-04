import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const OFFICIAL_SERVER_URL = 'https://pulsecord-1-w3xw.onrender.com';

const getInitialServerUrl = () => {
  try {
    const saved = localStorage.getItem('pulsecord_server_url');
    if (import.meta.env.DEV) {
      if (!saved || saved === OFFICIAL_SERVER_URL) {
        return 'http://localhost:4000';
      }
      return saved;
    }
    if (saved && saved.startsWith('http')) {
      return saved;
    }
    return OFFICIAL_SERVER_URL;
  } catch {
    return OFFICIAL_SERVER_URL;
  }
};

const DEFAULT_SERVER_URL = getInitialServerUrl();

export const SocketProvider = ({ children }) => {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [initialServersData, setInitialServersData] = useState([]);
  const [initialVoiceRoomsData, setInitialVoiceRoomsData] = useState(null);

  const socketRef = useRef(null);

  const updateServerUrl = (url) => {
    localStorage.setItem('pulsecord_server_url', url);
    setServerUrl(url);
  };

  // Socket Connection Setup
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

      // Attempt auto-login if saved session exists in localStorage
      const savedSession = localStorage.getItem('pulsecord_session');
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          if (session && (session.token || session.userId)) {
            newSocket.emit('auth-session', { token: session.token, userId: session.userId }, (res) => {
              if (res && res.success) {
                setCurrentUser(res.user);
                setIsAuthenticated(true);
                if (res.servers) setInitialServersData(res.servers);
                if (res.voiceRooms) setInitialVoiceRoomsData(res.voiceRooms);
              } else {
                localStorage.removeItem('pulsecord_session');
                setIsAuthenticated(false);
              }
              setAuthLoading(false);
            });
            return;
          }
        } catch (e) {
          localStorage.removeItem('pulsecord_session');
        }
      }
      setAuthLoading(false);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket] Connect error:', err.message);
      setIsConnected(false);
      setAuthLoading(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl]);

  // Login Method
  const login = (email, password, rememberMe = true) => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Servidor desconectado.' });
      setAuthError(null);

      socketRef.current.emit('auth-login', { email, password }, (res) => {
        if (res && res.success) {
          setCurrentUser(res.user);
          setIsAuthenticated(true);
          if (res.servers) setInitialServersData(res.servers);
          if (res.voiceRooms) setInitialVoiceRoomsData(res.voiceRooms);

          if (rememberMe) {
            localStorage.setItem(
              'pulsecord_session',
              JSON.stringify({ token: res.user.token, userId: res.user.id, email: res.user.email })
            );
          } else {
            localStorage.removeItem('pulsecord_session');
          }
          resolve({ success: true, user: res.user });
        } else {
          const errMsg = res?.error || 'Erro ao entrar. Verifique os dados.';
          setAuthError(errMsg);
          resolve({ success: false, error: errMsg });
        }
      });
    });
  };

  // Register Method
  const register = (email, password, username, avatarColor = 'from-indigo-500 to-purple-600', rememberMe = true) => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Servidor desconectado.' });
      setAuthError(null);

      const avatar = (username || email.split('@')[0]).substring(0, 2).toUpperCase();

      socketRef.current.emit(
        'auth-register',
        { email, password, username, avatar, avatarColor },
        (res) => {
          if (res && res.success) {
            setCurrentUser(res.user);
            setIsAuthenticated(true);
            if (res.servers) setInitialServersData(res.servers);
            if (res.voiceRooms) setInitialVoiceRoomsData(res.voiceRooms);

            if (rememberMe) {
              localStorage.setItem(
                'pulsecord_session',
                JSON.stringify({ token: res.user.token, userId: res.user.id, email: res.user.email })
              );
            } else {
              localStorage.removeItem('pulsecord_session');
            }
            resolve({ success: true, user: res.user });
          } else {
            const errMsg = res?.error || 'Erro ao cadastrar.';
            setAuthError(errMsg);
            resolve({ success: false, error: errMsg });
          }
        }
      );
    });
  };

  // Quick Guest Login Method (1-click test with nickname)
  const loginGuest = (username, avatarColor = 'from-indigo-500 to-purple-600') => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Servidor desconectado.' });
      setAuthError(null);

      const cleanUsername = (username || `User_${Math.floor(1000 + Math.random() * 9000)}`).trim();

      socketRef.current.emit(
        'auth-guest',
        { username: cleanUsername, avatarColor },
        (res) => {
          if (res && res.success) {
            setCurrentUser(res.user);
            setIsAuthenticated(true);
            if (res.servers) setInitialServersData(res.servers);
            if (res.voiceRooms) setInitialVoiceRoomsData(res.voiceRooms);
            localStorage.setItem(
              'pulsecord_session',
              JSON.stringify({ token: res.user.token, userId: res.user.id, email: res.user.email })
            );
            resolve({ success: true, user: res.user });
          } else {
            const errMsg = res?.error || 'Erro ao entrar.';
            setAuthError(errMsg);
            resolve({ success: false, error: errMsg });
          }
        }
      );
    });
  };

  // Google OAuth Login Method
  const loginGoogle = (googlePayload) => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Servidor desconectado.' });
      setAuthError(null);

      const timer = setTimeout(() => {
        setAuthError('Tempo limite esgotado ao autenticar com o servidor.');
        resolve({ success: false, error: 'Tempo limite esgotado.' });
      }, 10000);

      socketRef.current.emit('auth-google', googlePayload, (res) => {
        clearTimeout(timer);
        if (res && res.success) {
          setCurrentUser(res.user);
          setIsAuthenticated(true);
          if (res.servers) setInitialServersData(res.servers);
          if (res.voiceRooms) setInitialVoiceRoomsData(res.voiceRooms);
          localStorage.setItem(
            'pulsecord_session',
            JSON.stringify({ token: res.user.token, userId: res.user.id, email: res.user.email })
          );
          resolve({ success: true, user: res.user });
        } else if (res && res.needOnboarding) {
          resolve({ success: false, needOnboarding: true, googleUser: res });
        } else {
          const errMsg = res?.error || 'Erro ao autenticar com o Google.';
          setAuthError(errMsg);
          resolve({ success: false, error: errMsg });
        }
      });
    });
  };

  // Logout Method
  const logout = () => {
    localStorage.removeItem('pulsecord_session');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setInitialServersData([]);
    setInitialVoiceRoomsData(null);
  };

  // Delete Account Permanently (Purge all user data)
  const deleteAccount = (confirmUsername) => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Servidor desconectado.' });

      socketRef.current.emit('delete-account', { confirmUsername }, (res) => {
        if (res && res.success) {
          logout();
          resolve({ success: true });
        } else {
          resolve({ success: false, error: res?.error || 'Erro ao excluir conta.' });
        }
      });
    });
  };

  // Update Profile
  const updateProfile = (profileData) => {
    return new Promise((resolve) => {
      let finalUser = null;
      // Optimistically update currentUser locally right away
      setCurrentUser((prev) => {
        finalUser = {
          ...(prev || {}),
          ...profileData
        };

        // Persist in localStorage if session exists
        const savedSession = localStorage.getItem('pulsecord_session');
        if (savedSession) {
          try {
            const session = JSON.parse(savedSession);
            localStorage.setItem(
              'pulsecord_session',
              JSON.stringify({ ...session, user: finalUser })
            );
          } catch (e) {}
        }
        return finalUser;
      });

      if (!socketRef.current || !socketRef.current.connected) {
        return resolve({ success: true, user: finalUser });
      }

      // Set a 3-second fallback timeout in case backend takes too long
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({ success: true, user: finalUser });
        }
      }, 3000);

      socketRef.current.emit('update-profile', profileData, (res) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        if (res && res.success && res.user) {
          const userWithStatus = {
            ...res.user,
            status: profileData.status || res.user.status || finalUser?.status || 'online'
          };
          setCurrentUser(userWithStatus);

          const savedSession = localStorage.getItem('pulsecord_session');
          if (savedSession) {
            try {
              const session = JSON.parse(savedSession);
              localStorage.setItem(
                'pulsecord_session',
                JSON.stringify({ ...session, user: userWithStatus })
              );
            } catch (e) {}
          }
          resolve({ success: true, user: userWithStatus });
        } else {
          resolve({ success: true, user: finalUser });
        }
      });
    });
  };

  const updateCurrentUser = (newUser) => {
    setCurrentUser(newUser);
    const savedSession = localStorage.getItem('pulsecord_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        localStorage.setItem(
          'pulsecord_session',
          JSON.stringify({ ...session, user: newUser })
        );
      } catch (e) {}
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        serverUrl,
        updateServerUrl,
        currentUser,
        updateCurrentUser,
        updateProfile,
        isAuthenticated,
        authLoading,
        authError,
        setAuthError,
        login,
        loginGuest,
        loginGoogle,
        register,
        logout,
        deleteAccount,
        initialServersData,
        initialVoiceRoomsData
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
