import React from 'react';
import CreatePostForm from '../../components/posts/CreatePostForm';
import PostCard from '../../components/posts/PostCard';
import { usePosts, useDeletePost } from '../../queries/posts/postQueries';
import { useCurrentUser } from '../../queries/users/useCurrentUser';

function HomePageMain() {
  const { data: posts, isLoading, isError, error } = usePosts();
  const { data: currentUser } = useCurrentUser();
  
  const deletePostMutation = useDeletePost();

  // FIX: This handler function is now simplified to only accept postId
  const handleDeletePost = (postId: string) => {
    // We can assume the check is done in PostCard
    if (window.confirm('Are you sure you want to delete this post?')) {
      // FIX: Pass only the postId to the mutate function
      deletePostMutation.mutate(postId);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        Loading posts...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-full flex justify-center items-center text-red-600">
        Error loading posts: {error?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <>
      <CreatePostForm />
      {posts && posts.length > 0 ? (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            // FIX: Pass the handleDeletePost function with the postId
            onDeletePost={() => handleDeletePost(post.id)}
          />
        ))
      ) : (
        <p className="text-gray-600 mt-5">No posts to display. Be the first to post!</p>
      )}
    </>
  );
}

export default HomePageMain;
