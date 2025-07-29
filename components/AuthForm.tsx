import React, { useState, useEffect } from 'react';
import { signUp, signIn, signOut, getSession, onAuthStateChange } from '../lib/auth';

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    const { success, error } = await signUp(email, password);
    setLoading(false);
    if (success) setSuccess('Signup successful! Check your email for confirmation.');
    else setError(error || 'Signup failed');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    const { success, error } = await signIn(email, password);
    setLoading(false);
    if (success) setSuccess('Login successful!');
    else setError(error || 'Login failed');
  };

  const handleSignOut = async () => {
    setLoading(true); setError(null); setSuccess(null);
    const { success, error } = await signOut();
    setLoading(false);
    if (success) setSuccess('Logged out.');
    else setError(error || 'Logout failed');
  };

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-xl shadow-lg w-full max-w-xs mx-auto mt-8">
        <p className="mb-4 text-green-400">Logged in as <span className="font-mono">{user.email}</span></p>
        <button onClick={handleSignOut} className="w-full p-2 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700">Log Out</button>
        {success && <p className="mt-2 text-green-400">{success}</p>}
        {error && <p className="mt-2 text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <form className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-xl shadow-lg w-full max-w-xs mx-auto mt-8" autoComplete="off">
      <h2 className="text-xl font-bold mb-4 text-white">Sign Up / Log In</h2>
      <input
        type="email"
        placeholder="Email"
        className="mb-2 p-2 rounded w-full bg-gray-700 text-white"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="username"
      />
      <input
        type="password"
        placeholder="Password"
        className="mb-4 p-2 rounded w-full bg-gray-700 text-white"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      <div className="flex w-full gap-2">
        <button onClick={handleSignIn} disabled={loading} className="flex-1 p-2 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:bg-gray-600">Log In</button>
        <button onClick={handleSignUp} disabled={loading} className="flex-1 p-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 disabled:bg-gray-600">Sign Up</button>
      </div>
      {success && <p className="mt-2 text-green-400">{success}</p>}
      {error && <p className="mt-2 text-red-400">{error}</p>}
    </form>
  );
};

export default AuthForm; 