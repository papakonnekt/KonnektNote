import React from 'react'; // Import React for StrictMode key prop if needed later
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline'; // Import CssBaseline
import { ThemeProvider, createTheme } from '@mui/material/styles'; // Import ThemeProvider
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Import the provider

// Get the root element
const rootElement = document.getElementById('root');

if (rootElement) {
  // Create the root and render the App component
  createRoot(rootElement).render(
    <React.StrictMode>
      {/* TODO: Define a proper theme later */}
      <ThemeProvider theme={createTheme()}>
        <CssBaseline /> {/* Apply baseline styles */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );
} else {
  console.error("Failed to find the root element. Make sure your HTML has an element with id='root'.");
}
