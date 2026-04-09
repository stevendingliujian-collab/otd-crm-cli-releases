"use strict";
/**
 * Error code constants
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_HINTS = exports.HTTP_TO_ERROR_CODE = exports.ERROR_CODES = void 0;
exports.ERROR_CODES = {
    // Authentication errors
    AUTH_401: 'AUTH_401',
    AUTH_401_EXPIRED: 'AUTH_401_EXPIRED',
    AUTH_401_INVALID: 'AUTH_401_INVALID',
    // Permission errors
    PERM_403: 'PERM_403',
    PERM_403_READONLY: 'PERM_403_READONLY',
    PERM_403_OWNER: 'PERM_403_OWNER',
    // Validation errors
    VALIDATION_422: 'VALIDATION_422',
    VALIDATION_422_REQUIRED: 'VALIDATION_422_REQUIRED',
    VALIDATION_422_FORMAT: 'VALIDATION_422_FORMAT',
    VALIDATION_422_RANGE: 'VALIDATION_422_RANGE',
    // Business errors
    BIZ_404: 'BIZ_404',
    BIZ_409: 'BIZ_409',
    BIZ_409_CONVERTED: 'BIZ_409_CONVERTED',
    BIZ_422: 'BIZ_422',
    BIZ_422_STATUS: 'BIZ_422_STATUS',
    // Rate limit errors
    RATE_429: 'RATE_429',
    RATE_429_DAILY: 'RATE_429_DAILY',
    // Upstream errors
    UPSTREAM_502: 'UPSTREAM_502',
    UPSTREAM_503: 'UPSTREAM_503',
    UPSTREAM_504: 'UPSTREAM_504',
    // System errors
    SYSTEM_500: 'SYSTEM_500',
    SYSTEM_500_CONFIG: 'SYSTEM_500_CONFIG',
    SYSTEM_500_NETWORK: 'SYSTEM_500_NETWORK',
};
exports.HTTP_TO_ERROR_CODE = {
    401: exports.ERROR_CODES.AUTH_401,
    403: exports.ERROR_CODES.PERM_403,
    404: exports.ERROR_CODES.BIZ_404,
    409: exports.ERROR_CODES.BIZ_409,
    422: exports.ERROR_CODES.VALIDATION_422,
    429: exports.ERROR_CODES.RATE_429,
    502: exports.ERROR_CODES.UPSTREAM_502,
    503: exports.ERROR_CODES.UPSTREAM_503,
    504: exports.ERROR_CODES.UPSTREAM_504,
    500: exports.ERROR_CODES.SYSTEM_500,
};
exports.ERROR_HINTS = {
    [exports.ERROR_CODES.AUTH_401]: "Run 'crm auth login' first",
    [exports.ERROR_CODES.AUTH_401_EXPIRED]: "Run 'crm auth login' again",
    [exports.ERROR_CODES.AUTH_401_INVALID]: "Run 'crm auth login' again",
    [exports.ERROR_CODES.PERM_403]: 'Request required scope or switch profile',
    [exports.ERROR_CODES.PERM_403_READONLY]: 'Contact admin for write access',
    [exports.ERROR_CODES.PERM_403_OWNER]: 'Assign to owner first',
    [exports.ERROR_CODES.VALIDATION_422]: 'Check parameter format',
    [exports.ERROR_CODES.VALIDATION_422_REQUIRED]: 'Add required parameter',
    [exports.ERROR_CODES.VALIDATION_422_FORMAT]: 'Check expected format',
    [exports.ERROR_CODES.VALIDATION_422_RANGE]: 'Check valid range',
    [exports.ERROR_CODES.BIZ_404]: 'Check resource ID',
    [exports.ERROR_CODES.BIZ_409]: 'Use --force to overwrite',
    [exports.ERROR_CODES.BIZ_409_CONVERTED]: 'Use customer ID directly',
    [exports.ERROR_CODES.BIZ_422]: 'Fix field first',
    [exports.ERROR_CODES.BIZ_422_STATUS]: 'Check valid transitions',
    [exports.ERROR_CODES.RATE_429]: 'Retry after specified time',
    [exports.ERROR_CODES.RATE_429_DAILY]: 'Retry tomorrow or upgrade plan',
    [exports.ERROR_CODES.UPSTREAM_502]: 'Retry in a moment',
    [exports.ERROR_CODES.UPSTREAM_503]: 'Check status page',
    [exports.ERROR_CODES.UPSTREAM_504]: 'Increase --timeout or retry',
    [exports.ERROR_CODES.SYSTEM_500]: 'Contact support with trace_id',
    [exports.ERROR_CODES.SYSTEM_500_CONFIG]: "Run 'crm config set'",
    [exports.ERROR_CODES.SYSTEM_500_NETWORK]: 'Check internet connection',
};
//# sourceMappingURL=error-codes.js.map