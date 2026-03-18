/**
 * Security utilities for input sanitization
 *
 * This module provides functions to sanitize third-party content
 * and mitigate indirect prompt injection risks (Snyk W011).
 *
 * All sanitization is performed on data extraction, preserving
 * the original API response structure while removing potentially
 * harmful content patterns.
 */
/**
 * Patterns that could be used for prompt injection attacks
 */
const PROMPT_INJECTION_PATTERNS = [
    // Direct instruction patterns
    /ignore\s+(previous|above|all)\s+(instructions|prompts|commands)/gi,
    /forget\s+(everything|all|previous)/gi,
    /disregard\s+(the|all)\s+(above|instructions)/gi,
    /you\s+are\s+now/gi,
    /act\s+as\s+/gi,
    /system\s*:\s*/gi,
    /user\s*:\s*/gi,
    /assistant\s*:\s*/gi,
    // Role override attempts
    /from\s+now\s+on\s+you\s+are/gi,
    /your\s+new\s+role\s+is/gi,
    // Delimiter patterns
    /```\s*system/gi,
    /<\|im_start\|>/gi,
    /<\|system\|>/gi,
    /\[system\]/gi,
    // Suspicious markdown
    /!\[.*?\]\(javascript:/gi,
    /\[.*?\]\(data:/gi,
];
/**
 * Sanitize string content by removing prompt injection attempts
 *
 * This function:
 * 1. Removes known prompt injection patterns
 * 2. Normalizes whitespace
 * 3. Truncates to reasonable length
 * 4. Preserves legitimate content
 *
 * @param content Raw string from API
 * @param maxLength Maximum allowed length (default: 1000)
 * @returns Sanitized string safe for processing
 */
export function sanitizeString(content, maxLength = 1000) {
    if (content === null || content === undefined) {
        return null;
    }
    let sanitized = content;
    // Remove prompt injection patterns
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[filtered]');
    }
    // Normalize whitespace (prevent obfuscation)
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    // Truncate if too long
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength) + '...';
    }
    return sanitized;
}
/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(items, maxLength = 100) {
    if (!Array.isArray(items)) {
        return [];
    }
    return items
        .map(item => sanitizeString(item, maxLength))
        .filter((item) => item !== null && item.length > 0);
}
/**
 * Sanitize activity data object
 *
 * Applies sanitization to all user-generated text fields
 * while preserving numeric and identifier fields
 */
export function sanitizeActivityData(data) {
    const sanitized = { ...data };
    // Sanitize string fields that may contain user-generated content
    const stringFields = ['title', 'market_slug'];
    for (const field of stringFields) {
        if (typeof sanitized[field] === 'string') {
            sanitized[field] = sanitizeString(sanitized[field], field === 'title' ? 500 : 200);
        }
    }
    return sanitized;
}
/**
 * Validate that content doesn't contain obvious injection attempts
 *
 * @param content Content to validate
 * @returns Object with validation result and reason if invalid
 */
export function validateContent(content) {
    // Check for high-risk patterns
    const highRiskPatterns = [
        /ignore\s+previous\s+instructions/gi,
        /system\s+prompt/gi,
        /you\s+are\s+a\s+helpful\s+assistant/gi,
        /new\s+instructions?\s*:/gi,
    ];
    for (const pattern of highRiskPatterns) {
        if (pattern.test(content)) {
            return {
                valid: false,
                reason: 'Content contains potential prompt injection pattern',
            };
        }
    }
    // Check for excessive special characters (possible obfuscation)
    const specialCharRatio = (content.match(/[^a-zA-Z0-9\s]/g) || []).length / content.length;
    if (specialCharRatio > 0.3 && content.length > 50) {
        return {
            valid: false,
            reason: 'Content contains excessive special characters',
        };
    }
    return { valid: true };
}
/**
 * Security wrapper for API responses
 *
 * Logs and filters suspicious content while allowing
 * normal operation to continue
 */
export function secureProcess(data, processor) {
    try {
        const processed = processor(data);
        // Log if significant changes were made (for audit)
        if (JSON.stringify(data) !== JSON.stringify(processed)) {
            // In production, this would log to security monitoring
            // console.debug('[Security] Content sanitized during processing');
        }
        return processed;
    }
    catch (error) {
        // Fail secure - return original data if processing fails
        console.error('[Security] Sanitization error:', error);
        return data;
    }
}
//# sourceMappingURL=security.js.map