import 'dotenv/config';
import 'tsconfig-paths/register';
import { prisma } from '@packages/database';
import app from './app';

const PORT = process.env.PORT || 3001;

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
