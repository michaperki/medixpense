
import { AuthenticatedUser } from '../../middleware/auth'; // or define a cleaner interface if needed

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
