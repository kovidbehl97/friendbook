import { Request, Response } from 'express';
import { PrismaClient, NotificationType } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import cloudinary from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';
import { createNotification } from './notificationController';
import { Post, UserMinimal, PostType } from '../types';

const prisma = new PrismaClient();
const validPostTypes: readonly PostType[] = ['photo', 'video', 'feeling', 'activity'] as const;

export const getPosts = async (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  try {
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userAId: currentUserId }, { userBId: currentUserId }] },
      select: { userAId: true, userBId: true },
    });

    const friendIds = friendships.flatMap(friendship => {
      return friendship.userAId === currentUserId ? friendship.userBId : friendship.userAId;
    });

    const priorityUserIds = [...friendIds];
    const allPostsExcludingCurrentUser = await prisma.post.findMany({
      where: { userId: { not: currentUserId } },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, profileImageUrl: true } } },
    });

    const formattedPostsWithPriority: (Post & { isPriority: boolean })[] = await Promise.all(
      allPostsExcludingCurrentUser.map(async (post) => {
        const likedUsers: UserMinimal[] = await prisma.user.findMany({
          where: { id: { in: post.likes } },
          select: { id: true, name: true },
        });

        // NEW: Fetch the details for all tagged users
        const taggedUsers: UserMinimal[] = await prisma.user.findMany({
          where: { id: { in: post.taggedUserIds } },
          select: { id: true, name: true, profileImageUrl: true },
        });

        const isPriority = priorityUserIds.includes(post.userId);
        return {
          id: post.id,
          userId: post.userId,
          user: post.user as UserMinimal,
          type: post.type as PostType,
          text: post.text ?? undefined,
          photoUrl: post.photoUrl ?? undefined,
          videoUrl: post.videoUrl ?? undefined,
          taggedUserIds: post.taggedUserIds,
          taggedUsers, // NEW: Add the taggedUsers array to the response
          likes: likedUsers,
          totalLikes: post.likes.length,
          sharedPostId: post.sharedPostId ?? undefined,
          createdAt: post.createdAt.toISOString(),
          isPriority,
        };
      })
    );

    formattedPostsWithPriority.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const finalFormattedPosts: Post[] = formattedPostsWithPriority.map(({ isPriority, ...rest }) => rest);
    res.json(finalFormattedPosts);
  } catch (error) {
    console.error('Error fetching prioritized posts (excluding own):', error);
    res.status(500).json({ error: 'Failed to fetch posts.' });
  }
};

export const getPostById = async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: { select: { id: true, name: true, profileImageUrl: true } } },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const likedUsers: UserMinimal[] = await prisma.user.findMany({
      where: { id: { in: post.likes } },
      select: { id: true, name: true },
    });

    // NEW: Fetch the details for all tagged users
    const taggedUsers: UserMinimal[] = await prisma.user.findMany({
      where: { id: { in: post.taggedUserIds } },
      select: { id: true, name: true, profileImageUrl: true },
    });

    const formattedPost: Post = {
      id: post.id,
      userId: post.userId,
      user: post.user as UserMinimal,
      type: post.type as PostType,
      text: post.text ?? undefined,
      photoUrl: post.photoUrl ?? undefined,
      videoUrl: post.videoUrl ?? undefined,
      taggedUserIds: post.taggedUserIds,
      taggedUsers, // NEW: Add the taggedUsers array to the response
      likes: likedUsers,
      totalLikes: post.likes.length,
      sharedPostId: post.sharedPostId ?? undefined,
      createdAt: post.createdAt.toISOString(),
    };

    res.json(formattedPost);
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    res.status(500).json({ error: 'Failed to fetch post.' });
  }
};

