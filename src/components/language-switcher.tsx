import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/i18n/context";
import { Locale } from "@/lib/i18n/translations";
import { Globe, Cloud, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function LanguageSwitcher() {
  const { locale, setLocale, translations, isLanguagePersisted } = useLanguage();
  console.log("LanguageSwitcher rendering with locale:", locale);
  console.log("Context available:", !!translations, "isLanguagePersisted:", isLanguagePersisted);

  const handleLanguageChange = async (selectedLocale: Locale) => {
    console.log("Changing language to:", selectedLocale);
    try {
      await setLocale(selectedLocale);
      console.log("Language change successful");
    } catch (error) {
      console.error("Language change failed:", error);
    }
  };
  
  // Get current language short code for display
  const getCurrentLanguageCode = () => {
    switch(locale) {
      case 'en': return 'EN';
      case 'zh-CN': return 'CN';
      case 'ms-MY': return 'MY';
      default: return 'EN';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="pl-2 pr-3 py-1 h-10 rounded-full border-2 border-blue-400 bg-white shadow-sm hover:bg-blue-50 flex items-center gap-1"
                >
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">{getCurrentLanguageCode()}</span>
                  <Cloud className="h-3 w-3 text-blue-600" />
                  <span className="sr-only">Toggle language</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {translations[locale].common.languageName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleLanguageChange("en")}
                  className={locale === "en" ? "bg-accent" : ""}
                >
                  <span className="mr-2">{locale === "en" ? "✓" : " "}</span>
                  {translations["en"].common.languageName}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleLanguageChange("zh-CN")}
                  className={locale === "zh-CN" ? "bg-accent" : ""}
                >
                  <span className="mr-2">{locale === "zh-CN" ? "✓" : " "}</span>
                  {translations["zh-CN"].common.languageName}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleLanguageChange("ms-MY")}
                  className={locale === "ms-MY" ? "bg-accent" : ""}
                >
                  <span className="mr-2">{locale === "ms-MY" ? "✓" : " "}</span>
                  {translations["ms-MY"].common.languageName}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-xs text-blue-600 flex items-center">
                  <Cloud className="h-3 w-3 mr-1" />
                  <span>Saved in Cloud (Edge Config)</span>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs">
            Your language preference is saved in Vercel Edge Config
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
