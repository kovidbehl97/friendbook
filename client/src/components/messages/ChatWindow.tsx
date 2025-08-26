// client/src/components/messages/ChatWindow.tsx

import { useState, useRef, useEffect } from 'react';
import { useMessagesForConversation, useSendMessage } from '../../queries/messages/messageQueries';
import { useUserProfile } from '../../queries/users/useUserProfile';
import { useCurrentUser } from '../../queries/users/useCurrentUser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

interface ChatWindowProps {
  friendId: string;
  // FIX: Updated the prop name from onBackToConversations to onClose
  onClose: () => void;
}

const DUMMY_PROFILE_IMAGE_URL = "https://res.cloudinary.com/dwpldlqbv/image/upload/v1754898012/rzpqnq0omenxrynvclxf.jpg";

// FIX: Updated the component signature to destructure the onClose prop
function ChatWindow({ friendId, onClose }: ChatWindowProps) {
  const { data: currentUser } = useCurrentUser();
  const { data: friendProfile } = useUserProfile(friendId);

  const [messageContent, setMessageContent] = useState('');
  const [page] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: messagesResponse,
    isLoading: messagesLoading,
    isError: messagesError,
    error: messagesFetchError,
  } = useMessagesForConversation(friendId || '', page);

  const sendMessageMutation = useSendMessage();

  const messages = messagesResponse?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (messageContent.trim() === '' || !friendId) return;

    try {
      await sendMessageMutation.mutateAsync({
        receiverId: friendId,
        content: messageContent.trim(),
      });
      setMessageContent('');
    } catch (error) {
      // Error handled by useSendMessage's onError
    }
  };

  if (messagesLoading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading messages...</p>
      </div>
    );
  }

  if (messagesError) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50 text-red-500">
        <p>Error loading messages: {messagesFetchError?.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow bg-gray-50" style={{ maxHeight: "600px"}}>
      {/* Chat Header */}
      <div className="bg-white p-4 border-b border-gray-200 shadow-sm flex items-center">
        {/* Removed the arrow_back button */}
        <img
          src={friendProfile?.profileImageUrl || DUMMY_PROFILE_IMAGE_URL}
          alt={friendProfile?.name || 'Friend'}
          className="w-10 h-10 rounded-full object-cover mr-3"
        />
        <h3 className="flex-grow text-lg font-semibold text-gray-800">{friendProfile?.name || 'Loading...'}</h3>
        {/* Added a new close button that calls the onClose prop */}
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">No messages yet. Say hello!</div>
        ) : (
          messages.map((message) => {
            const isMyMessage = message.senderId === currentUser?.id;
            const profileImageUrl = isMyMessage 
              ? currentUser?.profileImageUrl || DUMMY_PROFILE_IMAGE_URL 
              : friendProfile?.profileImageUrl || DUMMY_PROFILE_IMAGE_URL;

            return (
              <div
                key={message.id}
                className={`flex items-end ${isMyMessage ? 'justify-end' : 'justify-start'} my-5`}
              >
                {/* Render friend's avatar for their messages */}
                {!isMyMessage && (
                  <img
                    src={profileImageUrl}
                    alt={friendProfile?.name || 'Friend'}
                    className="w-8 h-8 rounded-full object-cover mr-2"
                  />
                )}
                
                <div
                  className={`max-w-xs p-3 rounded-lg shadow-sm ${
                    isMyMessage
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p>{message.content}</p>
                  <span className="block text-xs mt-1 opacity-75">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Render current user's avatar for their messages */}
                {isMyMessage && (
                  <img
                    src={profileImageUrl}
                    alt={currentUser?.name || 'You'}
                    className="w-8 h-8 rounded-full object-cover ml-2"
                  />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex items-center">
        <input
          type="text"
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 mr-3"
          disabled={sendMessageMutation.isPending}
        />
        <button
          type="submit"
          className={`px-5 py-3 bg-blue-500 ${sendMessageMutation.isPending ? 'text-blue-200' : 'text-white'} text-xl cursor-pointer rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50`}
          disabled={sendMessageMutation.isPending}
        >
          <FontAwesomeIcon icon={faPaperPlane} className='transform rotate-[55deg]'/>
          
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;
