// friendbook/server/src/app.ts
import express, { Router, Express } from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import authRoutes from './routes/authRoutes';
import postRoutes from './routes/postRoutes';
import commentRoutes from './routes/commentRoutes';

import friendRoutes from './routes/friendRoutes';
import notificationRoutes from './routes/notificationRoutes';
import userRoutes from './routes/userRoutes';
import messageRoutes from './routes/messageRoutes';
import cookieParser from 'cookie-parser';


const app = express();

app.use(cors(
  {
    origin: 'https://friendbook-client.vercel.app',  
    credentials: true,               
  }
));


app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes)
app.use('/api/users', userRoutes);

export default app;