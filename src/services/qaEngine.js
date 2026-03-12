/**
 * Glossa CAT - Automatic QA Engine
 * Professional translation quality assurance system
 */

/**
 * Main QA check function
 * @param {string} sourceText - Source segment text
 * @param {string} targetText - Target segment text
 * @param {object} options - QA options (language, glossary, etc.)
 * @returns {array} Array of QA issues
 */
export const runQAChecks = (sourceText, targetText, options = {}) => {
    const issues = [];
    
    if (!sourceText || !targetText) {
        return issues;
    }
    
    // Run all QA checks
    issues.push(...checkEmptyTarget(sourceText, targetText));
    issues.push(...checkSourceCopied(sourceText, targetText));
    issues.push(...checkNumbers(sourceText, targetText));
    issues.push(...checkWhitespace(sourceText, targetText));
    issues.push(...checkPlaceholders(sourceText, targetText));
    issues.push(...checkTags(sourceText, targetText));
    issues.push(...checkURLs(sourceText, targetText));
    issues.push(...checkLength(sourceText, targetText, options));
    issues.push(...checkPunctuation(sourceText, targetText));
    issues.push(...checkCapitalization(sourceText, targetText));
    
    return issues;
};

/**
 * 1. Check for empty target
 */
const checkEmptyTarget = (source, target) => {
    const issues = [];
    
    if (!target || target.trim() === '') {
        issues.push({
            type: 'empty_target',
            severity: 'error',
            message: 'Target segment is empty',
            suggestion: 'Add translation',
            autoFixable: false,
            category: 'completeness'
        });
    }
    
    return issues;
};

/**
 * 2. Check if source was copied to target
 */
const checkSourceCopied = (source, target) => {
    const issues = [];
    
    if (source.trim() === target.trim() && source.length > 3) {
        issues.push({
            type: 'source_copied',
            severity: 'warning',
            message: 'Source text copied to target without translation',
            suggestion: 'Translate the text',
            autoFixable: false,
            category: 'completeness'
        });
    }
    
    return issues;
};

/**
 * 3. Check numbers match
 */
const checkNumbers = (source, target) => {
    const issues = [];
    
    // Extract numbers (including decimals, percentages, currency)
    const numberRegex = /\d+([.,]\d+)?%?/g;
    const sourceNumbers = (source.match(numberRegex) || []).map(n => n.replace(/,/g, ''));
    const targetNumbers = (target.match(numberRegex) || []).map(n => n.replace(/,/g, ''));
    
    // Check for missing numbers
    sourceNumbers.forEach(num => {
        if (!targetNumbers.includes(num)) {
            issues.push({
                type: 'missing_number',
                severity: 'error',
                message: `Missing number: ${num}`,
                suggestion: `Add "${num}" to target`,
                autoFixable: false,
                category: 'numbers',
                highlight: num
            });
        }
    });
    
    // Check for extra numbers
    targetNumbers.forEach(num => {
        if (!sourceNumbers.includes(num)) {
            issues.push({
                type: 'extra_number',
                severity: 'error',
                message: `Extra or incorrect number: ${num}`,
                suggestion: `Verify number "${num}" is correct`,
                autoFixable: false,
                category: 'numbers',
                highlight: num
            });
        }
    });
    
    return issues;
};

/**
 * 4. Check whitespace issues
 */
const checkWhitespace = (source, target) => {
    const issues = [];
    
    // Leading space
    if (target.startsWith(' ') && !source.startsWith(' ')) {
        issues.push({
            type: 'leading_space',
            severity: 'warning',
            message: 'Leading space detected',
            suggestion: 'Remove space at start',
            autoFixable: true,
            category: 'whitespace',
            fix: () => target.trimStart()
        });
    }
    
    // Trailing space
    if (target.endsWith(' ') && !source.endsWith(' ')) {
        issues.push({
            type: 'trailing_space',
            severity: 'warning',
            message: 'Trailing space detected',
            suggestion: 'Remove space at end',
            autoFixable: true,
            category: 'whitespace',
            fix: () => target.trimEnd()
        });
    }
    
    // Double spaces
    if (target.includes('  ')) {
        issues.push({
            type: 'double_space',
            severity: 'warning',
            message: 'Multiple consecutive spaces detected',
            suggestion: 'Replace with single space',
            autoFixable: true,
            category: 'whitespace',
            fix: () => target.replace(/\s{2,}/g, ' ')
        });
    }
    
    return issues;
};

