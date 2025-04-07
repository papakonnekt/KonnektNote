import React from 'react';
import { Navigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import { useAuth } from '../context/AuthContext';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

const RegisterPage: React.FC = () => {
  const { token } = useAuth();

  // If user is already logged in, redirect them from register page
  if (token) {
    return <Navigate to="/" replace />;
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
        {/* Render the RegisterForm component */}
        <RegisterForm />
        {/* Optional: Link to Login page */}
        {/* <p>Already have an account? <Link to="/login">Login here</Link></p> */}
      </Box>
    </Container>
  );
};

export default RegisterPage;