// client/src/routes/friends/FriendRequestsPage.tsx

import FriendRequestCard from '../../components/friends/FriendRequestCard';
import { useFriendRequestsReceived } from '../../queries/friends/friendQueries'; // Import the hook

function FriendRequestsPage() {
  const { data: requests, isLoading, isError, error } = useFriendRequestsReceived();
  console.log('Type of requests:', typeof requests);
  console.log('Value of requests:', requests);

  if (isLoading) {
    return (
      <div className="p-5 w-full text-center text-gray-600">
        <p>Loading friend requests...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-5 w-full text-center text-red-600">
        <p>Error loading requests: {error?.message || 'An unknown error occurred.'}</p>
      </div>
    );
  }

  // Ensure requests is an array before trying to map over it
  // This is the key change: `requests || []`
  if (!requests || requests.length === 0) {
    return (
      <div className="p-5 w-full text-center text-gray-600">
        <p>You have no pending friend requests.</p>
      </div>
    );
  }

  return (
    <div className='p-5 flex-grow overflow-y-auto'>
      <h2 className="text-2xl font-bold mb-6">Friend Requests</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Use requests safely now that we've checked for its existence */}
        {(requests || []).map((request) => (
          <FriendRequestCard
            key={request.id}
            requestId={request.id}
            senderId={request.sender.id}
            senderName={request.sender.name}
            senderProfileImageUrl={request.sender.profileImageUrl}
          />
        ))}
      </div>
    </div>
  );
}

export default FriendRequestsPage;