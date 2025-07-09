// friendbook/client/src/contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import useWebSocket from 'react-use-websocket';
import { useAuth } from './AuthContext';

const SocketContext = createContext<any>(null); // Use 'any' or define a more specific type

export const useSocket = () => {
  return useContext(SocketContext);
};

const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const wsUrl = `ws://localhost:5001?token=${accessToken}`; // <-- Pass token in URL

  // useWebSocket hook with the dynamic URL
  const { sendMessage, lastMessage, readyState } = useWebSocket(user && accessToken ? wsUrl : null, {
    shouldReconnect: (closeEvent) => true, // Always attempt to reconnect
    reconnectInterval: 3000,
    reconnectAttempts: 10,
  });

  // The value provided to the context includes the messaging functions
  const contextValue = {
    sendMessage,
    lastMessage,
    readyState,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;