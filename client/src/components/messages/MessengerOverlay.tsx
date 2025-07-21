// client/src/components/common/MessengerOverlay.tsx

import React, { useState, useRef, useEffect } from 'react';
import FriendAndConversationList from '../messages/FriendAndConversationList'; 
import ChatWindow from '../messages/ChatWindow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface MessengerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  // New optional prop to open a specific friend's chat
  initialFriendId?: string | null;
}

function MessengerOverlay({ isOpen, onClose, initialFriendId }: MessengerOverlayProps) {
  // Use a state to manage the selected friend, defaulting to the initial prop
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(initialFriendId || null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // When the initialFriendId prop changes, update the internal state
  useEffect(() => {
    if (initialFriendId) {
      setSelectedFriendId(initialFriendId);
    }
  }, [initialFriendId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      // Reset selected friend when closed
      setSelectedFriendId(null);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed bottom-4 right-4 z-50 bg-white shadow-xl rounded-lg flex flex-col overflow-hidden"
      style={{ width: '800px', height: '600px' }}
    >
      <div className="flex flex-grow">
        <FriendAndConversationList
          onSelectConversation={(friendId) => setSelectedFriendId(friendId)}
          selectedConversationId={selectedFriendId}
        />

        {selectedFriendId ? (
          <ChatWindow
            friendId={selectedFriendId}
            onClose={onClose}
          />
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 text-gray-600 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              aria-label="Close messenger"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <p>Select a conversation or friend to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessengerOverlay;
