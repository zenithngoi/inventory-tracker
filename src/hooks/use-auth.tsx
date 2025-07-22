import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, setupRealtimeSubscriptions, isSupabaseConfigured } from '@/lib/supabase';
import { z } from 'zod';
import { toast } from 'sonner';

// Updated schema to include full name and phone number with region code
const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name is required').optional(),
  phone: z.string().optional(),
  region_code: z.string().optional(),
});

export type AuthFormData = z.infer<typeof authSchema>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isSupabaseEnabled: boolean;
  signIn: (data: Pick<AuthFormData, 'email' | 'password'>) => Promise<{ error: any }>;
  signUp: (data: AuthFormData) => Promise<{ error: any, user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (data: { full_name?: string, phone?: string, region_code?: string, avatar_url?: string }) => Promise<{ error: any }>;
  resendVerificationEmail: (email: string) => Promise<{ error: any }>;
  isEmailVerified: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useProvideAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseEnabled, setIsSupabaseEnabled] = useState(false);
  const [subscriptions, setSubscriptions] = useState<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    // Check if Supabase is configured
    const configured = isSupabaseConfigured();
    setIsSupabaseEnabled(configured);

    // If not configured, set a mock user for development and don't show error
    if (!configured) {
      // Create a mock user for development when Supabase is not configured
      const mockUser = {
        id: 'mock-user-id',
        email: 'dev@example.com',
        user_metadata: {
          full_name: 'Development User',
          isAdmin: true,
        },
        email_confirmed_at: new Date().toISOString(),
      } as User;
      
      setUser(mockUser);
      setSession({ user: mockUser } as Session);
      setIsLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);

        if (data.session?.user) {
          setupUserSubscriptions(data.session.user.id);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setupUserSubscriptions(session.user.id);
      } else if (subscriptions) {
        subscriptions.unsubscribe();
        setSubscriptions(null);
      }
    });

    return () => {
      data.subscription.unsubscribe();
      if (subscriptions) {
        subscriptions.unsubscribe();
      }
    };
  }, []);

  const setupUserSubscriptions = (userId: string) => {
    if (subscriptions) {
      subscriptions.unsubscribe();
    }
    const subs = setupRealtimeSubscriptions(userId);
    setSubscriptions(subs);
  };

  const signIn = async ({ email, password }: Pick<AuthFormData, 'email' | 'password'>) => {
    try {
      if (!isSupabaseEnabled) {
        toast.error("Cloud storage is not configured. Please connect to Supabase.");
        return { error: { message: "Cloud storage is not configured" } };
      }
      
      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return { error };
      }
      
      // Check if email is verified
      if (data.user && !data.user.email_confirmed_at && data.user.confirmation_sent_at) {
        toast.warning("Please verify your email address to fully access your account.");
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (data: AuthFormData) => {
    const { email, password, full_name, phone, region_code } = data;
    try {
      if (!isSupabaseEnabled) {
        toast.error("Cloud storage is not configured. Please connect to Supabase.");
        return { error: { message: "Cloud storage is not configured" }, user: null };
      }
      
      // Format the phone number with region code if provided
      const formattedPhone = phone && region_code ? `${region_code}${phone}` : phone;
      
      // Use Supabase authentication with email confirmation
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: {
          data: {
            full_name: full_name || '',
            phone: formattedPhone || '',
            region_code: region_code || '',
            isAdmin: false,
          },
          emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      });
      
      if (error) {
        return { error, user: null };
      }
      
      return { error: null, user: data.user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error, user: null };
    }
  };

  const signOut = async () => {
    try {
      if (!isSupabaseEnabled) {
        toast.error("Cloud storage is not configured. Please connect to Supabase.");
        return;
      }
      
      // Use Supabase authentication
      await supabase.auth.signOut();
      
      // Supabase's onAuthStateChange will handle updating the user state
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (!isSupabaseEnabled) {
        toast.error("Cloud storage is not configured. Please connect to Supabase.");
        return { error: { message: "Cloud storage is not configured" } };
      }
      
      // Use Supabase authentication
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (!error) {
        toast.success('Password reset email sent. Check your inbox.');
      }
      
      return { error };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error };
    }
  };

  const updateProfile = async (data: { full_name?: string, phone?: string, region_code?: string, avatar_url?: string }) => {
    try {
      if (!isSupabaseEnabled || !user) {
        toast.error("Cloud storage is not configured or user not logged in.");
        return { error: { message: "Cloud storage is not configured" } };
      }
      
      // Format phone with region code if both are provided
      const updatedData = { ...data };
      if (data.phone && data.region_code) {
        updatedData.phone = `${data.region_code}${data.phone}`;
      }
      
      // Use Supabase authentication
      const { error } = await supabase.auth.updateUser({
        data: updatedData
      });
      
      return { error };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  };

  // Check if email is verified
  const isEmailVerified = () => {
    return user?.email_confirmed_at != null;
  };

  // Resend verification email
  const resendVerificationEmail = async (email: string) => {
    try {
      if (!isSupabaseEnabled) {
        toast.error("Cloud storage is not configured. Please connect to Supabase.");
        return { error: { message: "Cloud storage is not configured" } };
      }
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      });
      
      if (!error) {
        toast.success('Verification email sent. Please check your inbox.');
      }
      
      return { error };
    } catch (error) {
      console.error('Resend verification email error:', error);
      return { error };
    }
  };

  return {
    user,
    session,
    isLoading,
    isSupabaseEnabled,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    resendVerificationEmail,
    isEmailVerified,
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};