import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, en, zhCN, msMY } from './translations';
import { getUserLanguagePreference, setUserLanguagePreference, isEdgeConfigAvailable } from './lib/edge-config';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

type Translation = {
  [key: string]: string | Translation;
};

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  translations: Record<Locale, Translation>;
  isLanguagePersisted: boolean;
};

const translations: Record<Locale, Translation> = {
  'en': en,
  'zh-CN': zhCN,
  'ms-MY': msMY
};

// Get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  return keys.reduce((acc, key) => {
    return acc && acc[key] !== undefined ? acc[key] : undefined;
  }, obj) as string || path;
}

const defaultLocale = 'en';

const LanguageContext = createContext<LanguageContextType>({
  locale: defaultLocale as Locale,
  setLocale: () => {},
  t: (key: string) => key,
  translations,
  isLanguagePersisted: false
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id;
  
  // Track if we're using edge config
  const [isLanguagePersisted, setIsLanguagePersisted] = useState(false);
  
  // Default to English until we load from Edge Config
  const [locale, setLocaleState] = useState<Locale>(defaultLocale as Locale);

  // Log that we're using Edge Config on mount
  useEffect(() => {
    console.log('Language provider initialized with Edge Config');
    // No need to check isEdgeConfigAvailable since the app now requires Edge Config
  }, []);

  // Load language preference from Edge Config on initial load and when user changes
  useEffect(() => {
    const fetchLanguagePreference = async () => {
      try {
        console.log('Fetching language preference from Edge Config for user:', userId || 'anonymous');
        const preferredLanguage = await getUserLanguagePreference(userId);
        
        if (preferredLanguage) {
          console.log('Found language preference in Edge Config:', preferredLanguage);
          setLocaleState(preferredLanguage);
          setIsLanguagePersisted(true);
          document.documentElement.lang = preferredLanguage;
        } else {
          console.log('No language preference found in Edge Config, saving default to Edge Config');
          // If no preference found in Edge Config, save the default to Edge Config
          await setUserLanguagePreference(defaultLocale as Locale, userId);
          setLocaleState(defaultLocale as Locale);
          document.documentElement.lang = defaultLocale;
          setIsLanguagePersisted(true);
        }
      } catch (error) {
        console.error('Error fetching language preference from Edge Config:', error);
        toast.error('Could not retrieve your language preference from Edge Config');
        throw new Error('Edge Config is required for language preferences');
      }
    };

    fetchLanguagePreference();
  }, [userId]);

  const setLocale = async (newLocale: Locale) => {
    console.log('Setting language to', newLocale);
    
    try {
      // Save to Edge Config first (required)
      const success = await setUserLanguagePreference(newLocale, userId);
      
      if (!success) {
        toast.error('Failed to save your language preference to Edge Config');
        throw new Error('Edge Config save failed');
      }
      
      // Only update UI after successful Edge Config save
      setLocaleState(newLocale);
      document.documentElement.lang = newLocale;
      setIsLanguagePersisted(true);
      toast.success('Language preference saved to Edge Config');
      console.log('Language successfully changed to', newLocale);
    } catch (error) {
      console.error('Error setting language preference in Edge Config:', error);
      toast.error('Could not save your language preference to Edge Config');
      throw new Error('Edge Config is required for language preferences');
    }
  };

  const t = (key: string): string => {
    return getNestedValue(translations[locale], key) || getNestedValue(en, key) || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, translations, isLanguagePersisted }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
