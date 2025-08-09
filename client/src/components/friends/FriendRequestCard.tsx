// client/src/components/friends/FriendRequestCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAcceptFriendRequest, useRejectFriendRequest } from '../../queries/friends/friendQueries'; // Import mutations

// Use a constant for the Cloudinary dummy image URL
const DUMMY_PROFILE_IMAGE_URL = "https://res.cloudinary.com/dwpldlqbv/image/upload/v1754898012/rzpqnq0omenxrynvclxf.jpg";

interface FriendRequestCardProps {
  requestId: string;
  senderId: string;
  senderName: string;
  senderProfileImageUrl?: string | null;
}

function FriendRequestCard({ requestId, senderId, senderName, senderProfileImageUrl }: FriendRequestCardProps) {
  const acceptMutation = useAcceptFriendRequest();
  const rejectMutation = useRejectFriendRequest();

  const handleAccept = () => {
    if (!acceptMutation.isPending) {
      acceptMutation.mutate({ requestId });
    }
  };

  const handleReject = () => {
    if (!rejectMutation.isPending) {
      rejectMutation.mutate({ requestId });
    }
  };

  const isMutating = acceptMutation.isPending || rejectMutation.isPending;

  return (
    <div className='rounded-xl shadow flex flex-col overflow-hidden min-w-52 min-h-80 justify-between'>
      <div className='bg-gray-500 w-full h-full flex-1 cursor-pointer'>
        <Link to={`/profile/${senderId}`}>
          <img
            // FIX: Use the DUMMY_PROFILE_IMAGE_URL constant as the fallback
            src={senderProfileImageUrl || DUMMY_PROFILE_IMAGE_URL} 
            alt={senderName}
            className='w-full h-full object-cover aspect-square'
          />
        </Link>
      </div>
      <div className='bg-white w-full flex flex-col items-center gap-2 p-4'>
        <h3 className='font-semibold w-full text-xl'>
          <Link to={`/profile/${senderId}`} className="hover:underline">
            {senderName}
          </Link>
        </h3>
        <button
          onClick={handleAccept}
          disabled={isMutating}
          className='bg-blue-500 text-white rounded w-full p-2 font-semibold cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {acceptMutation.isPending ? 'Confirming...' : 'Confirm'}
        </button>
        <button
          onClick={handleReject}
          disabled={isMutating}
          className='bg-gray-300 rounded w-full p-2 font-semibold cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {rejectMutation.isPending ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

export default FriendRequestCard;
