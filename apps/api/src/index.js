// in apps/api/src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import locationRoutes from './routes/locations.js';
import providerRoutes from './routes/providers.js';
import procedureRoutes from './routes/procedures.js'; // Add this import
import searchRoutes from './routes/search.js'; // Add this if not present
import profileRoutes from './routes/profile.js';
import settingsRoutes from './routes/settings.js';


const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Medixpense API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/procedures', procedureRoutes); // Add this line
app.use('/api/search', searchRoutes); // Add this if not present
// Add these route handlers
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }
});
