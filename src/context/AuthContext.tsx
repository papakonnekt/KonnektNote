import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode'; // Correct named import

// Define the shape of the user object derived from the JWT payload
interface DecodedUser {
  userId: number;
  username: string;
  // Add other fields from payload if needed (e.g., roles)
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}

// Define the shape of the context value
interface AuthContextType {
  token: string | null;
  user: DecodedUser | null;
  isLoading: boolean; // To handle initial token loading/validation
  login: (newToken: string) => void;
  logout: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_TOKEN_KEY = 'authToken'; // Key for local storage

/**
 * Provides authentication state and actions to the application.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<DecodedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially

  // Effect to load token from storage on initial mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (storedToken) {
        const decoded = jwtDecode<DecodedUser>(storedToken);
        // Optional: Check if token is expired before setting state
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser(decoded);
        } else {
          // Token expired, remove it
          localStorage.removeItem(AUTH_TOKEN_KEY);
          console.log('Removed expired token from storage.');
        }
      }
    } catch (error) {
      console.error('Failed to load or decode token:', error);
      localStorage.removeItem(AUTH_TOKEN_KEY); // Clear invalid token
    } finally {
      setIsLoading(false); // Finished loading/checking token
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const login = (newToken: string) => {
    try {
      const decoded = jwtDecode<DecodedUser>(newToken);
       // Optional: Check expiration again just in case
      if (decoded.exp * 1000 > Date.now()) {
        localStorage.setItem(AUTH_TOKEN_KEY, newToken);
        setToken(newToken);
        setUser(decoded);
      } else {
         console.error('Attempted to login with an expired token.');
         // Optionally clear storage again if needed
         localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Failed to decode token on login:', error);
      // Don't set invalid token
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    // Optionally redirect to login or clear other app state
    console.log('User logged out.');
  };

  // Value provided to consuming components
  const value = { token, user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to easily consume the AuthContext.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};