export const getUserPosts = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, profileImageUrl: true } } },
    });

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        const likedUsers = await prisma.user.findMany({
          where: { id: { in: post.likes } },
          select: { id: true, name: true },
        });

        // NEW: Fetch the details for all tagged users
        const taggedUsers: UserMinimal[] = await prisma.user.findMany({
          where: { id: { in: post.taggedUserIds } },
          select: { id: true, name: true, profileImageUrl: true },
        });

        return {
          id: post.id,
          userId: post.userId,
          user: post.user,
          type: post.type,
          text: post.text ?? undefined,
          photoUrl: post.photoUrl ?? undefined,
          videoUrl: post.videoUrl ?? undefined,
          taggedUserIds: post.taggedUserIds,
          taggedUsers, // NEW: Add the taggedUsers array to the response
          likes: likedUsers,
          totalLikes: post.likes.length,
          sharedPostId: post.sharedPostId ?? undefined,
          createdAt: post.createdAt.toISOString(),
        };
      })
    );
    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching user-specific posts:', error);
    res.status(500).json({ error: 'Failed to fetch user posts.' });
  }
};


export const createPost = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const data = req.body as Partial<Post>;
  let photoUrl = '';
  let videoUrl = '';
  
  // Log the incoming request body for debugging
  console.log("Incoming request body:", req.body);

  if (!data.type || !validPostTypes.includes(data.type)) {
    return res.status(400).json({ error: 'Invalid or missing type. Must be a valid post type' });
  }

  if (data.type === 'text' && (!data.text || data.text.trim() === '')) {
    return res.status(400).json({ error: 'Text is required for text posts' });
  }
  
  if (data.type !== 'text' && data.text && data.text.trim() === '') {
     data.text = undefined;
  }
  
  // FIX: Updated logic to handle the 'taggedFriends[]' key from FormData
  let taggedUserIds: string[] = [];
  const taggedFriendsData = req.body['taggedFriends[]'] || req.body.taggedFriends;

  if (taggedFriendsData) {
    if (Array.isArray(taggedFriendsData)) {
      taggedUserIds = taggedFriendsData.filter((id: any) => typeof id === 'string' && id.trim() !== '');
    } else if (typeof taggedFriendsData === 'string') {
      taggedUserIds = taggedFriendsData.split(',').map(id => id.trim()).filter(id => id !== '');
    }
  }

  if (data.sharedPostId !== undefined && typeof data.sharedPostId !== 'string') {
    return res.status(400).json({ error: 'sharedPostId must be a string or undefined' });
  }

  try {
    if (req.files) {
      if (data.type === 'photo' && 'photo' in req.files) {
        const file = Array.isArray(req.files.photo) ? req.files.photo[0] : req.files.photo;
        
        if (!file.mimetype.startsWith('image/')) {
          return res.status(400).json({ error: 'Invalid file type for photo post' });
        }

        console.log('Uploading photo to Cloudinary:', { name: file.name, size: file.size, mimetype: file.mimetype });

        const result: UploadApiResponse = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: 'image',
            folder: 'social_media_posts',
            transformation: { width: 800, height: 800, crop: 'fill' }
        });
        
        console.log('Cloudinary photo upload result:', result);
        photoUrl = result.secure_url;
      } else if (data.type === 'video' && 'video' in req.files) {
        const file = Array.isArray(req.files.video) ? req.files.video[0] : req.files.video;
        
        if (!file.mimetype.startsWith('video/')) {
          return res.status(400).json({ error: 'Invalid file type for video post' });
        }

        console.log('Uploading video to Cloudinary:', { name: file.name, size: file.size, mimetype: file.mimetype });

        const result: UploadApiResponse = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: 'video',
            folder: 'social_media_posts',
            quality: 'auto',
            fetch_format: 'auto'
        });

        console.log('Cloudinary video upload result:', result);
        videoUrl = result.secure_url;
      }
    } else if (data.type === 'photo' || data.type === 'video') {
      return res.status(400).json({ error: 'A file is required for photo and video posts' });
    }

    const finalSharedPostId = data.sharedPostId === '' || data.sharedPostId === undefined ? null : data.sharedPostId;

    const post = await prisma.post.create({
      data: {
        userId,
        type: data.type,
        text: data.text || null,
        photoUrl: photoUrl || null,
        videoUrl: videoUrl || null,
        taggedUserIds: taggedUserIds,
        sharedPostId: finalSharedPostId,
      },
      include: { user: { select: { id: true, name: true, profileImageUrl: true } } },
    });

    console.log('Created post:', post);
    
    // NEW: Fetch the details for all tagged users after creation
    const taggedUsers: UserMinimal[] = await prisma.user.findMany({
      where: { id: { in: post.taggedUserIds } },
      select: { id: true, name: true, profileImageUrl: true },
    });

    const formattedPost: Post = {
      id: post.id,
      userId: post.userId,
      user: {
        id: post.user.id,
        name: post.user.name,
        profileImageUrl: post.user.profileImageUrl ?? undefined,
      },
      type: post.type as PostType,
      text: post.text ?? undefined,
      photoUrl: post.photoUrl ?? undefined,
      videoUrl: post.videoUrl ?? undefined,
      taggedUserIds: post.taggedUserIds,
      taggedUsers, // NEW: Add the taggedUsers array to the response
      likes: [],
      totalLikes: 0,
      sharedPostId: post.sharedPostId ?? undefined,
      createdAt: post.createdAt.toISOString(),
    };

    res.status(201).json(formattedPost);
  } catch (error: any) {
    console.error('Error creating post:', error);
    if (error.code && error.code.startsWith('P')) {
      console.error('Prisma Error Code:', error.code);
      return res.status(400).json({ error: `Database error: ${error.message}` });
    }
    res.status(500).json({ error: 'Failed to create post. Please check server logs for details.' });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  const userId = req.user!.id;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this post' });
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.comment.deleteMany({
        where: { postId: postId },
      });

      await tx.post.delete({
        where: { id: postId },
      });
    });

    res.status(200).json({ message: 'Post and associated comments deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

export const likePost = async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  const userId = req.user!.id;
  console.log('Liking post with postId:', postId);

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true, likes: true },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isLiked = post.likes.includes(userId);
    const updatedLikes = isLiked
      ? post.likes.filter(id => id !== userId)
      : [...post.likes, userId];

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { likes: updatedLikes },
      include: { user: { select: { id: true, name: true, profileImageUrl: true } } }
    });

    if (!isLiked && post.userId !== userId) {
      const senderUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      if (senderUser) {
        await createNotification(
          post.userId,
          userId,
          NotificationType.postLiked,
          postId,
          `${senderUser.name} liked your post.`
        );
      }
    }

    const likedUsers: UserMinimal[] = await prisma.user.findMany({
      where: { id: { in: updatedPost.likes } },
      select: { id: true, name: true },
    });
    
    // NEW: Fetch the details for all tagged users after update
    const taggedUsers: UserMinimal[] = await prisma.user.findMany({
      where: { id: { in: updatedPost.taggedUserIds } },
      select: { id: true, name: true, profileImageUrl: true },
    });

    const formattedPost: Post = {
      id: updatedPost.id,
      userId: updatedPost.userId,
      user: updatedPost.user as UserMinimal,
      type: updatedPost.type as PostType,
      text: updatedPost.text ?? undefined,
      photoUrl: updatedPost.photoUrl ?? undefined,
      videoUrl: updatedPost.videoUrl ?? undefined,
      taggedUserIds: updatedPost.taggedUserIds,
      taggedUsers, // NEW: Add the taggedUsers array to the response
      likes: likedUsers,
      totalLikes: updatedPost.likes.length,
      sharedPostId: updatedPost.sharedPostId ?? undefined,
      createdAt: updatedPost.createdAt.toISOString(),
    };

    res.json(formattedPost);
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    res.status(500).json({ error: 'Failed to like/unlike post.' });
  }
};
