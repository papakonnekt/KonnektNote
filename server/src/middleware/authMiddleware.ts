import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../types/user'; // Import the extended Request type

/**
 * Middleware to verify JWT token and attach user info to the request object.
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  // Token format is "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    // If no token, return 401 Unauthorized
    res.status(401).json({ message: 'Authentication token required' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in environment variables.');
    // Don't leak internal details, send a generic server error
    res.status(500).json({ message: 'Internal Server Error' });
    return;
  }

  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) {
      // If token is invalid or expired, return 403 Forbidden
      console.error('JWT Verification Error:', err.message);
      res.status(403).json({ message: 'Invalid or expired token' });
      return;
    }

    // Token is valid, attach user payload to request object
    // Ensure the payload structure matches what was signed in AuthController.login
    if (user && typeof user === 'object' && 'userId' in user) {
      req.user = { id: user.userId } as AuthenticatedUser; // Cast or validate further if needed
      next(); // Proceed to the next middleware or route handler
    } else {
      // Payload is malformed
      console.error('JWT payload is malformed:', user);
      res.status(403).json({ message: 'Malformed token payload' });
    }
  });
};