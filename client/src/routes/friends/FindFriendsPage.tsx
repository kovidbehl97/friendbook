import { useState } from 'react';
import { useSearchUsers } from '../../queries/users/useSearchUsers';
import { Link } from 'react-router-dom';

const DUMMY_PROFILE_IMAGE_URL = "https://res.cloudinary.com/<your_cloud_name>/image/upload/social_app/profile-placeholder.jpg";

function FindFriendsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: users, isLoading, isError } = useSearchUsers(searchQuery);

  return (
    <div className="w-full max-w-xl p-4">
      <h2 className="text-2xl font-bold mb-4">Find Friends</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          // Added bg-white to the input field
          className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading && searchQuery && (
        <div className="text-center text-gray-500">Searching...</div>
      )}

      {isError && (
        <div className="text-center text-red-500">
          Error searching for users.
        </div>
      )}

      {!isLoading && !isError && users && users.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-4">
          <ul className="space-y-4">
            {users.map((user) => (
              <li key={user.id}>
                <Link
                  to={`/profile/${user.id}`}
                  className="flex items-center gap-3 p-2 -m-2 rounded-md transition-colors duration-200 hover:bg-gray-100"
                >
                  {/* Replaced placeholder div with an image */}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={user.profileImageUrl || DUMMY_PROFILE_IMAGE_URL}
                      alt={`${user.name}'s profile`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-semibold">{user.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isLoading && !isError && users && searchQuery && users.length === 0 && (
        <div className="text-center text-gray-500">No users found.</div>
      )}

      {!searchQuery && (
        <div className="text-center text-gray-500">
          Start typing to find people.
        </div>
      )}
    </div>
  );
}

export default FindFriendsPage;