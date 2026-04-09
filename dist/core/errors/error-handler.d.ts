/**
 * Error handler - maps HTTP errors to CLI errors
 */
import { CLIError } from './cli-error';
import type { ErrorCode } from '../../constants/error-codes';
export declare class ErrorHandler {
    handle(error: any): CLIError;
    private handleAxiosError;
    getHint(code: ErrorCode): string;
}
export declare const errorHandler: ErrorHandler;
//# sourceMappingURL=error-handler.d.ts.map