import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../api/axiosInstance';
import PostCard from '../../posts/PostCard';
import { useCurrentUser } from '../../../queries/users/useCurrentUser';
import { useDeletePost, Post } from '../../../queries/posts/postQueries';

// Custom hook to fetch posts for a specific user
const usePostsByUser = (userId: string | undefined) => {
  return useQuery<Post[]>({
    queryKey: ['userPosts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await axiosInstance.get(`/posts/user/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
};

function ProfilePosts() {
  const { userId } = useParams<{ userId: string }>();
  const { data: posts, isLoading, isError, error } = usePostsByUser(userId);
  const { data: currentUser } = useCurrentUser();

  const deletePostMutation = useDeletePost();

  const handleDeletePost = (postId: string) => {
    if (currentUser?.id === userId && window.confirm('Are you sure you want to delete this post?')) {
      // FIX: Pass only the postId string to the mutate function
      deletePostMutation.mutate(postId);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading posts...</div>;
  }

  if (isError) {
    console.error('Error fetching user posts:', error);
    return (
      <div className="text-center py-8 text-red-500">
        Error loading posts. Please try again.
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
        <p className="text-gray-500 text-lg">No posts to display.</p>
        <p className="text-gray-400 text-sm mt-1">
          This user has not made any posts yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col items-center">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDeletePost={handleDeletePost} />
      ))}
    </div>
  );
}

export default ProfilePosts;