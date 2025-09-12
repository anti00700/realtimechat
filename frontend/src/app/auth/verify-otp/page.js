'use client';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { setUser } from '../../../redux/slices/authSlice';
import api from '../../../utils/api';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const otpToken = localStorage.getItem('otpToken'); // Retrieve otpToken

  if (isAuthenticated) {
    router.push('/chat');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }
    if (!email) {
      setError('Email is missing. Please register again.');
      router.push('/auth/login');
      return;
    }
    if (!otpToken) {
      setError('Session expired. Please register again.');
      router.push('/auth/login');
      return;
    }
    try {
      const response = await api.post('/auth/verify-otp', { otp, email, otpToken });
      dispatch(setUser(response.data.user));
      localStorage.removeItem('otpToken'); // Clear otpToken
      router.push('/chat');
    } catch (err) {
      setError(err.response?.data?.msg || 'OTP verification failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Verify OTP</h2>
        <p className="mb-4 text-sm text-gray-600">
          Enter the OTP sent to {email || 'your email'}
        </p>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="otp" className="block text-sm font-medium">OTP</label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Enter OTP"
            />
          </div>
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Verify
          </button>
        </form>
        <p className="mt-4 text-center">
          Back to{' '}
          <button
            onClick={() => router.push('/auth/login')}
            className="text-blue-500 hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}