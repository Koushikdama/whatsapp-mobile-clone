/**
 * TranslationService - Centralized service for message translation
 * 
 * This service provides API-based translation using the translate package
 * which works in browsers.
 * 
 * @module TranslationService
 */

import translate from 'translate';

// Configure translate package - it uses Google Translate by default
translate.engine = 'google';
translate.key = process.env.GOOGLE_API_KEY || undefined; // Optional API key

/**
 * Language code mapping
 */
const LANGUAGE_CODE_MAP = {
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

/**
 * Translates text using the translate package
 * 
 * @param {string} text - The text to translate
 * @param {string} targetLanguage - The target language name (e.g., 'Spanish', 'Telugu')
 * @returns {Promise<string>} The translated text
 */
export const translateText = async (text, targetLanguage) => {
  if (!text || !targetLanguage) {
    return text;
  }

  // Get language code
  const targetCode = LANGUAGE_CODE_MAP[targetLanguage];
  if (!targetCode) {
    return `[${targetLanguage}]: ${text}`;
  }

  try {
    // Use translate package
    const result = await translate(text, { to: targetCode, from: 'en' });
    return result;
  } catch (error) {
    console.warn('Translation failed:', error.message);
    return `[${targetLanguage}]: ${text}`;
  }
};

/**
 * Gets the list of supported languages for translation
 * 
 * @returns {string[]} Array of supported language names
 */
export const getSupportedTranslationLanguages = () => {
  return Object.keys(LANGUAGE_CODE_MAP);
};

/**
 * Checks if a language is supported for translation
 * 
 * @param {string} language - The language to check
 * @returns {boolean} True if supported, false otherwise
 */
export const isLanguageSupported = (language) => {
  return LANGUAGE_CODE_MAP.hasOwnProperty(language);
};

// Default export
export default {
  translateText,
  getSupportedTranslationLanguages,
  isLanguageSupported
};
