"use strict";
/**
 * HTTP Client with authentication and retry logic
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRMClient = void 0;
exports.createClient = createClient;
const axios_1 = __importDefault(require("axios"));
const auth_manager_1 = require("../auth/auth-manager");
const config_manager_1 = require("../config/config-manager");
const error_handler_1 = require("../errors/error-handler");
class CRMClient {
    axiosInstance;
    profile;
    constructor(profile = 'default') {
        this.profile = profile;
        this.axiosInstance = axios_1.default.create({
            transformResponse: [
                (data) => {
                    // ABP returns text/plain content-type for some endpoints; defensively
                    // parse JSON regardless. If the result is still a string (double-encoded),
                    // parse again.
                    if (typeof data === 'string') {
                        if (data.length === 0)
                            return null;
                        try {
                            const parsed = JSON.parse(data);
                            if (typeof parsed === 'string') {
                                try {
                                    return JSON.parse(parsed);
                                }
                                catch {
                                    return parsed;
                                }
                            }
                            return parsed;
                        }
                        catch {
                            return data;
                        }
                    }
                    return data;
                },
            ],
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        // Request interceptor: inject auth token
        this.axiosInstance.interceptors.request.use(async (config) => {
            // Get profile config
            const profileConfig = await config_manager_1.configManager.getProfileConfig(this.profile);
            config.baseURL = profileConfig.api_url;
            config.timeout = profileConfig.timeout;
            // Match frontend: Accept text/plain so ABP returns serialized JSON body
            config.headers['Accept'] = 'text/plain';
            // Inject auth token
            try {
                const token = await auth_manager_1.authManager.getValidToken(this.profile);
                config.headers.Authorization = `Bearer ${token}`;
            }
            catch (error) {
                // Not authenticated, continue without token
            }
            // Inject tenant ID (required for multi-tenant ABP apps)
            // Only set if not already explicitly provided in the request (e.g. login step 2)
            const tenantId = profileConfig.tenant_id;
            if (tenantId && !config.headers['__tenant']) {
                config.headers['__tenant'] = tenantId;
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor: handle errors
        this.axiosInstance.interceptors.response.use((response) => response, (error) => {
            throw error_handler_1.errorHandler.handle(error);
        });
    }
    async get(url, options) {
        const response = await this.request('GET', url, undefined, options);
        return response.data;
    }
    async post(url, data, options) {
        const response = await this.request('POST', url, data, options);
        return response.data;
    }
    async put(url, data, options) {
        const response = await this.request('PUT', url, data, options);
        return response.data;
    }
    async delete(url, options) {
        const response = await this.request('DELETE', url, undefined, options);
        return response.data;
    }
    async request(method, url, data, options = {}) {
        const { traceId, retry = true, maxRetries = 3, ...axiosConfig } = options;
        const config = {
            method,
            url,
            data,
            ...axiosConfig,
            headers: {
                ...axiosConfig.headers,
                ...(traceId && { 'X-Trace-ID': traceId }),
            },
        };
        if (retry) {
            return await this.retryRequest(config, maxRetries);
        }
        return await this.axiosInstance.request(config);
    }
    async retryRequest(config, maxRetries) {
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this.axiosInstance.request(config);
            }
            catch (error) {
                lastError = error;
                // Don't retry if not a retryable error
                if (!this.isRetryable(error) || attempt === maxRetries) {
                    throw error;
                }
                // Exponential backoff
                const delay = Math.pow(2, attempt) * 1000;
                await this.sleep(delay);
            }
        }
        throw lastError;
    }
    isRetryable(error) {
        const retryableCodes = ['UPSTREAM_502', 'UPSTREAM_504', 'SYSTEM_500_NETWORK'];
        return retryableCodes.includes(error.code);
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.CRMClient = CRMClient;
function createClient(profile) {
    return new CRMClient(profile);
}
//# sourceMappingURL=http-client.js.map