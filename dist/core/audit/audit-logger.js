"use strict";
/**
 * Audit logger
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.AuditLogger = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
class AuditLogger {
    logPath;
    maxFileSize = 10 * 1024 * 1024; // 10MB
    maxFiles = 5;
    constructor(logPath) {
        this.logPath = logPath || path_1.default.join(os_1.default.homedir(), '.crm', 'audit.log');
    }
    async log(entry) {
        const log = {
            timestamp: new Date().toISOString(),
            ...entry,
        };
        await this.append(log);
    }
    async append(log) {
        const line = JSON.stringify(log) + '\n';
        // Ensure directory exists
        await promises_1.default.mkdir(path_1.default.dirname(this.logPath), { recursive: true });
        // Append to log file
        await promises_1.default.appendFile(this.logPath, line, { mode: 0o600 });
        // Check file size and rotate if needed
        await this.rotateIfNeeded();
    }
    async rotateIfNeeded() {
        try {
            const stats = await promises_1.default.stat(this.logPath);
            if (stats.size > this.maxFileSize) {
                await this.rotate();
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Failed to check audit log size:', error);
            }
        }
    }
    async rotate() {
        // Delete oldest file if exists
        const oldestFile = `${this.logPath}.${this.maxFiles}`;
        try {
            await promises_1.default.unlink(oldestFile);
        }
        catch {
            // Ignore if doesn't exist
        }
        // Shift existing files
        for (let i = this.maxFiles - 1; i >= 1; i--) {
            const from = `${this.logPath}.${i}`;
            const to = `${this.logPath}.${i + 1}`;
            try {
                await promises_1.default.rename(from, to);
            }
            catch {
                // Ignore if doesn't exist
            }
        }
        // Rotate current file
        await promises_1.default.rename(this.logPath, `${this.logPath}.1`);
    }
    generateTraceId() {
        const timestamp = Math.floor(Date.now() / 1000);
        const random = crypto_1.default.randomBytes(4).toString('hex');
        return `trc_${timestamp}_${random}`;
    }
}
exports.AuditLogger = AuditLogger;
exports.auditLogger = new AuditLogger();
//# sourceMappingURL=audit-logger.js.map