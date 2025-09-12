'use client';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { setUser } from '../../redux/slices/authSlice';
import api from '../../utils/api';

export default function RegisterForm({ onToggleLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const router = useRouter();

  if (isAuthenticated) {
    router.push('/chat');
  }

  const checkUsername = async () => {
    if (!username.trim()) {
      setError('Username is required');
      setUsernameAvailable(null);
      return;
    }
    try {
      const response = await api.get(`/auth/check-username?username=${username}`);
      setUsernameAvailable(response.data.available);
      if (!response.data.available) {
        setError('Username is taken');
      } else {
        setError('');
      }
    } catch (err) {
      setError('Error checking username');
      setUsernameAvailable(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !email || !password) {
      setError('All fields are required');
      return;
    }
    if (!usernameAvailable) {
      setError('Please choose a valid username');
      return;
    }
    try {
      const response = await api.post('/auth/register', { username, email, password });
      localStorage.setItem('otpToken', response.data.otpToken); // Store otpToken
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={checkUsername}
            className={`w-full p-2 border rounded-lg ${
              usernameAvailable === false ? 'border-red-500' : usernameAvailable ? 'border-green-500' : ''
            }`}
            placeholder="Enter your username"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-lg"
            placeholder="Enter your email"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-lg"
            placeholder="Enter your password"
          />
        </div>
        <button
          type="submit"
          disabled={!usernameAvailable}
          className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          Register
        </button>
      </form>
      <p className="mt-4 text-center">
        Already have an account?{' '}
        <button
          onClick={onToggleLogin}
          className="text-blue-500 hover:underline"
        >
          Login
        </button>
      </p>
    </div>
  );
}