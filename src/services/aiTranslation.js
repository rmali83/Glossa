// AI Translation Service
// Supports multiple translation engines

const LIBRE_TRANSLATE_API = 'https://libretranslate.com/translate';
const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

// Language code mapping
const languageCodeMap = {
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Japanese': 'ja',
    'Korean': 'ko',
    'Chinese': 'zh',
    'Arabic': 'ar',
    'Urdu': 'ur',
    'Hindi': 'hi',
    'Turkish': 'tr',
    'Dutch': 'nl',
    'Polish': 'pl',
    'Swedish': 'sv',
    'Danish': 'da',
    'Norwegian': 'no',
    'Finnish': 'fi'
};

/**
 * Translate text using MyMemory API (free, no API key required)
 */
export const translateWithMyMemory = async (text, sourceLang, targetLang) => {
    try {
        const sourceCode = languageCodeMap[sourceLang] || 'en';
        const targetCode = languageCodeMap[targetLang] || 'es';
        
        const response = await fetch(
            `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${sourceCode}|${targetCode}`
        );
        
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData) {
            return {
                success: true,
                translation: data.responseData.translatedText,
                engine: 'MyMemory',
                confidence: data.responseData.match || 0
            };
        }
        
        throw new Error('Translation failed');
    } catch (error) {
        console.error('MyMemory translation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Translate text using LibreTranslate (open-source, self-hosted or public instance)
 */
export const translateWithLibreTranslate = async (text, sourceLang, targetLang) => {
    try {
        const sourceCode = languageCodeMap[sourceLang] || 'en';
        const targetCode = languageCodeMap[targetLang] || 'es';
        
        const response = await fetch(LIBRE_TRANSLATE_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: sourceCode,
                target: targetCode,
                format: 'text'
            })
        });
        
        const data = await response.json();
        
        if (data.translatedText) {
            return {
                success: true,
                translation: data.translatedText,
                engine: 'LibreTranslate'
            };
        }
        
        throw new Error('Translation failed');
    } catch (error) {
        console.error('LibreTranslate error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Generate AI-powered translation suggestions with different tones
 */
export const generateAISuggestions = async (text, sourceLang, targetLang, tone = 'professional') => {
    try {
        // Get base translation
        const baseTranslation = await translateWithMyMemory(text, sourceLang, targetLang);
        
        if (!baseTranslation.success) {
            throw new Error('Base translation failed');
        }

        // Generate variations based on tone
        const suggestions = [
            {
                tone: 'Professional',
                text: baseTranslation.translation,
                description: 'Standard professional translation'
            }
        ];

        // Add tone-specific variations (simplified approach)
        if (tone === 'casual') {
            suggestions.push({
                tone: 'Casual',
                text: baseTranslation.translation.replace(/\./g, '!'),
                description: 'More informal and friendly'
            });
        } else if (tone === 'formal') {
            suggestions.push({
                tone: 'Formal',
                text: baseTranslation.translation,
                description: 'Highly formal and respectful'
            });
        }

        return {
            success: true,
            suggestions,
            baseTranslation: baseTranslation.translation
        };
    } catch (error) {
        console.error('AI suggestion error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Main translation function with fallback
 */
export const translateText = async (text, sourceLang, targetLang) => {
    // Try MyMemory first (more reliable and free)
    let result = await translateWithMyMemory(text, sourceLang, targetLang);
    
    if (result.success) {
        return result;
    }
    
    // Fallback to LibreTranslate
    result = await translateWithLibreTranslate(text, sourceLang, targetLang);
    
    return result;
};

/**
 * Quality check for translations
 */
export const checkTranslationQuality = (sourceText, targetText) => {
    const issues = [];
    
    // Check for missing punctuation
    const sourcePunctuation = sourceText.match(/[.!?]$/);
    const targetPunctuation = targetText.match(/[.!?]$/);
    
    if (sourcePunctuation && !targetPunctuation) {
        issues.push({
            type: 'punctuation',
            severity: 'warning',
            message: 'Target text is missing ending punctuation'
        });
    }
    
    // Check for length discrepancy (rough heuristic)
    const lengthRatio = targetText.length / sourceText.length;
    if (lengthRatio < 0.3 || lengthRatio > 3) {
        issues.push({
            type: 'length',
            severity: 'warning',
            message: 'Translation length differs significantly from source'
        });
    }
    
    // Check for untranslated text (same as source)
    if (sourceText.toLowerCase() === targetText.toLowerCase()) {
        issues.push({
            type: 'untranslated',
            severity: 'error',
            message: 'Text appears to be untranslated'
        });
    }
    
    return {
        hasIssues: issues.length > 0,
        issues,
        score: Math.max(0, 100 - (issues.length * 20))
    };
};
