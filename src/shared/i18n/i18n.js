import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import hi from './locales/hi.json';

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      hi: { translation: hi }
    },
    fallbackLng: 'en', // Fallback language
    lng: 'en', // Default language
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    react: {
      useSuspense: false // Disable suspense for simplicity
    },
    
    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  });

export default i18n;

// Utility functions
export const changeLanguage = (lang) => {
  return i18n.changeLanguage(lang);
};

export const getCurrentLanguage = () => {
  return i18n.language;
};

export const  getSupportedLanguages = () => {
  return ['English', 'Spanish', 'Hindi', 'French', 'German', 'Japanese'];
};

// Language code mapping
export const getLanguageCode = (languageName) => {
  const mapping = {
    'English': 'en',
    'Spanish': 'es',
    'Hindi': 'hi',
    'French': 'fr',
    'German': 'de',
    'Japanese': 'ja'
  };
  return mapping[languageName] || 'en';
};

export const getLanguageName = (code) => {
  const mapping = {
    'en': 'English',
    'es': 'Spanish',
    'hi': 'Hindi',
    'fr': 'French',
    'de': 'German',
    'ja': 'Japanese'
  };
  return mapping[code] || 'English';
};
