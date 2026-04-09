/**
 * HTTP Client with authentication and retry logic
 */
import { AxiosRequestConfig } from 'axios';
export interface RequestOptions extends AxiosRequestConfig {
    traceId?: string;
    retry?: boolean;
    maxRetries?: number;
}
export declare class CRMClient {
    private axiosInstance;
    private profile;
    constructor(profile?: string);
    private setupInterceptors;
    get<T = any>(url: string, options?: RequestOptions): Promise<T>;
    post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<T>;
    put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<T>;
    delete<T = any>(url: string, options?: RequestOptions): Promise<T>;
    private request;
    private retryRequest;
    private isRetryable;
    private sleep;
}
export declare function createClient(profile?: string): CRMClient;
//# sourceMappingURL=http-client.d.ts.map