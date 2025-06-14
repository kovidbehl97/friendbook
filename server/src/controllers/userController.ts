// friendbook/server/src/controllers/userController.ts

import { Request, Response } from 'express';
import { PrismaClient, MaritalStatus, Gender, RequestStatus } from '@prisma/client'; // Import RequestStatus
import { AuthRequest } from '../middleware/authMiddleware';
import cloudinary from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';
import { UploadedFile } from 'express-fileupload';

const prisma = new PrismaClient();

// Helper function to upload file to Cloudinary (remains the same)
const uploadToCloudinary = async (file: UploadedFile): Promise<string | null> => {
  try {
    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        file.tempFilePath,
        { resource_type: 'image', folder: 'friendbook_profiles' },
        (error, uploadResult) => {
          if (error) reject(error);
          else if (uploadResult) resolve(uploadResult);
          else reject(new Error('Cloudinary upload failed for unknown reason.'));
        }
      );
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params; // The ID of the profile being viewed
  const currentUserId = req.user?.id; // The ID of the authenticated user viewing this profile

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required and must be a string' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        createdAt: true,
        profileImageUrl: true,
        coverImageUrl: true,
        currentWorkplace: true,
        hometown: true,
        studiedAt: true,
        maritalStatus: true,
        contactPhoneNumber: true,
        contactEmail: true,
        website: true,
        socialLinks: true,
        currentCity: true,
        pastCities: true,
        gender: true,
        pronouns: true,
        dateOfBirth: true,
        languages: true,
        workExperiences: {
          orderBy: { startDate: 'desc' }
        },
        educationExperiences: {
          orderBy: { startDate: 'desc' }
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let friendshipStatus: 'FRIEND' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'NONE' = 'NONE';
    let pendingIncomingRequestId: string | null = null;
    let pendingOutgoingRequestId: string | null = null;

    // Only determine friendship status if a user is authenticated and viewing another user's profile
    if (currentUserId && currentUserId !== userId) {
      // 1. Check if they are already friends
      const existingFriendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userAId: currentUserId, userBId: userId },
            { userAId: userId, userBId: currentUserId },
          ],
        },
      });

      if (existingFriendship) {
        friendshipStatus = 'FRIEND';
      } else {
        // 2. Check for pending requests (current user sent to target user)
        const sentRequest = await prisma.friendRequest.findFirst({
          where: {
            senderId: currentUserId,
            receiverId: userId,
            status: RequestStatus.pending, // Use Prisma enum for status
          },
        });

        if (sentRequest) {
          friendshipStatus = 'PENDING_SENT';
          pendingOutgoingRequestId = sentRequest.id;
        } else {
          // 3. Check for pending requests (target user sent to current user)
          const receivedRequest = await prisma.friendRequest.findFirst({
            where: {
              senderId: userId,
              receiverId: currentUserId,
              status: RequestStatus.pending, // Use Prisma enum for status
            },
          });

          if (receivedRequest) {
            friendshipStatus = 'PENDING_RECEIVED';
            pendingIncomingRequestId = receivedRequest.id;
          }
        }
      }
    } else if (currentUserId && currentUserId === userId) {
      // If the current user is viewing their own profile
      friendshipStatus = 'NONE'; // Or a distinct 'SELF' status if needed
    }

    // Log for debugging
    console.log(`Backend: Profile for ${user.name} (ID: ${userId}) viewed by ${currentUserId || 'Guest'}`);
    console.log(`Backend: Calculated friendshipStatus: ${friendshipStatus}`);
    if (pendingIncomingRequestId) console.log(`  Incoming Request ID: ${pendingIncomingRequestId}`);
    if (pendingOutgoingRequestId) console.log(`  Outgoing Request ID: ${pendingOutgoingRequestId}`);


    // Construct the response object, combining user data with calculated status
    const responseProfile = {
      ...user, // Spread all properties fetched from Prisma
      friendshipStatus: friendshipStatus,
      pendingIncomingRequestId: pendingIncomingRequestId,
      pendingOutgoingRequestId: pendingOutgoingRequestId,
    };

    res.json(responseProfile);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const searchTerm = req.query.q as string;

  if (!searchTerm || searchTerm.length < 2) {
    // Return an empty array for short search terms to avoid
    // querying the entire database unnecessarily
    return res.json([]);
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          // Exclude the current user from the search results
          { id: { not: currentUserId } },
          // Search by name (case-insensitive)
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive', // Case-insensitive search
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
      },
      take: 10, // Limit the number of results for performance
    });

    res.json(users);
  } catch (error) {
    console.error('Error searching for users:', error);
    res.status(500).json({ error: 'Failed to search for users.' });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id; // Ensure user is authenticated
  const {
    name,
    bio,
    currentWorkplace,
    hometown,
    studiedAt,
    maritalStatus, // This will be a string from frontend, needs casting
    contactPhoneNumber,
    contactEmail,
    website,
    socialLinks, // This will be an array of strings from frontend
    currentCity,
    pastCities, // This will be an array of strings from frontend
    gender, // This will be a string from frontend, needs casting
    pronouns,
    dateOfBirth, // This will be a string from frontend, needs Date conversion
    languages, // This will be an array of strings from frontend
  } = req.body;

  let profileImageUrl: string | undefined;
  let coverImageUrl: string | undefined;

  try {
    // Handle profile image upload if present
    if (req.files && req.files.profileImage) {
      const file = req.files.profileImage as UploadedFile;
      const url = await uploadToCloudinary(file);
      if (url) profileImageUrl = url;
    }

    // Handle cover image upload if present
    if (req.files && req.files.coverImage) {
      const file = req.files.coverImage as UploadedFile;
      const url = await uploadToCloudinary(file);
      if (url) coverImageUrl = url;
    }

    // Prepare data for update, only including fields if they were explicitly provided
    // This allows partial updates (PATCH-like behavior on a PUT route)
    const updateData: { [key: string]: any } = {};

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;

    if (currentWorkplace !== undefined) updateData.currentWorkplace = currentWorkplace;
    if (hometown !== undefined) updateData.hometown = hometown;
    if (studiedAt !== undefined) updateData.studiedAt = studiedAt;
    if (maritalStatus !== undefined) updateData.maritalStatus = maritalStatus as MaritalStatus; // Cast to enum

    if (contactPhoneNumber !== undefined) updateData.contactPhoneNumber = contactPhoneNumber;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (website !== undefined) updateData.website = website;
    if (socialLinks !== undefined) {
        // Ensure socialLinks is an array. If sent as JSON string, parse it.
        try {
            updateData.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
        } catch (e) {
            console.error("Failed to parse socialLinks:", e);
            return res.status(400).json({ error: 'Invalid socialLinks format' });
        }
    }

    if (currentCity !== undefined) updateData.currentCity = currentCity;
    if (pastCities !== undefined) {
        // Ensure pastCities is an array. If sent as JSON string, parse it.
        try {
            updateData.pastCities = typeof pastCities === 'string' ? JSON.parse(pastCities) : pastCities;
        } catch (e) {
            console.error("Failed to parse pastCities:", e);
            return res.status(400).json({ error: 'Invalid pastCities format' });
        }
    }

    if (gender !== undefined) updateData.gender = gender as Gender; // Cast to enum
    if (pronouns !== undefined) updateData.pronouns = pronouns;
    if (dateOfBirth !== undefined) {
      try {
        updateData.dateOfBirth = new Date(dateOfBirth); // Convert to Date object
      } catch (e) {
        console.error("Invalid dateOfBirth format:", e);
        return res.status(400).json({ error: 'Invalid dateOfBirth format' });
      }
    }
    if (languages !== undefined) {
        // Ensure languages is an array. If sent as JSON string, parse it.
        try {
            updateData.languages = typeof languages === 'string' ? JSON.parse(languages) : languages;
        } catch (e) {
            console.error("Failed to parse languages:", e);
            return res.status(400).json({ error: 'Invalid languages format' });
        }
    }

    // Perform the update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData, // Use the dynamically built updateData
      select: { // Select all fields that were updated or that you want to return
        id: true, name: true, email: true, bio: true, createdAt: true,
        profileImageUrl: true, coverImageUrl: true,
        currentWorkplace: true, hometown: true, studiedAt: true, maritalStatus: true,
        contactPhoneNumber: true, contactEmail: true, website: true, socialLinks: true,
        currentCity: true, pastCities: true, gender: true, pronouns: true, dateOfBirth: true, languages: true,
        // Do NOT select workExperiences and educationExperiences here, as they are managed by separate endpoints
        // and would make this response very large if a user has many entries.
      },
    });

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
};

