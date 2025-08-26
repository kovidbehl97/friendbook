import { useFriends } from '../../queries/friends/friendQueries';
import { useMessenger } from '../../contexts/MessengerContext';

// Use a constant for the placeholder URL
const DUMMY_PROFILE_IMAGE_URL = "https://res.cloudinary.com/dwpldlqbv/image/upload/v1754898012/rzpqnq0omenxrynvclxf.jpg";

function RightSideBar() {
  const { onSelectFriend, onOpenMessenger } = useMessenger();
  const { data: friends, isLoading, isError } = useFriends();

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading friends...</div>;
  }

  if (isError) {
    return <div className="p-4 text-center text-red-500">Failed to load friends.</div>;
  }

  return (
    <>
      <h3 className="text-lg font-semibold">
        Your Friends
      </h3>
      <div className="max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={onOpenMessenger}
            className="text-blue-500 hover:text-blue-600 transition-colors"
            title="Open Messenger"
          >
            {/* You can add a message icon here if you want */}
          </button>
        </div>

        {(!friends || friends.length === 0) ? (
          <div className="p-4 text-center text-gray-500">
            You have no friends yet.
          </div>
        ) : (
          <ul>
            {friends.map((friend) => (
              <li key={friend.id} className="mb-2">
                <button
                  onClick={() => onSelectFriend(friend.id)}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 w-full text-left"
                >
                  {/* Display friend's profile image or dummy image */}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={friend.profileImageUrl || DUMMY_PROFILE_IMAGE_URL}
                      alt={`${friend.name}'s profile`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-medium text-gray-800 truncate">
                    {friend.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default RightSideBar;