/**
 * 5. Check placeholders/variables
 */
const checkPlaceholders = (source, target) => {
    const issues = [];
    
    // Match various placeholder formats: {var}, {{var}}, %s, $var, ${var}, [0], <var>, :var, #1
    const placeholderRegex = /\{[^}]+\}|\{\{[^}]+\}\}|%[sdfioxXeEgGcpn]|\$\{[^}]+\}|\$[a-zA-Z_][a-zA-Z0-9_]*|\[[0-9]+\]|<[a-zA-Z_][a-zA-Z0-9_]*>|:[a-zA-Z_][a-zA-Z0-9_]*|#[0-9]+/g;
    
    const sourcePlaceholders = source.match(placeholderRegex) || [];
    const targetPlaceholders = target.match(placeholderRegex) || [];
    
    // Check for missing placeholders
    sourcePlaceholders.forEach(placeholder => {
        if (!targetPlaceholders.includes(placeholder)) {
            issues.push({
                type: 'missing_placeholder',
                severity: 'error',
                message: `Missing placeholder: ${placeholder}`,
                suggestion: `Add "${placeholder}" to target`,
                autoFixable: false,
                category: 'placeholders',
                highlight: placeholder
            });
        }
    });
    
    // Check for extra placeholders
    targetPlaceholders.forEach(placeholder => {
        if (!sourcePlaceholders.includes(placeholder)) {
            issues.push({
                type: 'extra_placeholder',
                severity: 'error',
                message: `Extra placeholder: ${placeholder}`,
                suggestion: `Remove "${placeholder}" or verify it's correct`,
                autoFixable: false,
                category: 'placeholders',
                highlight: placeholder
            });
        }
    });
    
    return issues;
};

/**
 * 6. Check HTML/XML tags
 */
