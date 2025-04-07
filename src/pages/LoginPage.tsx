import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../context/AuthContext';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

const LoginPage: React.FC = () => {
  const { token } = useAuth();
  const location = useLocation();

  // If user is already logged in, redirect them from login page
  // Redirect to the page they were trying to access, or to home ('/')
  const from = location.state?.from?.pathname || '/';
  if (token) {
    return <Navigate to={from} replace />;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Render the LoginForm component */}
        <LoginForm />
        {/* Optional: Link to Register page */}
        {/* <p>Don't have an account? <Link to="/register">Register here</Link></p> */}
      </Box>
    </Container>
  );
};

export default LoginPage;