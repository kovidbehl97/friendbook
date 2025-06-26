// friendbook/server/src/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client'; // Ensure PrismaClient is imported
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!; 
export const registerUser = async (data: any) => {
  const { name, email, password } = data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword
    }
  });

  return user;
};

export const loginUser = async (data: any) => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  const accessToken = signAccessToken(user.id);
  const refreshToken = await signRefreshToken(user.id);

  // Note: The 'user' returned here by loginUser might still be basic.
  // The frontend's useCurrentUser hook will re-fetch the full profile via /auth/me
  // after successful login, which will then use the updated verifyAccessToken.
  return { accessToken, refreshToken, user };
};

export const signAccessToken = (userId: string) => {
  return jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: '5h' });
};

export const signRefreshToken = async (userId: string) => {
  const token = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  const decoded: any = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });

  return token;
};

export const verifyRefreshToken = async (token: string) => {
  try {
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string };
    const stored = await prisma.refreshToken.findUnique({ where: { token } });

    if (!stored) {
      throw new Error('Refresh token not found in DB');
    }

    return payload.userId;
  } catch (err) {
    throw new Error('Invalid refresh token');
  }
};

export const verifyAccessToken = async (token: string) => {
  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { // <--- UPDATED SELECT STATEMENT HERE
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
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (err) {
    console.error('Error in verifyAccessToken:', err); // Added console.error for better debugging
    throw new Error('Invalid access token');
  }
};

export const deleteRefreshToken = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: { // <--- UPDATED SELECT STATEMENT HERE
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
    }
  });
};