const checkTags = (source, target) => {
    const issues = [];
    
    // Match HTML/XML tags
    const tagRegex = /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s+[a-zA-Z][a-zA-Z0-9-]*(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>/g;
    
    const sourceTags = source.match(tagRegex) || [];
    const targetTags = target.match(tagRegex) || [];
    
    // Check for missing tags
    sourceTags.forEach(tag => {
        if (!targetTags.includes(tag)) {
            issues.push({
                type: 'missing_tag',
                severity: 'error',
                message: `Missing tag: ${tag}`,
                suggestion: `Add "${tag}" to target`,
                autoFixable: false,
                category: 'tags',
                highlight: tag
            });
        }
    });
    
    // Check for extra tags
    targetTags.forEach(tag => {
        if (!sourceTags.includes(tag)) {
            issues.push({
                type: 'extra_tag',
                severity: 'error',
                message: `Extra tag: ${tag}`,
                suggestion: `Remove "${tag}" or verify it's correct`,
                autoFixable: false,
                category: 'tags',
                highlight: tag
            });
        }
    });
    
    return issues;
};

/**
 * 7. Check URLs and emails
 */
const checkURLs = (source, target) => {
    const issues = [];
    
    // Match URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const sourceURLs = source.match(urlRegex) || [];
    const targetURLs = target.match(urlRegex) || [];
    
    // Check for modified URLs
    sourceURLs.forEach(url => {
        if (!targetURLs.includes(url)) {
            issues.push({
                type: 'url_modified',
                severity: 'error',
                message: `URL modified or missing: ${url}`,
                suggestion: `Verify URL is correct`,
                autoFixable: false,
                category: 'urls',
                highlight: url
            });
        }
    });
    
    // Match emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const sourceEmails = source.match(emailRegex) || [];
    const targetEmails = target.match(emailRegex) || [];
    
    // Check for modified emails
    sourceEmails.forEach(email => {
        if (!targetEmails.includes(email)) {
            issues.push({
                type: 'email_modified',
                severity: 'error',
                message: `Email modified or missing: ${email}`,
                suggestion: `Verify email is correct`,
                autoFixable: false,
                category: 'urls',
                highlight: email
            });
        }
    });
    
    return issues;
};

/**
 * 8. Check target length
 */
const checkLength = (source, target, options = {}) => {
    const issues = [];
    
    const maxLength = options.maxLength || 1000;
    const warnThreshold = options.warnThreshold || 0.8;
    
    // Check if target exceeds max length
    if (target.length > maxLength) {
        issues.push({
            type: 'target_too_long',
            severity: 'error',
            message: `Target exceeds maximum length (${target.length}/${maxLength} characters)`,
            suggestion: 'Shorten translation',
            autoFixable: false,
            category: 'length'
        });
    } else if (target.length > maxLength * warnThreshold) {
        issues.push({
            type: 'target_approaching_limit',
            severity: 'warning',
            message: `Target approaching length limit (${target.length}/${maxLength} characters)`,
            suggestion: 'Consider shortening',
            autoFixable: false,
            category: 'length'
        });
    }
    
    // Check if target is significantly shorter (might be incomplete)
    if (target.length < source.length * 0.3 && source.length > 20) {
        issues.push({
            type: 'target_too_short',
            severity: 'info',
            message: 'Target is significantly shorter than source',
            suggestion: 'Verify translation is complete',
            autoFixable: false,
            category: 'length'
        });
    }
    
    return issues;
};

/**
 * 9. Check punctuation
 */
const checkPunctuation = (source, target) => {
    const issues = [];
    
    // Check for sentence-ending punctuation
    const sourceEndsWithPunctuation = /[.!?]$/.test(source.trim());
    const targetEndsWithPunctuation = /[.!?؟]$/.test(target.trim());
    
    if (sourceEndsWithPunctuation && !targetEndsWithPunctuation) {
        issues.push({
            type: 'missing_punctuation',
            severity: 'warning',
            message: 'Missing sentence-ending punctuation',
            suggestion: 'Add period, exclamation mark, or question mark',
            autoFixable: false,
            category: 'punctuation'
        });
    }
    
    return issues;
};

/**
 * 10. Check capitalization
 */
const checkCapitalization = (source, target) => {
    const issues = [];
    
    // Check if source starts with capital letter
    const sourceStartsWithCapital = /^[A-Z]/.test(source.trim());
    const targetStartsWithCapital = /^[A-Z]/.test(target.trim());
    
    if (sourceStartsWithCapital && !targetStartsWithCapital && /^[a-z]/.test(target.trim())) {
        issues.push({
            type: 'capitalization_error',
            severity: 'warning',
            message: 'Sentence should start with capital letter',
            suggestion: 'Capitalize first letter',
            autoFixable: true,
            category: 'capitalization',
            fix: () => target.charAt(0).toUpperCase() + target.slice(1)
        });
    }
    
    return issues;
};

/**
 * Get QA summary statistics
 */
export const getQASummary = (issues) => {
    const summary = {
        total: issues.length,
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        info: issues.filter(i => i.severity === 'info').length,
        autoFixable: issues.filter(i => i.autoFixable).length,
        byCategory: {}
    };
    
    // Group by category
    issues.forEach(issue => {
        if (!summary.byCategory[issue.category]) {
            summary.byCategory[issue.category] = 0;
        }
        summary.byCategory[issue.category]++;
    });
    
    return summary;
};

/**
 * Auto-fix all fixable issues
 */
export const autoFixIssues = (targetText, issues) => {
    let fixed = targetText;
    
    issues.forEach(issue => {
        if (issue.autoFixable && issue.fix) {
            fixed = issue.fix();
        }
    });
    
    return fixed;
};

/**
 * Get severity color
 */
export const getSeverityColor = (severity) => {
    switch (severity) {
        case 'error': return '#ef4444';
        case 'warning': return '#f59e0b';
        case 'info': return '#3b82f6';
        default: return '#6b7280';
    }
};

/**
 * Get severity icon
 */
export const getSeverityIcon = (severity) => {
    switch (severity) {
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        default: return '•';
    }
};
