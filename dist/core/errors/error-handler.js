"use strict";
/**
 * Error handler - maps HTTP errors to CLI errors
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ErrorHandler = void 0;
const axios_1 = __importDefault(require("axios"));
const cli_error_1 = require("./cli-error");
const error_codes_1 = require("../../constants/error-codes");
class ErrorHandler {
    handle(error) {
        // Already a CLIError
        if (error instanceof cli_error_1.CLIError) {
            return error;
        }
        // Axios error
        if (axios_1.default.isAxiosError(error)) {
            return this.handleAxiosError(error);
        }
        // Unknown error
        return new cli_error_1.CLIError(error_codes_1.ERROR_CODES.SYSTEM_500, error.message || 'Unknown error', error_codes_1.ERROR_HINTS[error_codes_1.ERROR_CODES.SYSTEM_500]);
    }
    handleAxiosError(error) {
        const statusCode = error.response?.status;
        const responseData = error.response?.data;
        // Detect HTML error response (common for 404/401 errors from ABP)
        if (typeof responseData === 'string' && responseData.trim().startsWith('<')) {
            // Extract error message from HTML if possible
            const match = responseData.match(/<h3>(.*?)<\/h3>/i) || responseData.match(/<body>(.*?)<\/body>/is);
            const htmlMessage = match ? match[1].replace(/<[^>]*>/g, '').trim() : 'Server returned HTML error page';
            const errorCode = error_codes_1.HTTP_TO_ERROR_CODE[statusCode] || error_codes_1.ERROR_CODES.SYSTEM_500;
            return new cli_error_1.CLIError(errorCode, htmlMessage, error_codes_1.ERROR_HINTS[errorCode] || 'Check server logs for details');
        }
        // Try to get error code from JSON response
        const errorCode = responseData?.error?.code || error_codes_1.HTTP_TO_ERROR_CODE[statusCode] || error_codes_1.ERROR_CODES.SYSTEM_500;
        const message = responseData?.error?.message || error.message;
        const hint = responseData?.error?.hint || error_codes_1.ERROR_HINTS[errorCode];
        return new cli_error_1.CLIError(errorCode, message, hint, responseData?.error?.details);
    }
    getHint(code) {
        return error_codes_1.ERROR_HINTS[code] || 'Unknown error';
    }
}
exports.ErrorHandler = ErrorHandler;
exports.errorHandler = new ErrorHandler();
//# sourceMappingURL=error-handler.js.map