import { create } from 'zustand';
import { supabase } from '../supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
  checkSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      set({ session: data.session, user: data.session?.user ?? null, loading: false });
    } catch (error) {
      console.error('Error checking session:', error);
      set({ user: null, session: null, loading: false });
    }
  }
}));

// Initialize the store and listen for auth state changes
const initializeAuth = async () => {
  await useAuthStore.getState().checkSession();

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
    useAuthStore.getState().setUser(session?.user ?? null);
  });
};

initializeAuth();
