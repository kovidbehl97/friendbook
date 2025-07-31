import React, { useState } from 'react';
import { useParams, Outlet, NavLink } from 'react-router-dom';
import { useUserProfile } from '../../queries/users/useUserProfile';
import { useCurrentUser } from '../../queries/users/useCurrentUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCameraRetro } from '@fortawesome/free-solid-svg-icons';
import { useFriends } from '../../queries/friends/friendQueries';


// Define a type for friendship status
type FriendshipStatus = 'FRIEND' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'NONE';

// **NOTE**: The friends property has been removed from this interface
// because it is now fetched by the useFriends hook.
export interface UserProfileData {
  id: string;
  name: string;
  bio?: string | null;
  coverImageUrl?: string | null;
  profileImageUrl?: string | null;
  friendshipStatus?: FriendshipStatus;
  pendingIncomingRequestId?: string | null;
  pendingOutgoingRequestId?: string | null;
  currentWorkplace?: string | null;
  hometown?: string | null;
  studiedAt?: string | null;
  maritalStatus?: string | null;
  contactPhoneNumber?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  socialLinks?: string[];
  currentCity?: string | null;
  pastCities?: string[];
  gender?: string | null;
  pronouns?: string | null;
  dateOfBirth?: string | Date | null;
  languages?: string[];
  workExperiences?: any[];
  educationExperiences?: any[];
}

const DUMMY_PROFILE_IMAGE_URL = "https://res.cloudinary.com/dwpldlqbv/image/upload/v1754898012/rzpqnq0omenxrynvclxf.jpg";



