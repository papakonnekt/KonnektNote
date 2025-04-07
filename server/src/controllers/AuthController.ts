import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as UserService from '../services/UserService';
import { UserCredentials } from '../types/user';

/**
 * Handles user registration requests.
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body as UserCredentials;

    // Basic validation
    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }
    if (password.length < 3) { // Changed minimum length to 3
      res
        .status(400)
        .json({ message: 'Password must be at least 3 characters long' });
      return;
    }

    // Call the user service to create the user
    const newUser = await UserService.createUser({ username, password });

    // Send success response (201 Created)
    res.status(201).json(newUser);
  } catch (error: any) {
    // Handle specific errors (like username exists) or pass to generic handler
    if (error.statusCode === 409) {
      res.status(409).json({ message: error.message });
    } else {
      next(error); // Pass other errors to the generic error handler
    }
  }
};

/**
 * Handles user login requests.
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body as UserCredentials;

    // Basic validation
    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    // Find user by username (service function returns hash)
    const user = await UserService.findUserByUsername(username);
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' }); // Generic message
      return;
    }

    // Compare provided password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' }); // Generic message
      return;
    }

    // Check if JWT secret is set
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables.');
      throw new Error('Authentication configuration error.'); // Throw generic error for security
    }

    // Generate JWT
    const payload = {
      userId: user.id,
      username: user.username,
      // Add other non-sensitive info if needed (e.g., roles)
    };
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: '1h', // Token expiration time (e.g., 1 hour)
    });

    // Send token back to client
    res.status(200).json({ token });
  } catch (error) {
    next(error); // Pass errors to the generic error handler
  }
};