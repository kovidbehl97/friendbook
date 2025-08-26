import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useCurrentUser } from "../queries/users/useCurrentUser";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from '../contexts/SocketContext';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faUserGroup,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  Notification,
} from "../queries/notifications/notificationQueries";
import { useQueryClient } from "@tanstack/react-query";

function NavBar() {
  const { data: currentUser, isLoading: isCurrentUserLoading } = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lastMessage } = useSocket();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { data: notificationsData, isLoading: isNotificationsLoading } = useNotifications();
  const notifications = notificationsData?.notifications || [];
  const markAllNotificationsAsReadMutation = useMarkAllNotificationsAsRead();
  const markNotificationAsReadMutation = useMarkNotificationAsRead();
  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length || 0;

  const DUMMY_PROFILE_IMAGE_URL = "https://res.cloudinary.com/dwpldlqbv/image/upload/v1754898012/rzpqnq0omenxrynvclxf.jpg";

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
    setIsNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
    setIsDropdownOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsReadMutation.mutate();
  };

  const getNotificationText = (notification: Notification): string => {
    switch (notification.type) {
      case 'friendRequest':
      case 'friendRequestAccepted':
        return `${notification.sender?.name || 'A user'} sent you a friend request.`;
      case 'postLiked':
        return `${notification.sender?.name || 'A user'} liked your post.`;
      case 'postCommented':
        return `${notification.sender?.name || 'A user'} commented on your post.`;
      case 'commentLiked':
        return `${notification.sender?.name || 'A user'} liked your comment.`;
      default:
        return notification.message || 'New notification';
    }
  };

  // FIXED: Added better fallback logic to handle missing data
  const getNotificationUrl = (notification: Notification): string => {
    switch (notification.type) {
      case 'friendRequest':
      case 'friendRequestAccepted':
        // FIXED: Check if sender.id exists before creating the URL
        return notification.sender?.id ? `/profile/${notification.sender.id}` : '#';
      case 'postLiked':
      case 'postCommented':
      case 'commentLiked':
        // FIXED: Check if relatedId exists before creating the URL
        return notification.relatedId ? `/posts/${notification.relatedId}` : '#';
      default:
        return '#';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!lastMessage) {
      console.log('No lastMessage received yet');
      return;
    }
    console.log('Raw WebSocket message:', lastMessage.data);
    try {
      const message = JSON.parse(lastMessage.data as string);
      console.log('Parsed message:', message);
      if (message.type === 'new_notification') {
        const newNotification = message.payload as Notification;
        console.log('Adding notification to cache:', newNotification);
        queryClient.setQueryData<{ notifications: Notification[] }>(
          ['notifications'],
          (oldData) => {
            const newData = oldData
              ? { notifications: [newNotification, ...oldData.notifications] }
              : { notifications: [newNotification] };
            console.log('Updated cache:', newData);
            return newData;
          }
        );
      } else {
        console.log('Ignoring non-notification message:', message);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [lastMessage, queryClient]);

  const isProfileLinkClickable = currentUser && !isCurrentUserLoading;
  const profileLinkTo = isProfileLinkClickable
    ? `/profile/${currentUser.id}`
    : "#";

  return (
    <div className="px-5 flex justify-between items-center h-[56px] shadow-md sticky top-0 left-0 w-full z-10 bg-white">
      <Link to="/" className="text-3xl font-bold text-blue-500">
        friendbook
      </Link>
      <div className="flex gap-4 items-center">
        <div className="relative" ref={notificationsRef}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 cursor-pointer text-gray-700 hover:bg-gray-300 transition-colors relative"
            onClick={toggleNotifications}
          >
            <span className="flex justify-center items-center text-blue-500">
              <FontAwesomeIcon icon={faBell} />
            </span>
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"></span>
            )}
          </div>
          <div className={`absolute right-0 top-full bg-white shadow-lg rounded-md mt-2 p-2 w-80 z-20 border border-gray-100 ${isNotificationsOpen ? 'block' : 'hidden'}`}>
            <div className="flex justify-between items-center px-2 py-1">
              <h3 className="font-bold text-lg">Notifications</h3>
              {unreadNotificationsCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-500 hover:underline"
                  disabled={markAllNotificationsAsReadMutation.isPending}
                >
                  Mark all as read
                </button>
              )}
            </div>
            <hr className="my-2 border-gray-200" />
            <div className="max-h-80 overflow-y-auto">
              {isNotificationsLoading ? (
                <div className="p-2 text-center text-gray-500">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-2 text-center text-gray-500">
                  No new notifications.
                </div>
              ) : (
                <ul>
                  {notifications.map((notif) => (
                    <li
                      key={notif.id}
                      className={`p-2 rounded-md transition-colors ${
                        notif.isRead
                          ? "bg-gray-50"
                          : "bg-blue-50 hover:bg-blue-100"
                      }`}
                    >
                      <Link
                        to={getNotificationUrl(notif)}
                        onClick={() => {
                          // Only mark as read if the URL is a real link, not a fallback '#'
                          if (getNotificationUrl(notif) !== '#') {
                            markNotificationAsReadMutation.mutate(notif.id);
                            setIsNotificationsOpen(false);
                          }
                        }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0">
                          <img
                            src={notif.sender?.profileImageUrl || DUMMY_PROFILE_IMAGE_URL}
                            alt={`${notif.sender?.name}'s profile`}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                        <div className="flex-grow">
                          <p
                            className={`text-sm ${
                              notif.isRead
                                ? "text-gray-600"
                                : "font-semibold text-gray-800"
                            }`}
                          >
                            {getNotificationText(notif)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="relative" ref={dropdownRef}>
          <div
            className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all duration-200"
            onClick={toggleDropdown}
          >
            <img
              src={currentUser?.profileImageUrl || DUMMY_PROFILE_IMAGE_URL}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <ul className={`absolute right-0 top-full bg-white shadow-lg rounded-md mt-2 p-2 w-48 z-20 border border-gray-100 ${isDropdownOpen ? 'block' : 'hidden'}`}>
            <li
              className="p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <Link
                to={profileLinkTo}
                className={`flex items-center gap-3 ${
                  !isProfileLinkClickable
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={(e) => {
                  if (!isProfileLinkClickable) {
                    e.preventDefault();
                  } else {
                    setIsDropdownOpen(false);
                  }
                }}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src={currentUser?.profileImageUrl || DUMMY_PROFILE_IMAGE_URL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-medium text-gray-800 truncate">
                  {isCurrentUserLoading
                    ? "Loading Profile..."
                    : currentUser?.name || "Profile"}
                </span>
              </Link>
            </li>
            <hr className="my-2 border-gray-200" />
            <li
              className="p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <Link to="/friends" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                  <span className="flex justify-center items-center text-blue-500">
                    <FontAwesomeIcon icon={faUserGroup} />
                  </span>
                </div>
                <span className="text-gray-800">Friends</span>
              </Link>
            </li>
            <li
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-md cursor-pointer flex items-center gap-3 transition-colors text-red-600"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <span className="material-icons text-lg">
                  <FontAwesomeIcon icon={faRightFromBracket} />
                </span>
              </div>
              Logout
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default NavBar;
