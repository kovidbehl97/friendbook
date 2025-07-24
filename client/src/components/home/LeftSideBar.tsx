import { Link } from "react-router-dom";
import { useCurrentUser } from "../../queries/users/useCurrentUser";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserGroup } from '@fortawesome/free-solid-svg-icons';

// Use a constant for the placeholder URL
const DUMMY_PROFILE_IMAGE_URL = "https://res.cloudinary.com/dwpldlqbv/image/upload/v1754898012/rzpqnq0omenxrynvclxf.jpg";

function LeftSideBar() {
  const { data: currentUser, isLoading, isError, error } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-w-80">
        <ul className="flex flex-col gap-4 p-4 pt-0">
          <li className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-gray-200"></div>
            <div>Loading current user...</div>
          </li>
        </ul>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-w-80">
        <ul className="flex flex-col gap-4 p-4 pt-0">
          <li className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-gray-200"></div>
            <div className="text-red-500">
              Error loading user: {error?.message}
            </div>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className=" min-w-80">
      <ul className="flex flex-col gap-4 p-4 pt-0">
        {/* The entire list item is now a Link to the user's profile */}
        <li className="flex items-center gap-4 hover:bg-gray-200 rounded-lg p-2 transition-colors -ml-2 -mt-2">
          <Link to={`/profile/${currentUser?.id}`} className="flex items-center gap-4 w-full">
            {/* The profile picture is now a container for the image */}
            <div className="w-9 h-9 rounded-full overflow-hidden flex justify-center items-center"> 
              <img
                src={currentUser?.profileImageUrl || DUMMY_PROFILE_IMAGE_URL}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              {currentUser ? currentUser.name : "User data not available"}
            </div>
          </Link>
        </li>
        <li className="flex items-center gap-4 hover:bg-gray-200 rounded-lg p-2 transition-colors -ml-2">
          <Link to={"/friends"} className="flex items-center gap-4 w-full">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-blue-500">
              <FontAwesomeIcon icon={faUserGroup} />
            </div>
            <div>Friends</div>
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default LeftSideBar;