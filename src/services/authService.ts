import apiClient from './apiClient';
// Assuming UserCredentials and NewUser types are defined/shared
// e.g., import { UserCredentials, NewUser } from '../types/user';

// Define types locally if not shared yet
interface UserCredentials {
  username: string;
  password: string;
}
interface LoginResponse {
  token: string;
}
interface NewUser {
  id: number;
  username: string;
  created_at: string | Date;
  updated_at: string | Date;
}


/**
 * Registers a new user.
 * @param credentials - Username and password.
 * @returns The newly created user object.
 */
export const register = async (credentials: UserCredentials): Promise<NewUser> => {
  try {
    const response = await apiClient.post<NewUser>('/auth/register', credentials);
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    // Re-throw the error so UI components can handle it
    throw error;
  }
};

/**
 * Logs in a user.
 * @param credentials - Username and password.
 * @returns An object containing the JWT token.
 */
export const login = async (credentials: UserCredentials): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};