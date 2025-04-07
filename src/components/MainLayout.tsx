import React from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useAuth } from '../context/AuthContext'; // To add logout button

const MainLayout: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/notes', label: 'Notes' },
    { path: '/checklist', label: 'Checklist' },
    { path: '/graph', label: 'Graph' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            KonnektNotes
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={RouterLink}
                to={item.path}
                sx={{
                  color: '#fff',
                  fontWeight: location.pathname.startsWith(item.path) ? 'bold' : 'normal',
                  textDecoration: location.pathname.startsWith(item.path) ? 'underline' : 'none',
                }}
              >
                {item.label}
              </Button>
            ))}
             <Button sx={{ color: '#fff' }} onClick={logout}>
                Logout
             </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 1, overflow: 'auto' }}>
        {/* Child routes will render here */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;