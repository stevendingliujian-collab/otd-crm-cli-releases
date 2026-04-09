"use strict";
/**
 * Custom CLI Error classes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessError = exports.ValidationError = exports.PermissionError = exports.AuthError = exports.CLIError = void 0;
class CLIError extends Error {
    code;
    hint;
    details;
    constructor(code, message, hint, details) {
        super(message);
        this.code = code;
        this.hint = hint;
        this.details = details;
        this.name = 'CLIError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CLIError = CLIError;
class AuthError extends CLIError {
    constructor(code, message, hint) {
        super(code, message, hint);
        this.name = 'AuthError';
    }
}
exports.AuthError = AuthError;
class PermissionError extends CLIError {
    constructor(code, message, hint) {
        super(code, message, hint);
        this.name = 'PermissionError';
    }
}
exports.PermissionError = PermissionError;
class ValidationError extends CLIError {
    constructor(code, message, hint, details) {
        super(code, message, hint, details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class BusinessError extends CLIError {
    constructor(code, message, hint) {
        super(code, message, hint);
        this.name = 'BusinessError';
    }
}
exports.BusinessError = BusinessError;
//# sourceMappingURL=cli-error.js.map