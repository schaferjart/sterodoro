import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getSession } from '../lib/auth';

const AuthStatusChecker: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      console.log('🔍 Checking authentication status...');
      
      // Check current session
      const { data: { session }, error } = await getSession();
      console.log('Session check result:', { session: !!session, error });
      
      // Test Supabase connection
      const { data: testData, error: testError } = await supabase
        .from('activity_objects')
        .select('id')
        .limit(1);
      console.log('Connection test result:', { testData: !!testData, testError });

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User check result:', { user: !!user, userId: user?.id });

      setAuthStatus({
        session: session,
        user: session?.user || user,
        sessionError: error,
        connectionTest: testData,
        connectionError: testError,
        isAuthenticated: !!(session?.user || user),
        timestamp: new Date().toISOString(),
        debug: {
          hasSession: !!session,
          hasUser: !!user,
          sessionUserId: session?.user?.id,
          userUserId: user?.id
        }
      });
    } catch (error) {
      console.error('Auth status check error:', error);
      setAuthStatus({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleSignIn = async () => {
    const email = prompt('Enter your email:');
    const password = prompt('Enter your password:');
    
    if (email && password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert(`Sign in failed: ${error.message}`);
      } else {
        alert('Sign in successful!');
        checkAuthStatus();
      }
    }
  };

  const handleSignUp = async () => {
    const email = prompt('Enter your email:');
    const password = prompt('Enter your password (min 6 characters):');
    
    if (email && password) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert(`Sign up failed: ${error.message}`);
      } else {
        alert('Sign up successful! Check your email for confirmation.');
        checkAuthStatus();
      }
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(`Sign out failed: ${error.message}`);
    } else {
      alert('Sign out successful!');
      checkAuthStatus();
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-2">🔐 Auth Status</h3>
        <p className="text-gray-400">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">🔐 Auth Status</h3>
        <button 
          onClick={checkAuthStatus}
          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-center space-x-2">
          <span className={`w-3 h-3 rounded-full ${authStatus?.isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-white">
            Status: {authStatus?.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </div>

        {!authStatus?.isAuthenticated && (
          <div className="bg-yellow-900 p-3 rounded border border-yellow-600">
            <div className="text-yellow-200 font-bold mb-2">⚠️ Authentication Required</div>
            <div className="text-yellow-300 text-xs">
              You need to sign in to use Supabase sync features. 
              The app will work offline, but sync operations will fail.
            </div>
          </div>
        )}

        {authStatus?.user && (
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-300">User: {authStatus.user.email}</div>
            <div className="text-gray-400 text-xs">ID: {authStatus.user.id}</div>
          </div>
        )}

        {authStatus?.sessionError && (
          <div className="bg-red-900 p-2 rounded">
            <div className="text-red-300">Session Error: {authStatus.sessionError.message}</div>
          </div>
        )}

        {authStatus?.connectionError && (
          <div className="bg-red-900 p-2 rounded">
            <div className="text-red-300">Connection Error: {authStatus.connectionError.message}</div>
          </div>
        )}

        {authStatus?.connectionTest && (
          <div className="bg-green-900 p-2 rounded">
            <div className="text-green-300">✅ Supabase connection successful</div>
          </div>
        )}

        <div className="text-gray-400 text-xs">
          Last checked: {authStatus?.timestamp}
        </div>

        {authStatus?.debug && (
          <div className="bg-gray-700 p-2 rounded text-xs">
            <div className="text-gray-300 font-bold">Debug Info:</div>
            <div className="text-gray-400">Has Session: {authStatus.debug.hasSession ? 'Yes' : 'No'}</div>
            <div className="text-gray-400">Has User: {authStatus.debug.hasUser ? 'Yes' : 'No'}</div>
            <div className="text-gray-400">Session User ID: {authStatus.debug.sessionUserId || 'None'}</div>
            <div className="text-gray-400">User User ID: {authStatus.debug.userUserId || 'None'}</div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {!authStatus?.isAuthenticated ? (
          <>
            <button 
              onClick={handleSignIn}
              className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Sign In
            </button>
            <button 
              onClick={handleSignUp}
              className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign Up
            </button>
          </>
        ) : (
          <button 
            onClick={handleSignOut}
            className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthStatusChecker; 