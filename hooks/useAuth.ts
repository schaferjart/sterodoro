import { useEffect, useState } from 'react';
import { getSession, onAuthStateChange } from '../lib/auth';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getSession()
      .then(({ data, error }) => {
        setUser(data?.session?.user ?? null);
        setError(error ? error.message : null);
        setLoading(false);
      });
    const { data: listener } = onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error };
} 