// friendbook/server/src/types.ts

// Basic User type, as returned in simple user objects (e.g., in post.user, liked by)
export interface UserMinimal {
  id: string;
  name: string;
  // FIXED: Changed type to allow string, null, or undefined to match Prisma's return type
  profileImageUrl?: string | null; 
}

// Full User type, as returned when fetching a single user or currentUser
export type User = {
  id: string;
  name: string;
  email: string;
  password?: string; // Password should typically not be sent to frontend, but useful for register/login types
  bio: string | null;
  createdAt: string; // ISO string
};

export type UserSearchResult = {
  id: string;
  name: string;
  // Add other fields you want to return, e.g., profilePictureUrl
}

export type PostType = 'text' | 'photo' | 'video' | 'feeling' | 'activity';

// Post type, reflecting the full structure returned by getPosts
export interface Post {
  id: string;
  userId: string;
  user: UserMinimal;
  type: PostType;
  text?: string;
  photoUrl?: string;
  videoUrl?: string;
  taggedUserIds: string[];
  taggedUsers?: UserMinimal[]; 
  likes: UserMinimal[];
  totalLikes: number;
  sharedPostId?: string;
  createdAt: string;
}

// Comment type, reflecting what's returned with comments
export type Comment = {
  id: string;
  postId: string;
  userId: string;
  user?: UserMinimal; // Added: Often useful to include the comment user for display
  content: string;
  likes: string[]; // Still string IDs for likes on comments, unless you resolve them
  createdAt: string; // ISO string
};

// FriendRequest type, reflecting how it's sent and retrieved
export type FriendRequest = {
  id: string;
  senderId: string; // Changed: Matches Prisma schema `senderId`
  receiverId: string; // Changed: Matches Prisma schema `receiverId`
  sender?: UserMinimal; // Added: Useful for `getPendingFriendRequests` received list
  receiver?: UserMinimal; // Added: Useful for `getPendingFriendRequests` sent list
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string; // ISO string
};

// Friendship type, for the actual friendship record
export type Friendship = {
  id: string;
  userAId: string;
  userBId: string;
  userA?: UserMinimal; // Added: For `getFriends` to resolve the other user
  userB?: UserMinimal; // Added: For `getFriends` to resolve the other user
  createdAt: string; // ISO string
}

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  sender?: UserMinimal; // Added: Useful to know who sent it
  receiver?: UserMinimal; // Added: Useful to know who received it
  content: string;
  postId?: string | null; // Changed: can be null
  post?: Post; // Added: if you include the post object when fetching messages
  createdAt: string; // ISO string
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string; // Changed: Consistent with `AuthContext` and `sessionStorage`
  user: { id: string; email: string; name: string };
};

export interface ConversationResult {
  userId: string; // ID of the other user in the conversation
  userName: string; // Name of the other user in the conversation
  lastMessageAt: string; // Changed: Better to be string (ISO format) for consistency with createdAt
  lastMessageContent: string;
  // You might add a lastMessageId or unreadCount here
}

// Notification types from your schema
export enum NotificationType {
  friendRequest = "friendRequest",
  friendRequestAccepted = "friendRequestAccepted",
  friendRequestRejected = "friendRequestRejected",
  postLiked = "postLiked",
  commentLiked = "commentLiked",
  postCommented = "postCommented",
  userTagged = "userTagged",
  newMessage = "newMessage",
}

export type Notification = {
  id: string;
  userId: string;
  user?: UserMinimal; // Added: If you include the user the notification is for
  type: NotificationType;
  relatedId: string; // ID of the related entity (post, comment, friend request etc.)
  message: string;
  isRead: boolean;
  createdAt: string; // ISO string
};
