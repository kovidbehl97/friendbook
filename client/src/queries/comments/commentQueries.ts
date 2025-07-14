// friendbook/client/src/queries/comments/commentQueries.ts
import { useQuery, useMutation, useQueryClient, UseMutationOptions, QueryKey } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import { useCurrentUser } from '../users/useCurrentUser';
import { UserMinimal } from '../posts/postQueries'; // Import from postQueries to ensure consistency

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: UserMinimal;
  content: string;
  likes: UserMinimal[];
  totalLikes: number;
  createdAt: string;
}

export interface CreateCommentData {
  postId: string;
  content: string;
}

export interface GetCommentsResponse {
  comments: Comment[];
  currentPage: number;
  totalPages: number;
  totalComments: number;
}

interface LikeCommentContext {
  previousComments: [QueryKey, GetCommentsResponse | undefined][] | undefined;
}

const fetchCommentsForPostApi = async (
  postId: string,
  page: number = 1,
  limit: number = 10
): Promise<GetCommentsResponse> => {
  const { data } = await axiosInstance.get(`/comments?postId=${postId}&page=${page}&limit=${limit}`);
  return data;
};

const createCommentApi = async (commentData: CreateCommentData): Promise<Comment> => {
  const { data } = await axiosInstance.post('/comments', commentData);
  return data;
};

const likeCommentApi = async (commentId: string): Promise<Comment> => {
  const { data } = await axiosInstance.post(`/comments/${commentId}/like`);
  return data;
};

export const useCommentsForPost = (postId: string, page: number, limit: number) => {
  return useQuery<GetCommentsResponse>({
    queryKey: ['comments', postId, page, limit],
    queryFn: () => fetchCommentsForPostApi(postId, page, limit),
    enabled: !!postId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation<Comment, Error, CreateCommentData>({
    mutationFn: createCommentApi,
    onSuccess: (newComment) => {
      console.log('useCreateComment onSuccess triggered. New comment:', newComment);
      queryClient.invalidateQueries({ queryKey: ['comments', newComment.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('Error creating comment:', error);
      alert('Failed to post comment. Please try again.');
    },
  });
};

export const useLikeComment = (
  options?: UseMutationOptions<Comment, Error, string, LikeCommentContext>
) => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  return useMutation<Comment, Error, string, LikeCommentContext>({
    mutationFn: likeCommentApi,
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ['comments'] });

      const previousComments = queryClient.getQueriesData<GetCommentsResponse>({
        queryKey: ['comments'],
      });

      queryClient.setQueriesData<GetCommentsResponse>(
        { queryKey: ['comments'] },
        (oldData) => {
          if (!oldData || !currentUser) return oldData;
          
          const isLiking = !oldData.comments.find(c => c.id === commentId)?.likes.some(like => like.id === currentUser.id);

          const updatedComments = oldData.comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                totalLikes: isLiking ? comment.totalLikes + 1 : comment.totalLikes - 1,
                likes: isLiking 
                  ? [...comment.likes, { 
                      id: currentUser.id, 
                      name: currentUser.name, 
                      profileImageUrl: currentUser.profileImageUrl ?? undefined, // Normalize null to undefined
                    }] 
                  : comment.likes.filter(like => like.id !== currentUser.id),
              };
            }
            return comment;
          });

          return {
            ...oldData,
            comments: updatedComments,
          };
        }
      );

      return { previousComments };
    },
    onSuccess: (updatedComment, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['comments', updatedComment.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      options?.onSuccess?.(updatedComment, variables, context);
    },
    onError: (err, commentId, context) => {
      console.error('Error liking comment:', err);
      alert('Failed to like comment. Please try again.');
      if (context?.previousComments) {
        context.previousComments.forEach(([key, value]) => {
          queryClient.setQueryData(key, value);
        });
      }
      options?.onError?.(err, commentId, context);
    },
    ...options,
  });
};