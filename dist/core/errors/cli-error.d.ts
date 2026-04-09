/**
 * Custom CLI Error classes
 */
import type { ErrorCode } from '../../constants/error-codes';
export declare class CLIError extends Error {
    code: ErrorCode;
    hint?: string | undefined;
    details?: any | undefined;
    constructor(code: ErrorCode, message: string, hint?: string | undefined, details?: any | undefined);
}
export declare class AuthError extends CLIError {
    constructor(code: ErrorCode, message: string, hint?: string);
}
export declare class PermissionError extends CLIError {
    constructor(code: ErrorCode, message: string, hint?: string);
}
export declare class ValidationError extends CLIError {
    constructor(code: ErrorCode, message: string, hint?: string, details?: any);
}
export declare class BusinessError extends CLIError {
    constructor(code: ErrorCode, message: string, hint?: string);
}
//# sourceMappingURL=cli-error.d.ts.map