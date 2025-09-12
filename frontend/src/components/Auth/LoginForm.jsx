"use client";
import React, { useState } from "react";
import {useDispatch, useSelector} from "react-redux";
import { useRouter } from "next/navigation";
import { setUser } from "../../redux/slices/authSlice";
import api from "../../utils/api.js";

export default function LoginForm({ onToggleRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const router = useRouter();

  if (isAuthenticated) {
    router.push("/chat");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password){
      setError("All fields are required");
      return;
    }
    try {
      const response = await api.post("/auth/login", {email, password});
      dispatch(setUser(response.data.user));
      router.push("/chat")
    } catch (error) {
      setError(error.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
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
          className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Login
        </button>
      </form>
      <p className="mt-4 text-center">
        Don’t have an account?{' '}
        <button
          onClick={onToggleRegister}
          className="text-blue-500 hover:underline"
        >
          Sign up
        </button>
      </p>
    </div>
  );
}

