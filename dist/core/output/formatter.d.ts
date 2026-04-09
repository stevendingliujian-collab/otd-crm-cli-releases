/**
 * Output formatter - table and JSON
 */
export interface FormatOptions {
    format?: 'table' | 'json';
    fields?: string[];
    headers?: Record<string, string>;
}
export declare class OutputFormatter {
    formatTable(data: any[], options?: FormatOptions): string;
    formatJson(data: any): string;
    format(data: any, options?: FormatOptions): string;
    private formatSingleObject;
    private formatValue;
    success(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
}
export declare const formatter: OutputFormatter;
//# sourceMappingURL=formatter.d.ts.map