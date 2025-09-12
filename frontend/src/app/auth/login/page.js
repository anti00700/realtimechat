'use client';
import React, { useState } from 'react';
import LoginForm from '../../../components/Auth/LoginForm';
import RegisterForm from '../../../components/Auth/RegisterForm.jsx';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => setIsLogin(!isLogin);

  return (
    <div>
      {isLogin ? (
        <LoginForm onToggleRegister={toggleForm} />
      ) : (
        <RegisterForm onToggleLogin={toggleForm} />
      )}
    </div>
  );
}