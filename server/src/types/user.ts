/**
 * Represents the credentials provided during login or registration.
 */
export interface UserCredentials {
  username: string;
  password: string;
}

/**
 * Represents the data structure of a newly created user,
 * typically returned after successful registration (excluding sensitive info).
 */
export interface NewUser {
  id: number;
  username: string;
  created_at: string | Date; // Knex might return string or Date depending on driver/config
  updated_at: string | Date;
}

/**
 * Represents the full user object including the password hash,
 * typically used internally by the UserService or AuthController.
 */
export interface UserWithHash extends NewUser {
  password_hash: string;
}

/**
 * Represents user data attached to the request object by authentication middleware.
 */
export interface AuthenticatedUser {
  id: number;
  // Add other non-sensitive fields if needed later (e.g., roles)
}

// Extend Express Request interface to include the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}