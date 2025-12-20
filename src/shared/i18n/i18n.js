import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import ta from './locales/ta.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import bn from './locales/bn.json';
import gu from './locales/gu.json';
import pa from './locales/pa.json';
import mr from './locales/mr.json';

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      hi: { translation: hi },
      te: { translation: te },
      ta: { translation: ta },
      kn: { translation: kn },
      ml: { translation: ml },
      bn: { translation: bn },
      gu: { translation: gu },
      pa: { translation: pa },
      mr: { translation: mr }
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
  return [
    'English', 'Spanish', 'Hindi', 'French', 'German', 'Japanese',
    'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Gujarati', 'Punjabi', 'Marathi'
  ];
};

// Language code mapping
export const getLanguageCode = (languageName) => {
  const mapping = {
    'English': 'en',
    'Spanish': 'es',
    'Hindi': 'hi',
    'French': 'fr',
    'German': 'de',
    'Japanese': 'ja',
    'Telugu': 'te',
    'Tamil': 'ta',
    'Kannada': 'kn',
    'Malayalam': 'ml',
    'Bengali': 'bn',
    'Gujarati': 'gu',
    'Punjabi': 'pa',
    'Marathi': 'mr'
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
    'ja': 'Japanese',
    'te': 'Telugu',
    'ta': 'Tamil',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'bn': 'Bengali',
    'gu': 'Gujarati',
    'pa': 'Punjabi',
    'mr': 'Marathi'
  };
  return mapping[code] || 'English';
};
