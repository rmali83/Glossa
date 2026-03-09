// Language text direction mapping
// RTL (Right-to-Left) languages and LTR (Left-to-Right) languages

export const RTL_LANGUAGES = [
  // Arabic languages
  'Arabic',
  'Arabic (Egyptian)',
  'Arabic (Gulf)',
  'Arabic (Levantine)',
  'Arabic (Maghrebi)',
  
  // Hebrew
  'Hebrew',
  
  // Persian/Farsi
  'Persian (Farsi)',
  'Dari',
  
  // Urdu
  'Urdu',
  
  // Pashto
  'Pashto',
  
  // Kurdish (Sorani)
  'Kurdish',
  'Kurdish (Sorani)',
  
  // Yiddish
  'Yiddish',
  
  // Sindhi
  'Sindhi',
  
  // Dhivehi/Maldivian
  'Dhivehi'
];

export const LTR_LANGUAGES = [
  // All other languages are LTR by default
  // This includes: English, Spanish, French, German, Chinese, Japanese, etc.
];

/**
 * Check if a language uses RTL (Right-to-Left) text direction
 * @param {string} language - Language name
 * @returns {boolean} True if RTL, false if LTR
 */
export function isRTL(language) {
  if (!language) return false;
  
  // Check if language is in RTL list (case-insensitive)
  return RTL_LANGUAGES.some(rtlLang => 
    language.toLowerCase().includes(rtlLang.toLowerCase()) ||
    rtlLang.toLowerCase().includes(language.toLowerCase())
  );
}

/**
 * Get text direction for a language
 * @param {string} language - Language name
 * @returns {string} 'rtl' or 'ltr'
 */
export function getTextDirection(language) {
  return isRTL(language) ? 'rtl' : 'ltr';
}

/**
 * Get text alignment for a language
 * @param {string} language - Language name
 * @returns {string} 'right' or 'left'
 */
export function getTextAlign(language) {
  return isRTL(language) ? 'right' : 'left';
}

export default {
  RTL_LANGUAGES,
  LTR_LANGUAGES,
  isRTL,
  getTextDirection,
  getTextAlign
};
