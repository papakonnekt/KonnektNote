import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { useAuth } from '../context/AuthContext';
import * as authService from '../services/authService';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth(); // Get login function from context

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // Clear previous errors
    setIsLoading(true);

    try {
      const response = await authService.login({ username, password });
      login(response.token); // Call context login function with the received token
      // No need to redirect here, the routing logic (TODO 11 Task 3) will handle it
    } catch (err: any) {
      // Handle specific errors from the API response if available
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Login</h2>
      {error && <p style={styles.error}>{error}</p>}
      <div style={styles.inputGroup}>
        <label htmlFor="login-username">Username:</label>
        <input
          type="text"
          id="login-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <label htmlFor="login-password">Password:</label>
        <input
          type="password"
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
      </div>
      <button type="submit" disabled={isLoading} style={styles.button}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </form>
  );
};

// Basic inline styles (consider moving to CSS)
const styles = {
    form: {
        display: 'flex',
        flexDirection: 'column' as 'column',
        maxWidth: '300px',
        margin: '2rem auto',
        padding: '1rem',
        border: '1px solid #ccc',
        borderRadius: '5px',
    },
    inputGroup: {
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column' as 'column',
    },
    input: {
        padding: '0.5rem',
        fontSize: '1rem',
        border: '1px solid #ccc',
        borderRadius: '3px',
    },
    button: {
        padding: '0.7rem',
        fontSize: '1rem',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '3px',
        cursor: 'pointer',
    },
    error: {
        color: 'red',
        marginBottom: '1rem',
        textAlign: 'center' as 'center',
    }
};


export default LoginForm;