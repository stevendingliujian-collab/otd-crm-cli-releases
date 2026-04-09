/**
 * Audit logger
 */
export interface AuditLog {
    timestamp: string;
    trace_id: string;
    operator: string;
    action: string;
    resource_type: string;
    resource_id: string;
    changes?: any;
    meta?: {
        profile: string;
        api_url: string;
        duration_ms?: number;
        ip?: string;
    };
}
export declare class AuditLogger {
    private readonly logPath;
    private readonly maxFileSize;
    private readonly maxFiles;
    constructor(logPath?: string);
    log(entry: Omit<AuditLog, 'timestamp'>): Promise<void>;
    private append;
    private rotateIfNeeded;
    private rotate;
    generateTraceId(): string;
}
export declare const auditLogger: AuditLogger;
//# sourceMappingURL=audit-logger.d.ts.map