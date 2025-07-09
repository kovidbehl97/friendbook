import { createContext, useContext } from 'react';

// Define the shape of our context value
interface MessengerContextValue {
  onSelectFriend: (friendId: string) => void;
  onOpenMessenger: () => void;
}

// Create the context with a default value
const MessengerContext = createContext<MessengerContextValue | undefined>(undefined);

// A custom hook to use the context
export const useMessenger = () => {
  const context = useContext(MessengerContext);
  if (context === undefined) {
    throw new Error('useMessenger must be used within a MessengerProvider');
  }
  return context;
};

export default MessengerContext;