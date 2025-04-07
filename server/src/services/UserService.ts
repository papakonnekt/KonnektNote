import bcrypt from 'bcrypt';
import db from '../db'; // Knex instance
import { UserCredentials, NewUser, UserWithHash } from '../types/user'; // Import UserWithHash

const USERS_TABLE = 'users';
const SALT_ROUNDS = 10; // Cost factor for bcrypt hashing

/**
 * Finds a user by their username.
 * Includes the password hash for login verification.
 * @param username - The username to search for.
 * @returns The user object including password hash, or undefined if not found.
 */
export const findUserByUsername = async (
  username: string
): Promise<UserWithHash | undefined> => { // Use UserWithHash type
  const user = await db(USERS_TABLE)
    .where({ username })
    .first('id', 'username', 'password_hash'); // Select necessary fields
  return user;
};

/**
 * Creates a new user.
 * Hashes the password before storing.
 * @param userData - Object containing username and password.
 * @returns The newly created user object (excluding password hash).
 * @throws Error if the username already exists.
 */
export const createUser = async (userData: UserCredentials): Promise<NewUser> => {
  const { username, password } = userData;

  // 1. Check if username already exists
  const existingUser = await findUserByUsername(username);
  if (existingUser) {
    // Throw a specific error type or message for the controller to handle
    const error = new Error('Username already exists');
    (error as any).statusCode = 409; // Conflict status code
    throw error;
  }

  // 2. Hash the password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Insert the new user
  // Knex insert typically returns an array of inserted IDs
  const [insertedId] = await db(USERS_TABLE).insert(
    {
      username,
      password_hash,
    },
    'id' // Specify returning the 'id' column
  );

  // 4. Fetch the newly created user (without the hash) to return it
  // Need to handle potential differences in how 'returning' works across DBs
  // For SQLite, we might need a separate select after insert if 'returning' isn't fully supported via insert ID
  const newUser = await db(USERS_TABLE)
    .where({ id: typeof insertedId === 'object' ? insertedId.id : insertedId }) // Handle potential object return
    .first('id', 'username', 'created_at', 'updated_at');

  if (!newUser) {
    // This should ideally not happen if insert was successful
    throw new Error('Failed to retrieve newly created user.');
  }

  return newUser;
};

// Define simple types for now (consider moving to a dedicated types file/folder later)
// Assuming these are defined in src/types/user.ts
/*
export interface UserCredentials {
  username: string;
  password: string;
}

export interface NewUser {
  id: number;
  username: string;
  created_at: string; // Or Date
  updated_at: string; // Or Date
}
*/