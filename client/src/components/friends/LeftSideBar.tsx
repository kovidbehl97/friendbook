// client/src/components/friends/LeftSideBar.tsx
import { Link } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChildren, faUserGroup, faUsers } from '@fortawesome/free-solid-svg-icons'; // Importing FontAwesome icon for friend requests


function LeftSideBar() {
  return (
    <div className=" min-w-80 bg-white pt-5 shadow-md relative">
        <ul className="flex flex-col gap-4 p-4 pt-0">
          <li className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex justify-center items-center text-blue-500">
            <FontAwesomeIcon icon={faUserGroup} />
            </div>
            <Link to={"/friends"}>Friends</Link>
          </li>
          <li className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-blue-500">
            <FontAwesomeIcon icon={faUsers} />
            </div>
            <Link to={"/friends/find"}>Find Friends</Link>
          </li>
          <li className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-blue-500">
            <FontAwesomeIcon icon={faChildren} />
            </div>
            <Link to={"/friends/requests"}>Friend Requests</Link>
          </li>
        </ul>
      </div>
  )
}

export default LeftSideBar