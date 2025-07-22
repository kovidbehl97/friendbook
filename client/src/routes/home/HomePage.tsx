// friendbook/client/src/routes/HomePage.tsx

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import NavBar from "../../components/NavBar";
import MessengerOverlay from "../../components/messages/MessengerOverlay";
import { useCurrentUser } from '../../queries/users/useCurrentUser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookMessenger } from '@fortawesome/free-brands-svg-icons';
import MessengerContext from '../../contexts/MessengerContext';

function HomePage() {
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const { data: currentUser } = useCurrentUser();

  // Function to open the messenger to a specific friend
  const handleSelectFriend = (friendId: string) => {
    setSelectedFriendId(friendId);
    setIsMessengerOpen(true);
  };

  // Function to open the messenger to the conversation list
  const handleOpenMessenger = () => {
    setSelectedFriendId(null);
    setIsMessengerOpen(true);
  };
  
  // The context value we will provide to child components
  const messengerContextValue = {
    onSelectFriend: handleSelectFriend,
    onOpenMessenger: handleOpenMessenger,
  };

  return (
    <div className="w-full h-screen max-h-screen relative">
      <NavBar/>
      
      <MessengerContext.Provider value={messengerContextValue}>
        <Outlet/>
      </MessengerContext.Provider>
     
      {currentUser && (
        <button
          onClick={handleOpenMessenger}
          className="fixed bottom-4 right-4 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40 h-16 w-16 flex items-center justify-center cursor-pointer"
          title="Open Messages"
        >
          <span className="text-3xl"><FontAwesomeIcon icon={faFacebookMessenger} /></span>
        </button>
      )}

      <MessengerOverlay 
        isOpen={isMessengerOpen} 
        onClose={() => setIsMessengerOpen(false)} 
        initialFriendId={selectedFriendId}
      />
    </div>
  );
}

export default HomePage;