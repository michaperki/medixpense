
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import locationRoutes from './routes/locations';
import providerRoutes from './routes/providers';
import procedureRoutes from './routes/procedures';
import searchRoutes from './routes/search';
import profileRoutes from './routes/profile';
import settingsRoutes from './routes/settings';

const app = express();

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

export default app;
