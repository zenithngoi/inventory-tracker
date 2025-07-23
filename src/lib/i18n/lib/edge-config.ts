import { createClient } from '@vercel/edge-config';
import { toast } from 'sonner';
import { Locale } from './i18n/translations';
import { nanoid } from 'nanoid';

// Initialize the Edge Config client with token from environment variable
// This token MUST be configured in your Vercel project environment variables
let edgeConfigClient: ReturnType<typeof createClient>;

try {
  const token = import.meta.env.VITE_EDGE_CONFIG_TOKEN;
  if (!token) {
    console.error('VITE_EDGE_CONFIG_TOKEN not found in environment variables');
    toast.error('Edge Config token missing', { 
      description: 'Language preferences cannot be saved without a valid Edge Config token'
    });
    throw new Error('Edge Config token is required');
  }
  
  edgeConfigClient = createClient({
    token: token,
  });
  
  console.log('Edge Config client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Edge Config client:', error);
  toast.error('Failed to initialize Edge Config');
  throw new Error('Edge Config initialization failed');
}

// Always return true since we require Edge Config to work
// The app will throw an error during initialization if Edge Config isn't available
export const isEdgeConfigAvailable = () => {
  return true;
};

// Get the visitor ID from Edge Config or create a new one
export async function getOrCreateVisitorId(): Promise<string | null> {
  if (!isEdgeConfigAvailable()) {
    toast.error('Edge Config is not available. Please check your configuration.');
    return null;
  }

  try {
    // Use session ID to manage visitor ID
    const sessionKey = 'current-session-id';
    
    // Try to get existing session ID
    let sessionId = await edgeConfigClient!.get(sessionKey) as string | undefined;
    
    // If no session ID exists, create one and store it
    if (!sessionId) {
      sessionId = `visitor-${nanoid()}`;
      await edgeConfigClient!.set(sessionKey, sessionId);
    }
    
    return sessionId;
  } catch (error) {
    console.error('Failed to manage visitor ID in Edge Config:', error);
    toast.error('Could not manage user session. Please try again later.');
    return null;
  }
}

// Helper function to generate a consistent user key
export const getUserKey = async (userId?: string | null): Promise<string | null> => {
  if (userId) {
    return `user_${userId}`;
  }
  
  // For anonymous users, use visitor ID from Edge Config
  const visitorId = await getOrCreateVisitorId();
  if (!visitorId) {
    return null;
  }
  
  return `anon_${visitorId}`;
};

// Get user preference from Edge Config
export async function getUserLanguagePreference(
  userId?: string | null
): Promise<Locale | null> {
  if (!isEdgeConfigAvailable()) {
    toast.error('Edge Config is not available. Please check your configuration.');
    return null;
  }

  try {
    const userKey = await getUserKey(userId);
    if (!userKey) {
      return null;
    }

    const language = await edgeConfigClient!.get(`preferences:${userKey}:language`) as Locale | undefined;
    return language || null;
  } catch (error) {
    console.error('Failed to get language preference from Edge Config:', error);
    toast.error('Failed to retrieve your language preference.');
    return null;
  }
}

// Set user preference in Edge Config
export async function setUserLanguagePreference(
  locale: Locale,
  userId?: string | null
): Promise<boolean> {
  if (!isEdgeConfigAvailable()) {
    toast.error('Edge Config is not available. Please check your configuration.');
    return false;
  }

  try {
    const userKey = await getUserKey(userId);
    if (!userKey) {
      return false;
    }

    await edgeConfigClient!.set(`preferences:${userKey}:language`, locale);
    return true;
  } catch (error) {
    console.error('Failed to save language preference to Edge Config:', error);
    toast.error('Failed to save your language preference.');
    return false;
  }
}
