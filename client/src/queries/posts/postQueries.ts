// friendbook/client/src/queries/posts/postQueries.ts
import { useQuery, useMutation, useQueryClient, UseMutationOptions, QueryKey } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import { useCurrentUser, User } from '../users/useCurrentUser';

export type PostType = 'text' | 'photo' | 'video' | 'feeling' | 'activity';

export interface UserMinimal {
  id: string;
  name: string;
  profileImageUrl?: string | null; // Changed to allow null
}

export interface Post {
  id: string;
  userId: string;
  user: UserMinimal;
  type: PostType;
  text?: string;
  photoUrl?: string;
  videoUrl?: string;
  taggedUserIds?: string[]; // ADDED: New field for tagged users
  taggedUsers?: UserMinimal[];
  likes: UserMinimal[];
  totalLikes: number;
  sharedPostId?: string;
  createdAt: string;
}

interface PostContext {
  previousPosts: [QueryKey, Post[] | undefined][] | undefined;
}

export interface CreatePostData {
  type: PostType;
  text?: string;
  photoUrl?: string;
  videoUrl?: string;
  taggedFriends?: string[]; // ADDED: New field for tagged friends
}

const fetchPostsApi = async (): Promise<Post[]> => {
  const { data } = await axiosInstance.get('/posts');
  return data;
};

const fetchPostApi = async (postId: string): Promise<Post> => {
  const { data } = await axiosInstance.get(`/posts/${postId}`);
  return data;
};

const createPostApi = async (data: CreatePostData | FormData): Promise<Post> => {
  const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
  const { data: responseData } = await axiosInstance.post('/posts', data, { headers });
  return responseData;
};

const deletePostApi = async (postId: string): Promise<void> => {
  await axiosInstance.delete(`/posts/${postId}`);
};

const likePostApi = async (postId: string): Promise<Post> => {
  const { data } = await axiosInstance.post(`/posts/${postId}/like`);
  return data;
};

export const usePosts = () => {
  return useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: fetchPostsApi,
  });
};

export const usePost = (postId: string) => {
  return useQuery<Post>({
    queryKey: ['post', postId],
    queryFn: () => fetchPostApi(postId),
    enabled: !!postId,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  return useMutation<Post, Error, CreatePostData | FormData>({
    mutationFn: createPostApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: ['userPosts', currentUser.id] });
      }
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  return useMutation<void, Error, string>({
    mutationFn: deletePostApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: ['userPosts', currentUser.id] });
      }
    },
    onError: (error) => {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    },
  });
};

export const useLikePost = (
  options?: UseMutationOptions<Post, Error, string, PostContext>
) => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  return useMutation<Post, Error, string, PostContext>({
    mutationFn: likePostApi,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: ['userPosts'] });

      const previousPosts = queryClient.getQueriesData<Post[]>({
        queryKey: ['posts'],
      });

      queryClient.setQueriesData<Post[]>({ queryKey: ['posts'] }, (oldData) => {
        if (!oldData || !currentUser) return oldData;
        return oldData.map((post) => {
          if (post.id === postId) {
            const isLiking = !post.likes.some(like => like.id === currentUser.id);
            const updatedLikes = isLiking
              ? [...post.likes, {
                  id: currentUser.id,
                  name: currentUser.name,
                  profileImageUrl: currentUser.profileImageUrl ?? undefined, // Normalize null to undefined
                }]
              : post.likes.filter(like => like.id !== currentUser.id);
            return { ...post, likes: updatedLikes, totalLikes: updatedLikes.length };
          }
          return post;
        });
      });

      queryClient.setQueriesData<Post[]>({ queryKey: ['userPosts'] }, (oldData) => {
        if (!oldData || !currentUser) return oldData;
        return oldData.map((post) => {
          if (post.id === postId) {
            const isLiking = !post.likes.some(like => like.id === currentUser.id);
            const updatedLikes = isLiking
              ? [...post.likes, {
                  id: currentUser.id,
                  name: currentUser.name,
                  profileImageUrl: currentUser.profileImageUrl ?? undefined, // Normalize null to undefined
                }]
              : post.likes.filter(like => like.id !== currentUser.id);
            return { ...post, likes: updatedLikes, totalLikes: updatedLikes.length };
          }
          return post;
        });
      });

      return { previousPosts };
    },
    onSuccess: (updatedPost, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts', updatedPost.user.id] });
      options?.onSuccess?.(updatedPost, variables, context);
    },
    onError: (err, postId, context) => {
      console.error('Error liking post:', err);
      alert('Failed to like post. Please try again.');
      if (context?.previousPosts) {
        context.previousPosts.forEach(([key, value]) => {
          queryClient.setQueryData(key, value);
        });
      }
      options?.onError?.(err, postId, context);
    },
    ...options,
  });
};
