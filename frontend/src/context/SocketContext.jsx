import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null); // ← expose as state so consumers re-render on connect
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    const s = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      console.log('🔌 Socket connected:', s.id);
      socketRef.current = s;
      setSocket(s);       // ← triggers re-render in consumers
      setConnected(true);
    });

    s.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setConnected(false);
    });

    s.on('reconnect', () => {
      console.log('🔌 Socket reconnected');
      socketRef.current = s;
      setSocket(s);
      setConnected(true);
    });

    s.on('connect_error', err => console.warn('Socket error:', err.message));

    socketRef.current = s;

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [user]);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }, []);

  // ← these now just return the socket for direct use
  const getSocket = useCallback(() => socketRef.current, []);

  return (
    <SocketContext.Provider value={{ socket, connected, emit, getSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);