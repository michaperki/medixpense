
// apps/api/src/index.ts
import 'dotenv/config';
import 'tsconfig-paths/register';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { prisma } from '@packages/database';
import authRoutes from './routes/auth';
import locationRoutes from './routes/locations';
import providerRoutes from './routes/providers';
import procedureRoutes from './routes/procedures';
import searchRoutes from './routes/search';
import profileRoutes from './routes/profile';
import settingsRoutes from './routes/settings';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.get('/api', (_req: Request, res: Response) => {
  res.json({ message: 'Welcome to Medixpense API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/procedures', procedureRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Connect DB and start server
async function startServer() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✅ Successfully connected to database');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    }).on('error', (err: any) => {
      console.error('Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

