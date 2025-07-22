import { createClient } from '@supabase/supabase-js';

// Use the environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

// Create and export the Supabase client with validation
export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are not configured. Using fallback client.');
    // Return a mock client that will throw descriptive errors
    return {
      auth: {
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: { message: 'Supabase not configured' } }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        resetPasswordForEmail: async () => ({ error: { message: 'Supabase not configured' } }),
        updateUser: async () => ({ error: { message: 'Supabase not configured' } }),
        resend: async () => ({ error: { message: 'Supabase not configured' } })
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => ({ data: null, error: { message: 'Supabase not configured' } })
      })
    };
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
})();

// Set up realtime subscriptions
export const setupRealtimeSubscriptions = (userId?: string) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, skipping realtime subscriptions');
    return {
      unsubscribe: () => {
        console.log('Mock unsubscribe for user:', userId);
      }
    };
  }
  
  // This function would be used to set up specific realtime subscriptions
  // We're returning a subscription object that can be unsubscribed from
  return {
    unsubscribe: () => {
      console.log('Unsubscribing from realtime updates for user:', userId);
    }
  };
};