// client/src/routes/friends/FriendsPageMain.tsx
import FriendCard from '../../components/friends/FriendCard'; // Adjust path if needed
import { useFriends } from '../../queries/friends/friendQueries'; // Import the hook

function FriendsPageMain() {
  // Use the useFriends hook to fetch the list of friends
  const { data: friends, isLoading, isError, error } = useFriends();

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p>Loading your friends...</p>
        {/* You could add a spinner or skeleton loader here */}
      </div>
    );
  }

  // --- Error State ---
  if (isError) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Error loading friends: {error?.message || 'An unknown error occurred.'}</p>
      </div>
    );
  }

  // --- No Friends Found State ---
  if (!friends || friends.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p>You don't have any friends yet.</p>
        <p>Start sending friend requests to connect with others!</p>
      </div>
    );
  }

  // --- Display Friends ---
  return (
    <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-6">Your Friends</h1>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {friends.map((friend) => (
        <FriendCard
          key={friend.id}
          id={friend.id} // Pass the ID
          name={friend.name}
          profileImageUrl={friend.profileImageUrl} // Pass the image URL
        />
      ))}
    </div>
  </div>
  );
}

export default FriendsPageMain;