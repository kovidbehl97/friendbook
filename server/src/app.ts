import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';

import authRoutes from './routes/authRoutes';

const app = express();

app.use(cors(
  {
    origin: 'http://localhost:5173',
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

export default app;