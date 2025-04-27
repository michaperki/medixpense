
// src/types/express.d.ts
import { User } from '@prisma/client'; // Assuming User is the correct type, adjust if needed
import { Provider } from '@prisma/client'; // Adjust the import based on your actual models

declare global {
  namespace Express {
    interface Request {
      user: User & { provider: Provider }; // User with a provider
      file?: Express.Multer.File; // Adding file for multer
    }
  }
}