function Profile() {
  const { userId } = useParams<{ userId: string }>();

  const { data: userProfile, isLoading: isProfileLoading, isError: isProfileError } = useUserProfile(userId);
  const { data: currentUser, isLoading: isCurrentUserLoading } = useCurrentUser();
  // NEW: Fetch the friends list using the dedicated hook
  const { data: friendsData, isLoading: isFriendsLoading } = useFriends();

  const queryClient = useQueryClient();

  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const isMyProfile = currentUser && userId === currentUser.id;
  const friendshipStatus = userProfile?.friendshipStatus || 'NONE';
  const incomingRequestId = userProfile?.pendingIncomingRequestId;
  const outgoingRequestId = userProfile?.pendingOutgoingRequestId;

  // --- Mutations for Friend Actions (unchanged) ---

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await axiosInstance.post(`/friends/request/${targetUserId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestsSent'] });
      alert('Friend request sent!');
    },
    onError: (error) => {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request. Please try again.');
    },
  });

  const unfriendMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await axiosInstance.delete(`/friends/${targetUserId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      alert('Unfriended successfully!');
    },
    onError: (error) => {
      console.error('Error unfriending:', error);
      alert('Failed to unfriend. Please try again.');
    },
  });

  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await axiosInstance.post(`/friends/request/accept/${requestId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestsReceived'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      alert('Friend request accepted!');
    },
    onError: (error) => {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request. Please try again.');
    },
  });

  const rejectFriendRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await axiosInstance.post(`/friends/request/reject/${requestId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestsReceived'] });
      alert('Friend request rejected!');
    },
    onError: (error) => {
      console.error('Error rejecting friend request:', error);
      alert('Failed to reject friend request. Please try again.');
    },
  });

  const cancelFriendRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await axiosInstance.delete(`/friends/request/${requestId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestsSent'] });
      alert('Friend request cancelled!');
    },
    onError: (error) => {
      console.error('Error cancelling friend request:', error);
      alert('Failed to cancel friend request. Please try again.');
    },
  });

  // --- Image Upload Mutations and Handlers ---

  const uploadImageMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File, type: 'profileImage' | 'coverImage' }) => {
      const formData = new FormData();
      formData.append(type, file);

      const response = await axiosInstance.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userProfile?.id] });
      if (variables.type === 'profileImage') {
        setIsUploadingProfile(false);
        alert('Profile picture updated!');
      } else {
        setIsUploadingCover(false);
        alert('Cover photo updated!');
      }
    },
    onError: (error, variables) => {
      console.error(`Error uploading ${variables.type}:`, error);
      if (variables.type === 'profileImage') {
        setIsUploadingProfile(false);
        alert('Failed to upload profile picture. Please try again.');
      } else {
        setIsUploadingCover(false);
        alert('Failed to upload cover photo. Please try again.');
      }
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'profileImage' | 'coverImage') => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'profileImage') {
        setIsUploadingProfile(true);
      } else {
        setIsUploadingCover(true);
      }
      uploadImageMutation.mutate({ file, type });
    }
  };

  // --- End Mutations ---

  if (isProfileLoading || isCurrentUserLoading || isFriendsLoading) return <div className="text-center py-8">Loading profile...</div>;
  if (isProfileError) return <div className="text-center py-8 text-red-500">Error loading profile.</div>;
  if (!userProfile) return <div className="text-center py-8">Profile not found.</div>;
  if (!currentUser) return <div className="text-center py-8">Please log in to view friend actions.</div>;

  const friendsCount = friendsData?.length || 0;

  return (
    <div className="bg-gray-100 min-h-screen max-h-screen overflow-y-auto">
      {/* Cover Photo and Profile Picture Section */}
      <div className="bg-white">
        <div className="w-full h-80 bg-gray-400 container mx-auto rounded-b-lg relative overflow-hidden">
          {userProfile.coverImageUrl && (
            <img
              src={userProfile.coverImageUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          {isMyProfile && (
            <>
              <label
                htmlFor="cover-photo-upload"
                className="absolute bottom-4 right-4 bg-white p-2 rounded-lg font-semibold shadow-md hover:bg-gray-50 cursor-pointer flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faCameraRetro} />
                {isUploadingCover ? 'Uploading...' : 'Edit cover photo'}
              </label>
              <input
                id="cover-photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'coverImage')}
                disabled={isUploadingCover}
              />
            </>
          )}
        </div>
      </div>
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto flex items-start pb-4 h-32">
          <div className="w-48 h-48 rounded-full -top-24 left-12 bg-gray-300 relative border-4 border-white overflow-hidden flex items-center justify-center">
            {userProfile.profileImageUrl ? (
              <img
                src={userProfile.profileImageUrl || DUMMY_PROFILE_IMAGE_URL}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={DUMMY_PROFILE_IMAGE_URL}
                alt="Profile Placeholder"
                className="w-full h-full object-cover"
              />
            )}
            {isMyProfile && (
              <>
                <label
                  htmlFor="profile-image-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black text-white opacity-0 hover:opacity-50 transition-opacity cursor-pointer text-3xl"
                >
                  <FontAwesomeIcon icon={faCameraRetro} />
                </label>
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'profileImage')}
                  disabled={isUploadingProfile}
                />
              </>
            )}
          </div>
          <div className="ml-18 mt-5">
            <h1 className="text-3xl font-bold text-gray-900">{userProfile.name}</h1>
            {userProfile.bio ? (
              <p className="text-gray-600">{userProfile.bio}</p>
            ) : (
              <p className="text-gray-600">
                {friendsCount > 0 ? `${friendsCount} Friend${friendsCount !== 1 ? 's' : ''}` : "No Friends yet."}
              </p>
            )}
          </div>

          {/* --- Friend Action Buttons --- */}
          {!isMyProfile && (
            <div className="ml-auto flex gap-2 pb-4 mt-10">
              {friendshipStatus === 'FRIEND' ? (
                <button
                  onClick={() => unfriendMutation.mutate(userId!)}
                  disabled={unfriendMutation.isPending}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {unfriendMutation.isPending ? 'Unfriending...' : 'Unfriend'}
                </button>
              ) : friendshipStatus === 'PENDING_SENT' ? (
                <button
                  onClick={() => cancelFriendRequestMutation.mutate(outgoingRequestId!)}
                  disabled={cancelFriendRequestMutation.isPending || !outgoingRequestId}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  {cancelFriendRequestMutation.isPending ? 'Cancelling...' : 'Cancel Request'}
                </button>
              ) : friendshipStatus === 'PENDING_RECEIVED' ? (
                <>
                  <button
                    onClick={() => acceptFriendRequestMutation.mutate(incomingRequestId!)}
                    disabled={acceptFriendRequestMutation.isPending || !incomingRequestId}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {acceptFriendRequestMutation.isPending ? 'Accepting...' : 'Accept Request'}
                  </button>
                  <button
                    onClick={() => rejectFriendRequestMutation.mutate(incomingRequestId!)}
                    disabled={rejectFriendRequestMutation.isPending || !incomingRequestId}
                    className="ml-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    {rejectFriendRequestMutation.isPending ? 'Rejecting...' : 'Reject Request'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => sendFriendRequestMutation.mutate(userId!)}
                  disabled={sendFriendRequestMutation.isPending}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {sendFriendRequestMutation.isPending ? 'Sending...' : 'Add Friend'}
                </button>
              )}
            </div>
          )}
          {/* --- End Friend Action Buttons --- */}
        </div>
      </div>
      <div className="bg-white border-b border-gray-200 pl-20">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex gap-4">
            <NavLink
              to="."
              end
              className={({ isActive }) =>
                "text-lg font-semibold py-3 px-4 border-b-2 transition-colors duration-200 " +
                (isActive
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-gray-500 hover:text-gray-800")
              }
            >
              Posts
            </NavLink>
            <NavLink
              to="about" 
              className={({ isActive }) =>
                "text-lg font-semibold py-3 px-4 border-b-2 transition-colors duration-200 " +
                (isActive
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-gray-500 hover:text-gray-800")
              }
            >
              About
            </NavLink>
          </div>
        </div>
      </div>
      {/* Outlet for nested content */}
      <div className="container mx-auto py-4">
        <Outlet context={{ user: userProfile, isMyProfile: isMyProfile }} />
      </div>
    </div>
  );
}

export default Profile;
