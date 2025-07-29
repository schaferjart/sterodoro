import React, { useState, useRef } from 'react';
import { signUp } from '../../lib/auth';

const Signup: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    const { success, error } = await signUp(email, password);
    setLoading(false);
    if (success) {
      setSuccess('Signup successful! Check your email.');
      setEmail('');
      setPassword('');
      if (onSuccess) onSuccess();
    } else {
      setError(error || 'Signup failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto p-6 bg-gray-800 rounded-xl shadow-lg flex flex-col gap-4 mt-8">
      <h2 className="text-xl font-bold text-white mb-2">Sign Up</h2>
      <input
        ref={emailRef}
        type="email"
        inputMode="email"
        autoComplete="username"
        placeholder="Email"
        className="p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        inputMode="text"
        autoComplete="new-password"
        placeholder="Password"
        className="p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}
      <button
        type="submit"
        className="w-full p-3 rounded bg-green-600 text-white font-bold text-lg mt-2 disabled:bg-gray-600"
        style={{ minHeight: 44 }}
        disabled={loading}
      >
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
};

export default Signup; 