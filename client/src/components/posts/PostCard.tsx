import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useLikePost, useDeletePost } from "../../queries/posts/postQueries";
import { useCurrentUser } from "../../queries/users/useCurrentUser";
import {
  useCommentsForPost,
  useCreateComment,
  useLikeComment,
} from "../../queries/comments/commentQueries";
import { Post } from "../../queries/posts/postQueries";
import { Comment } from "../../queries/comments/commentQueries";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashCan,
  faThumbsUp,
} from "@fortawesome/free-solid-svg-icons";
import { faComment } from "@fortawesome/free-regular-svg-icons";
import { faThumbsUp as faThumbsUpReg } from "@fortawesome/free-regular-svg-icons";


const DUMMY_PROFILE_IMAGE_URL =
  "https://res.cloudinary.com/dwpldlqbv/image/upload/v1754898012/rzpqnq0omenxrynvclxf.jpg";

interface PostCardProps {
  post: Post;
  onDeletePost: (postId: string) => void;
}

function PostCard({ post, onDeletePost }: PostCardProps) {
  const {
    user,
    type,
    text,
    photoUrl,
    videoUrl,
    likes,
    totalLikes,
    createdAt,
    taggedUsers,
  } = post;
  const { data: currentUser } = useCurrentUser();

  const deletePostMutation = useDeletePost();
  const likePostMutation = useLikePost();

  const [showComments, setShowComments] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [commentPage, setCommentPage] = useState(1);
  const commentsLimit = 10;

  const [pendingLikeId, setPendingLikeId] = useState<string | null>(null);
  // NEW: State for showing the tagged users tooltip
  const [showTaggedUsersTooltip, setShowTaggedUsersTooltip] = useState(false);

  const {
    data: commentsData,
    isLoading: commentsLoading,
    isError: commentsError,
  } = useCommentsForPost(post.id, commentPage, commentsLimit);

  const comments: Comment[] = commentsData?.comments || [];
  const totalCommentsCount = commentsData?.totalComments || 0;
  const totalCommentPages = commentsData?.totalPages || 1;

  const createCommentMutation = useCreateComment();
  const likeCommentMutation = useLikeComment({
    onSuccess: () => setPendingLikeId(null),
    onError: () => setPendingLikeId(null),
  });

  const isMyPost = currentUser && user.id === currentUser.id;
  const hasLikedPost = currentUser
    ? likes.some((like) => like.id === currentUser.id)
    : false;

  const handleLikePost = () => {
    if (!currentUser) {
      // NOTE: Using a custom modal or toast instead of alert for better UX
      // For this example, we'll keep the alert for simplicity
      alert("Please log in to like posts.");
      return;
    }
    likePostMutation.mutate(post.id);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please log in to comment.");
      return;
    }
    if (newCommentContent.trim() === "") return;

    try {
      await createCommentMutation.mutateAsync({
        postId: post.id,
        content: newCommentContent.trim(),
      });
      setNewCommentContent("");
      if (commentPage !== 1) {
        setCommentPage(1);
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    }
  };

  const handleLikeComment = (commentId: string) => {
    if (!currentUser) {
      alert("Please log in to like comments.");
      return;
    }
    setPendingLikeId(commentId);
    likeCommentMutation.mutate(commentId);
  };

  const handleLoadMoreComments = () => {
    if (commentPage < totalCommentPages) {
      setCommentPage((prevPage) => prevPage + 1);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
    const timePart = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} at ${timePart}`;
  };

  const postDate = formatDate(createdAt);
  
  // Logic to handle tagged users display and tooltip
  const displayTaggedUsers = () => {
    if (!taggedUsers || taggedUsers.length === 0) {
      return null;
    }

    const firstTaggedUser = taggedUsers[0];
    const otherTaggedUsers = taggedUsers.slice(1);
    const othersCount = otherTaggedUsers.length;

    if (taggedUsers.length === 1) {
      return (
        <span className="text-gray-600 font-normal">
          {" "}with <NavLink to={`/profile/${firstTaggedUser.id}`} className="hover:underline font-bold">{firstTaggedUser.name}</NavLink>
        </span>
      );
    }

    return (
      <span className="text-gray-600 font-normal">
        {" "}with <NavLink to={`/profile/${firstTaggedUser.id}`} className="hover:underline font-bold">{firstTaggedUser.name}</NavLink>
        <span className=""> and</span>
        {othersCount > 0 && (
          <span 
            className="relative ml-1 font-bold cursor-pointer hover:underline"
            onMouseEnter={() => setShowTaggedUsersTooltip(true)}
            onMouseLeave={() => setShowTaggedUsersTooltip(false)}
          >
          {othersCount} other{othersCount > 1 ? 's' : ''}
            {showTaggedUsersTooltip && (
              <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 p-2 w-max bg-gray-800 text-white text-sm rounded-lg shadow-lg mb-2">
                <ul className="list-none m-0 p-0">
                  {otherTaggedUsers.map(u => (
                    <li key={u.id}>
                      <NavLink to={`/profile/${u.id}`} className="block px-2 py-1 hover:bg-gray-700 rounded-md">
                        {u.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
                <div className="absolute left-1/2 -bottom-1 transform -translate-x-1/2 w-3 h-3 bg-gray-800 rotate-45"></div>
              </div>
            )}
          </span>
        )}
      </span>
    );
  };


  return (
    <div className="rounded-2xl bg-white h-max p-4 shadow w-[650px]">
      <div className="flex gap-3 items-center border-b border-gray-200 mb-4 pb-4">
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
          <NavLink to={`/profile/${user.id}`}>
            <img
              src={user.profileImageUrl || DUMMY_PROFILE_IMAGE_URL}
              alt={`${user.name}'s profile`}
              className="w-full h-full object-cover"
            />
          </NavLink>
        </div>
        <div className=" ">
          <NavLink
            to={`/profile/${user.id}`}
            className="hover:underline text-lg font-bold"
          >
            {user.name}
          </NavLink>
          {displayTaggedUsers()}
          <div className="text-xs text-gray-500 font-light">{postDate}</div>
        </div>
        <div className="text-sm text-gray-500 ml-auto flex items-center gap-2">
          {isMyPost && (
            <button
              onClick={() => onDeletePost(post.id)}
              disabled={deletePostMutation.isPending}
              className="text-red-500 hover:text-red-700 disabled:opacity-50 mr-2 cursor-pointer"
              title="Delete post"
            >
              <FontAwesomeIcon icon={faTrashCan} className="text-xl" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {type === "feeling" && (
          <p className="text-xl font-semibold">Feeling: {text}</p>
        )}
        {type === "activity" && (
          <p className="text-xl font-semibold">Activity: {text}</p>
        )}
        {type === "text" && text && <p className="text-gray-800">{text}</p>}
        {type === "photo" && photoUrl && (
          <>
            <img
              src={photoUrl}
              alt="Post"
              className="w-full h-auto rounded-lg"
            />
            {text && <p className="text-gray-700 text-sm mt-1">{text}</p>}
          </>
        )}
        {type === "video" && videoUrl && (
          <>
            <video
              controls
              src={videoUrl}
              className="w-full h-auto rounded-lg"
            ></video>
            {text && <p className="text-gray-700 text-sm mt-1">{text}</p>}
          </>
        )}
      </div>

      <div className="text-sm text-gray-600 mb-4 flex justify-between items-center">
        <span>
          {totalLikes} {totalLikes === 1 ? "Like" : "Likes"}
        </span>
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-blue-500 hover:underline cursor-pointer"
        >
          {totalCommentsCount}{" "}
          {totalCommentsCount === 1 ? "Comment" : "Comments"}
        </button>
      </div>

      <div className="flex flex-nowrap justify-between gap-4">
        <button
          onClick={handleLikePost}
          disabled={likePostMutation.isPending}
          className={`w-full h-10 rounded-full flex gap-2 justify-center items-center cursor-pointer ${
            hasLikedPost ? "bg-blue-600" : "bg-blue-500"
          } text-white hover:bg-blue-600 transition duration-200 disabled:opacity-50`}
        >
          {hasLikedPost ? (
            <FontAwesomeIcon icon={faThumbsUp} className="" />
          ) : (
            <FontAwesomeIcon icon={faThumbsUpReg} className="" />
          )}
          {likePostMutation.isPending
            ? "Liking..."
            : hasLikedPost
            ? "Liked"
            : "Like"}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="w-full h-10 rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer transition duration-200"
        >
          <FontAwesomeIcon icon={faComment} className="mr-2" />
          Comment
        </button>
      </div>

      {showComments && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold mb-3">Comments</h3>

          <form
            onSubmit={handleCommentSubmit}
            className="flex items-center mb-4"
          >
            <input
              type="text"
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
              placeholder="Write a comment..."
              className="flex-grow p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 mr-2"
              disabled={createCommentMutation.isPending}
            />
            <button
              type="submit"
              disabled={
                createCommentMutation.isPending ||
                newCommentContent.trim() === ""
              }
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {createCommentMutation.isPending ? "Posting..." : "Post"}
            </button>
          </form>

          {commentsLoading && commentPage === 1 ? (
            <div className="text-center text-gray-500">Loading comments...</div>
          ) : commentsError ? (
            <div className="text-center text-red-500">
              Error loading comments.
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => {
                const hasLikedComment = currentUser
                  ? comment.likes.some((like) => like.id === currentUser.id)
                  : false;
                const isCommentLiking = pendingLikeId === comment.id;
                return (
                  <div
                    key={comment.id}
                    className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={
                          comment.user?.profileImageUrl ||
                          DUMMY_PROFILE_IMAGE_URL
                        }
                        alt={`${comment.user?.name}'s profile`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-800">
                        {comment.user?.name}
                      </p>
                      <p className="text-gray-700 text-sm">{comment.content}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          disabled={isCommentLiking}
                          className={`rounded-full h-6 w-6 pl-0.5 flex mr-3 items-center justify-center cursor-pointer ${
                            hasLikedComment
                              ? " text-blue-500 hover:bg-blue-100"
                              : "hover:bg-gray-200"
                          } transition-colors disabled:opacity-50`}
                        >
                          <FontAwesomeIcon
                            icon={hasLikedComment ? faThumbsUp : faThumbsUpReg}
                            className="text-sm"
                          />
                       
                        </button>
                        <span>
                          {comment.totalLikes}{" "}
                          {comment.totalLikes === 1 ? "Like" : "Likes"}
                        </span>
                        <span className="ml-3">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {commentPage < totalCommentPages && (
                <div className="text-center mt-4">
                  <button
                    onClick={handleLoadMoreComments}
                    disabled={commentsLoading}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    {commentsLoading ? "Loading more..." : "Load More Comments"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              No comments yet. Be the first!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PostCard;
