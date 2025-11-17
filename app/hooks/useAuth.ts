/**
 * useAuth hook
 * 
 * Provides current user session and helper to get auth token
 */
import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

export const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
      setToken(session?.access_token || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUserId(session?.user?.id || null);
      setToken(session?.access_token || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { userId, token };
};

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
};