// --- Work Experiences ---
export const addWorkExperience = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { company, position, description, startDate, endDate, isCurrent } = req.body;

  if (!company) {
    return res.status(400).json({ error: 'Company name is required for work experience.' });
  }

  try {
    const workExperience = await prisma.workExperience.create({
      data: {
        userId,
        company,
        position,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isCurrent: isCurrent || false,
      },
    });
    res.status(201).json(workExperience);
  } catch (error) {
    console.error('Error adding work experience:', error);
    res.status(500).json({ error: 'Failed to add work experience.' });
  }
};

export const updateWorkExperience = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { workId } = req.params;
  const { company, position, description, startDate, endDate, isCurrent } = req.body;

  try {
    // Validate ownership
    const existingWork = await prisma.workExperience.findUnique({ where: { id: workId } });
    if (!existingWork || existingWork.userId !== userId) {
      return res.status(404).json({ error: 'Work experience not found or unauthorized.' });
    }

    const updatedWork = await prisma.workExperience.update({
      where: { id: workId },
      data: {
        company: company !== undefined ? company : undefined,
        position: position !== undefined ? position : undefined,
        description: description !== undefined ? description : undefined,
        startDate: startDate !== undefined ? new Date(startDate) : undefined,
        endDate: endDate !== undefined ? new Date(endDate) : undefined,
        isCurrent: isCurrent !== undefined ? isCurrent : undefined,
      },
    });
    res.json(updatedWork);
  } catch (error) {
    console.error('Error updating work experience:', error);
    res.status(500).json({ error: 'Failed to update work experience.' });
  }
};

