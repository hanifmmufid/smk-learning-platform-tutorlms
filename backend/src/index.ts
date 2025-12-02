import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS configuration - support multiple origins
const allowedOrigins = [
  'http://localhost:3003',
  'http://localhost:3006',
  'https://smk.hanifmufid.com',
  'http://smk.hanifmufid.com',
  'http://135.125.175.52',  // Debug tool on server IP
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (static files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'SMK Learning Platform Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Import routes
import authRoutes from './routes/authRoutes';
import classRoutes from './routes/classRoutes';
import subjectRoutes from './routes/subjectRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import materialRoutes from './routes/materialRoutes';
import userRoutes from './routes/userRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import submissionRoutes from './routes/submissionRoutes';
import quizRoutes from './routes/quizRoutes';
import attemptRoutes from './routes/attemptRoutes';

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
