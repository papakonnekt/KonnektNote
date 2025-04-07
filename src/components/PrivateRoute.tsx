import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * A wrapper for routes that require authentication.
 * If the user is authenticated, it renders the child routes (using Outlet).
 * If not authenticated, it redirects the user to the login page,
 * preserving the location they were trying to access.
 */
const PrivateRoute: React.FC = () => {
  const { token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading indicator while checking auth status
    // TODO: Replace with a proper loading spinner/component
    return <div>Loading authentication status...</div>;
  }

  if (!token) {
    // User not logged in, redirect to login page
    // Pass the current location in state so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the nested routes
  return <Outlet />;
};

export default PrivateRoute;