export const deleteWorkExperience = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { workId } = req.params;

  try {
    // Validate ownership
    const existingWork = await prisma.workExperience.findUnique({ where: { id: workId } });
    if (!existingWork || existingWork.userId !== userId) {
      return res.status(404).json({ error: 'Work experience not found or unauthorized.' });
    }
    await prisma.workExperience.delete({ where: { id: workId } });
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting work experience:', error);
    res.status(500).json({ error: 'Failed to delete work experience.' });
  }
};


// --- Education Experiences ---
export const addEducationExperience = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { institution, degree, fieldOfStudy, startDate, endDate, description } = req.body;

  if (!institution) {
    return res.status(400).json({ error: 'Institution name is required for education experience.' });
  }

  try {
    const educationExperience = await prisma.educationExperience.create({
      data: {
        userId,
        institution,
        degree,
        fieldOfStudy,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        description,
      },
    });
    res.status(201).json(educationExperience);
  } catch (error) {
    console.error('Error adding education experience:', error);
    res.status(500).json({ error: 'Failed to add education experience.' });
  }
};

export const updateEducationExperience = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { educationId } = req.params;
  const { institution, degree, fieldOfStudy, startDate, endDate, description } = req.body;

  try {
    // Validate ownership
    const existingEducation = await prisma.educationExperience.findUnique({ where: { id: educationId } });
    if (!existingEducation || existingEducation.userId !== userId) {
      return res.status(404).json({ error: 'Education experience not found or unauthorized.' });
    }

    const updatedEducation = await prisma.educationExperience.update({
      where: { id: educationId },
      data: {
        institution: institution !== undefined ? institution : undefined,
        degree: degree !== undefined ? degree : undefined,
        fieldOfStudy: fieldOfStudy !== undefined ? fieldOfStudy : undefined,
        startDate: startDate !== undefined ? new Date(startDate) : undefined,
        endDate: endDate !== undefined ? new Date(endDate) : undefined,
        description: description !== undefined ? description : undefined,
      },
    });
    res.json(updatedEducation);
  } catch (error) {
    console.error('Error updating education experience:', error);
    res.status(500).json({ error: 'Failed to update education experience.' });
  }
};

export const deleteEducationExperience = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { educationId } = req.params;

  try {
    // Validate ownership
    const existingEducation = await prisma.educationExperience.findUnique({ where: { id: educationId } });
    if (!existingEducation || existingEducation.userId !== userId) {
      return res.status(404).json({ error: 'Education experience not found or unauthorized.' });
    }
    await prisma.educationExperience.delete({ where: { id: educationId } });
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting education experience:', error);
    res.status(500).json({ error: 'Failed to delete education experience.' });
  }
};