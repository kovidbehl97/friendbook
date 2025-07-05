// src/pages/Register.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';

const registerUser = async (userData: { name: string; email: string; password: string }) => {
  const response = await axiosInstance.post('/auth/register', userData);

  if (response.status !== 201 && response.status !== 200) {
    throw new Error(response.data?.error || 'Registration failed');
  }

  return response.data;
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      navigate('/login');
    },
    onError: (error: any) => {
      setError(error.message || 'Something went wrong');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    mutation.mutate({ name, email, password });
  };

  return (
    <div className="flex items-center justify-center bg-gray-100 min-h-screen">
      <form className="bg-white p-8 rounded shadow-md w-96" onSubmit={handleSubmit}>
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-500">friendbook</h1>
        <h1 className="text-lg font-semibold text-center">Create a new account</h1>
        <p className="text-gray-600 text-sm text-center mb-4">It's quick and easy.</p>
        <hr className="mb-4" />

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <input
          className="w-full p-2 mb-4 border rounded"
          type="text"
          placeholder="Please enter your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full p-2 mb-4 border rounded"
          type="email"
          placeholder="Please enter your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full p-2 mb-4 border rounded"
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="w-full p-2 border rounded"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 mt-4"
          type="submit"
          disabled={mutation.status === 'pending'}
        >
          {mutation.status === 'pending' ? 'Signing Up...' : 'Sign Up'}
        </button>

        <Link to="/login" className="text-blue-500 text-sm flex justify-center text-center mt-4">
          Already have an account?
        </Link>
      </form>
    </div>
  );
};

export default Register;
