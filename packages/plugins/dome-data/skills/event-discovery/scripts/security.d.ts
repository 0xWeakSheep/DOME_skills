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
export declare function sanitizeString(content: unknown, maxLength?: number): string | null;
/**
 * Sanitize array of strings
 */
export declare function sanitizeStringArray(items: string[] | null | undefined, maxLength?: number): string[];
/**
 * Sanitize event data object
 *
 * Applies sanitization to all user-generated text fields
 * while preserving numeric and identifier fields
 */
export declare function sanitizeEventData<T extends Record<string, unknown>>(data: T): T;
/**
 * Validate that content doesn't contain obvious injection attempts
 *
 * @param content Content to validate
 * @returns Object with validation result and reason if invalid
 */
export declare function validateContent(content: string): {
    valid: boolean;
    reason?: string;
};
/**
 * Security wrapper for API responses
 *
 * Logs and filters suspicious content while allowing
 * normal operation to continue
 */
export declare function secureProcess<T>(data: T, processor: (data: T) => T): T;
//# sourceMappingURL=security.d.ts.map