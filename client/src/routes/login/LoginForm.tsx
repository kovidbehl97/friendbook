// src/components/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

interface User {
  id: string;
  name: string;
  email: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

const loginApi = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await axiosInstance.post('/auth/login', credentials, {
    withCredentials: true,
  });
  return response.data;
};

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: loginApi,
    onSuccess: (data) => {
      login(data.user, data.accessToken); // Set the user in context
      navigate('/'); // Redirect after login
    },
    onError: (error) => {
      setError(error.message || 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate({ email, password });
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form className="bg-white p-8 rounded shadow-md w-96" onSubmit={handleSubmit}>
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-500">friendbook</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          type="text"
          placeholder="Email or phone number"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mb-4"
          type="submit"
        >
          Log In
        </button>
        <Link to="/forgot-password" className="text-blue-500 text-sm block text-center mb-4">
          Forgot account?
        </Link>
        <div className="flex items-center gap-2 text-gray-400">
          <span className="mt-1 h-[1px] w-full bg-gray-400"></span>
          or
          <span className="mt-1 h-[1px] w-full bg-gray-400"></span>
        </div>
        <Link
          to="/register"
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600 block m-auto mt-4 text-center"
        >
          Create new account
        </Link>
      </form>
    </div>
  );
}

export default Login;
