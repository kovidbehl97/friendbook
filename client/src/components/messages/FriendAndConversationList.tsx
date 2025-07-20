// client/src/components/messages/FriendAndConversationList.tsx

import React, { useState, useMemo } from 'react';
import { useConversations, Conversation } from '../../queries/messages/messageQueries';
import { useFriends, Friend } from '../../queries/friends/friendQueries'; // FIX 1: Changed FriendDisplayItem to Friend
import { useCurrentUser } from '../../queries/users/useCurrentUser';

interface FriendAndConversationListProps {
  onSelectConversation: (friendId: string) => void;
  selectedConversationId: string | null;
}

const DUMMY_PROFILE_IMAGE_URL = "https://res.cloudinary.com/dwpldlqbv/image/upload/v1754898012/rzpqnq0omenxrynvclxf.jpg";

// A more specific type to combine Conversation and Friend for cleaner code
type CombinedItem = {
  id: string;
  name: string;
  profileImageUrl?: string | null;
} & (
  { type: 'conversation', lastMessageContent: string; lastMessageAt: string; } |
  { type: 'friend' }
);

function FriendAndConversationList({
  onSelectConversation,
  selectedConversationId,
}: FriendAndConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  // FIX 2: Destructure the specific error object for both hooks
  const { data: conversations, isLoading: loadingConversations, isError: errorConversations, error: convError } = useConversations();
  const { data: allFriends, isLoading: loadingAllFriends, isError: errorAllFriends, error: friendError } = useFriends();
  const { data: currentUser } = useCurrentUser();

  const isLoading = loadingConversations || loadingAllFriends;
  const isError = errorConversations || errorAllFriends;
  // FIX 3: Use the specific error object, which has a .message property
  const error = convError || friendError; 

  const filteredItems = useMemo(() => {
    if (!conversations || !allFriends) return [];

    const uniqueItemsMap = new Map<string, CombinedItem>();

    // Add conversations first
    conversations.forEach(conv => {
      if (conv.userId !== currentUser?.id) {
        uniqueItemsMap.set(conv.userId, {
          id: conv.userId,
          name: conv.userName,
          profileImageUrl: conv.profileImageUrl,
          type: 'conversation',
          lastMessageContent: conv.lastMessageContent,
          lastMessageAt: conv.lastMessageAt,
        });
      }
    });

    // Add remaining friends who don't have active conversations
    allFriends.forEach(friend => {
      if (friend.id !== currentUser?.id && !uniqueItemsMap.has(friend.id)) {
        uniqueItemsMap.set(friend.id, {
          id: friend.id,
          name: friend.name,
          profileImageUrl: friend.profileImageUrl,
          type: 'friend',
        });
      }
    });

    const items = Array.from(uniqueItemsMap.values());

    if (!searchTerm) {
      return items.sort((a, b) => {
        if (a.type === 'conversation' && b.type === 'conversation') {
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        }
        if (a.type === 'conversation') return -1;
        if (b.type === 'conversation') return 1;
        return a.name.localeCompare(b.name);
      });
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(lowerCaseSearchTerm)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [conversations, allFriends, searchTerm, currentUser]);


  if (isLoading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 p-4 flex flex-col items-center justify-center">
        <p className="text-gray-600">Loading friends and conversations...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 p-4 flex flex-col items-center justify-center text-red-500">
        <p>Error loading data: {error?.message}</p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto" style={{ maxHeight: '600' }}>
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <input
          type="text"
          placeholder="Search friends or conversations..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Friend/Conversation List */}
      <ul className="flex-grow">
        {filteredItems.length === 0 && !searchTerm ? (
          <li className="p-4 text-gray-600 text-center">No friends or conversations yet.</li>
        ) : filteredItems.length === 0 && searchTerm ? (
          <li className="p-4 text-gray-600 text-center">No results found for "{searchTerm}".</li>
        ) : (
          filteredItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => onSelectConversation(item.id)}
                className={`flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 w-full text-left ${
                  selectedConversationId === item.id ? 'bg-blue-50' : ''
                }`}
              >
                <img
                  src={item.profileImageUrl || DUMMY_PROFILE_IMAGE_URL}
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover mr-3"
                />
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800">
                    {item.name}
                    {item.type === 'conversation' && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                        Chat
                      </span>
                    )}
                  </p>
                  {item.type === 'conversation' && (
                    <p className="text-sm text-gray-600 truncate">
                      {item.lastMessageContent}
                    </p>
                  )}
                </div>
                {item.type === 'conversation' && (
                  <p className="text-xs text-gray-500 ml-2">
                    {new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default FriendAndConversationList;
