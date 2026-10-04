import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

 const socketUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    const newSocket = io(socketUrl, { 
  withCredentials: true, 
});
    newSocket.on('connect', () => {
      console.log('🔌 Socket connecté');
      newSocket.emit('register', user.id);
    });

    newSocket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('new-message', (data) => {
      console.log('📨 Nouveau message reçu:', data);
    });

    newSocket.on('new-task', (task) => {
      console.log('📋 Nouvelle tâche reçue:', task);
    });

    newSocket.on('new-notification', (notification) => {
      console.log('🔔 Nouvelle notification:', notification);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket déconnecté');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, isAuthenticated]);

  const value = {
    socket,
    onlineUsers,
    isConnected: socket?.connected || false,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;