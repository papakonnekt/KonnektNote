import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import './App.css'; // Keep global styles if any

// Import Layouts and Pages/Views
import MainLayout from './components/MainLayout';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotesView from './views/NotesView';
import ChecklistView from './views/ChecklistView';
import GraphView from './views/GraphView';
// Import Auth context to potentially check loading state
import { useAuth } from './context/AuthContext';

function App() {
  const { isLoading } = useAuth(); // Get loading state

  // Optional: Show a global loading indicator while auth state is being checked
  if (isLoading) {
    // TODO: Replace with a better global loading indicator if desired
    return <div>Loading Application...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            {/* Default route within MainLayout */}
            <Route index element={<Navigate to="/notes" replace />} />
            {/* Specific views */}
            <Route path="notes" element={<NotesView />} />
            <Route path="checklist" element={<ChecklistView />} />
            <Route path="graph" element={<GraphView />} />
            {/* Add other private routes here */}
          </Route>
        </Route>

        {/* Fallback for unknown routes (optional) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        {/* Or show a 404 component: <Route path="*" element={<NotFoundPage />} /> */}

      </Routes>
    </Router>
  );
}

export default App;
