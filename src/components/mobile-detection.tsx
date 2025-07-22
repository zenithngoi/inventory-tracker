import { useEffect, useState } from 'react';

interface MobileDetectionProps {
  children: React.ReactNode;
  mobileContent?: React.ReactNode;
}

export function MobileDetection({ children, mobileContent }: MobileDetectionProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if it's a mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
      
      // Check if app is in standalone mode (PWA installed)
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone || 
        document.referrer.includes('android-app://');
      
      setIsStandalone(isInStandaloneMode);
    };

    checkMobile();
    
    // Re-check when orientation changes
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // If it's a mobile device and we have mobile-specific content, show that
  if (isMobile && mobileContent) {
    return (
      <>
        {mobileContent}
        {isStandalone ? null : (
          <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground text-center py-2 px-4 text-sm">
            <p>
              Add this app to your home screen for better experience!
              <button className="ml-2 underline font-semibold">
                Learn how
              </button>
            </p>
          </div>
        )}
      </>
    );
  }

  // Otherwise, render the regular content
  return <>{children}</>;
}