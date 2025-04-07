import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import * as authService from '../services/authService';
// Optional: Import useAuth if you want to log in automatically after registration
// import { useAuth } from '../context/AuthContext';

const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const { login } = useAuth(); // Uncomment if auto-login is desired

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await authService.register({ username, password });
      setSuccess('Registration successful! You can now log in.');
      // Reset form
      setUsername('');
      setPassword('');
      setConfirmPassword('');

      // Optional: Automatically log the user in
      // const loginResponse = await authService.login({ username, password });
      // login(loginResponse.token);

    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Register</h2>
      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}
      <div style={styles.inputGroup}>
        <label htmlFor="register-username">Username:</label>
        <input
          type="text"
          id="register-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <label htmlFor="register-password">Password:</label>
        <input
          type="password"
          id="register-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
      </div>
       <div style={styles.inputGroup}>
        <label htmlFor="register-confirm-password">Confirm Password:</label>
        <input
          type="password"
          id="register-confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={styles.input}
        />
      </div>
      <button type="submit" disabled={isLoading} style={styles.button}>
        {isLoading ? 'Registering...' : 'Register'}
      </button>
      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </form>
  );
};

// Reusing similar styles (consider a shared style sheet)
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
        backgroundColor: '#28a745', // Green for register
        color: 'white',
        border: 'none',
        borderRadius: '3px',
        cursor: 'pointer',
    },
    error: {
        color: 'red',
        marginBottom: '1rem',
        textAlign: 'center' as 'center',
    },
    success: {
        color: 'green',
        marginBottom: '1rem',
        textAlign: 'center' as 'center',
    }
};

export default RegisterForm;