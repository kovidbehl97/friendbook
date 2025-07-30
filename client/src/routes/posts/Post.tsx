// src/routes/posts/Post.tsx

import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import PostCard from '../../components/posts/PostCard';
// Use the updated Post type
import type { Post as PostType } from '../../queries/posts/postQueries';
import { useDeletePost } from '../../queries/posts/postQueries';
import { useCurrentUser } from '../../queries/users/useCurrentUser';

// --- API Function ---
const fetchPostById = async (postId: string): Promise<PostType> => {
  const { data } = await axiosInstance.get(`/posts/${postId}`);
  return data;
};

// This component is already using the modern function syntax, so no change here
function Post() {
  const { postId } = useParams<{ postId: string }>();
  const { data: currentUser } = useCurrentUser();
  const deletePostMutation = useDeletePost();

  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => {
      if (!postId) {
        throw new Error('Post ID is missing from the URL.');
      }
      return fetchPostById(postId);
    },
    enabled: !!postId,
  });

  // This function now correctly accepts a postId string
  const handleDeletePost = (postId: string) => {
    // You should use a custom modal instead of alert() or window.confirm()
    // in a real-world application. This is just for demonstration.
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePostMutation.mutate(postId);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full text-center py-10 text-gray-500">
        Loading post...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full text-center py-10 text-red-500">
        Error loading post: {error?.message || 'Unknown error'}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full text-center py-10 text-gray-500">
        Post not found.
      </div>
    );
  }

  // The Post type now has a 'user' property, so this works
  const isAuthor = currentUser?.id === post.user.id;

  return (
    <div className="w-full flex justify-center">
      <div className="max-w-2xl w-full">
        {/* Pass the correct function signature to PostCard, but only if the user is the author */}
        <PostCard
          post={post}
          onDeletePost={handleDeletePost}
        />
      </div>
    </div>
  );
}

export default Post;
