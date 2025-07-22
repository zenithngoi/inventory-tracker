import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { isSupabaseAvailable } from './use-local-storage-fallback';

export const USER_ROLES = {
  FRANCHISOR_ADMIN: 'franchisor_admin',
  FRANCHISOR_STAFF: 'franchisor_staff',
  FRANCHISEE_OWNER: 'franchisee_owner',
  FRANCHISEE_STAFF: 'franchisee_staff',
};

export type UserProfile = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  franchise_id?: string;
  created_at: string;
  updated_at: string;
};

export type AppUser = {
  id: string;
  email: string;
  created_at: string;
};

export type AuthResponse = {
  data: {
    user: AppUser | null;
  };
  error: Error | null;
};

export type FranchiseLocation = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  is_active: boolean;
};

type AuthContextType = {
  user: AppUser | null;
  profile: UserProfile | null;
  isFranchisor: boolean;
  isAdmin: boolean;
  loading: boolean;
  franchises: FranchiseLocation[];
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock franchise locations for demo purposes
const MOCK_FRANCHISES: FranchiseLocation[] = [
  {
    id: "franchise-001",
    name: "Downtown Main Store",
    address: "123 Main St",
    city: "San Francisco",
    state: "CA",
    postal_code: "94105",
    country: "USA",
    phone: "415-555-1234",
    email: "downtown@example.com",
    is_active: true,
  },
  {
    id: "franchise-002",
    name: "Westside Branch",
    address: "456 Ocean Ave",
    city: "San Francisco",
    state: "CA",
    postal_code: "94122",
    country: "USA",
    phone: "415-555-5678",
    email: "westside@example.com",
    is_active: true,
  },
  {
    id: "franchise-003",
    name: "East Bay Location",
    address: "789 Broadway",
    city: "Oakland",
    state: "CA",
    postal_code: "94611",
    country: "USA",
    phone: "510-555-9012",
    email: "eastbay@example.com",
    is_active: true,
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const supabaseEnabled = isSupabaseAvailable();
  const [franchises] = useState<FranchiseLocation[]>(MOCK_FRANCHISES);

  // Check if user is from franchisor organization
  const isFranchisor = Boolean(
    profile?.role === USER_ROLES.FRANCHISOR_ADMIN ||
    profile?.role === USER_ROLES.FRANCHISOR_STAFF
  );

  // Check if user is an admin
  const isAdmin = Boolean(
    profile?.role === USER_ROLES.FRANCHISOR_ADMIN ||
    profile?.role === USER_ROLES.FRANCHISEE_OWNER
  );

  useEffect(() => {
    const initializeAuth = () => {
      setLoading(true);
      try {
        // Get saved user from localStorage
        const savedUser = localStorage.getItem('auth_user');
        const savedProfile = localStorage.getItem('auth_profile');
        
        if (savedUser && savedProfile) {
          setUser(JSON.parse(savedUser));
          setProfile(JSON.parse(savedProfile));
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    // If Supabase is enabled, don't initialize local auth
    if (!supabaseEnabled) {
      initializeAuth();
    } else {
      setLoading(false);
    }
  }, [supabaseEnabled]);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    // In a real app, we would verify credentials against a database
    try {
      // For demo, we'll check localStorage for matching user
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === email);
      
      if (!user || user.password !== password) {
        return {
          data: { user: null },
          error: new Error('Invalid login credentials'),
        };
      }
      
      // Get the user's profile
      const profiles = JSON.parse(localStorage.getItem('user_profiles') || '[]');
      const profile = profiles.find((p: UserProfile) => p.user_id === user.id);
      
      if (!profile) {
        return {
          data: { user: null },
          error: new Error('User profile not found'),
        };
      }
      
      // Store in state and localStorage
      const appUser = {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      };
      
      setUser(appUser);
      setProfile(profile);
      localStorage.setItem('auth_user', JSON.stringify(appUser));
      localStorage.setItem('auth_profile', JSON.stringify(profile));
      
      toast({
        title: "Signed in successfully",
        description: `Welcome back, ${profile.full_name || email}!`,
      });
      
      return {
        data: { user: appUser },
        error: null,
      };
    } catch (error) {
      console.error('Error signing in:', error);
      return {
        data: { user: null },
        error: error instanceof Error ? error : new Error('An unknown error occurred'),
      };
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>): Promise<AuthResponse> => {
    try {
      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      if (users.some((u: any) => u.email === email)) {
        return {
          data: { user: null },
          error: new Error('User with this email already exists'),
        };
      }

      // Create new user
      const userId = uuidv4();
      const timestamp = new Date().toISOString();
      
      const newUser = {
        id: userId,
        email,
        password, // In a real app, we would hash this password
        created_at: timestamp,
      };
      
      // Create profile
      const profileId = uuidv4();
      const newProfile: UserProfile = {
        id: profileId,
        user_id: userId,
        full_name: userData.full_name || '',
        email: email,
        phone: userData.phone || undefined,
        role: userData.role || USER_ROLES.FRANCHISEE_STAFF,
        franchise_id: userData.franchise_id || undefined,
        created_at: timestamp,
        updated_at: timestamp,
      };
      
      // Save to localStorage
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      const profiles = JSON.parse(localStorage.getItem('user_profiles') || '[]');
      profiles.push(newProfile);
      localStorage.setItem('user_profiles', JSON.stringify(profiles));
      
      // Auto sign-in after registration
      const appUser = {
        id: userId,
        email,
        created_at: timestamp
      };
      
      setUser(appUser);
      setProfile(newProfile);
      localStorage.setItem('auth_user', JSON.stringify(appUser));
      localStorage.setItem('auth_profile', JSON.stringify(newProfile));
      
      toast({
        title: "Account created successfully",
        description: `Welcome, ${newProfile.full_name || email}!`,
      });
      
      return {
        data: { user: appUser },
        error: null,
      };
    } catch (error) {
      console.error('Error signing up:', error);
      return {
        data: { user: null },
        error: error instanceof Error ? error : new Error('An unknown error occurred'),
      };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_profile');
    setUser(null);
    setProfile(null);
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile | null> => {
    if (!user?.id || !profile?.id) return null;

    try {
      const profiles = JSON.parse(localStorage.getItem('user_profiles') || '[]');
      const index = profiles.findIndex((p: UserProfile) => p.user_id === user.id);
      
      if (index === -1) {
        throw new Error('Profile not found');
      }
      
      const updatedProfile = {
        ...profiles[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      
      profiles[index] = updatedProfile;
      localStorage.setItem('user_profiles', JSON.stringify(profiles));
      localStorage.setItem('auth_profile', JSON.stringify(updatedProfile));
      
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  };

  const value = {
    user,
    profile,
    isFranchisor,
    isAdmin,
    loading,
    franchises,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthLocal = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthLocal must be used within an AuthProvider');
  }
  return context;
};