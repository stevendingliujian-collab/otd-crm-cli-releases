/**
 * Authentication manager
 */
import type { TokenStore } from './token-store';
export interface LoginCredentials {
    username: string;
    password: string;
}
export interface TokenPayload {
    user_id: string;
    scopes: string[];
    exp: number;
}
export declare class AuthManager {
    private tokenStore;
    constructor(tokenStore?: TokenStore);
    getToken(profile: string): Promise<string | null>;
    setToken(profile: string, token: string): Promise<void>;
    deleteToken(profile: string): Promise<void>;
    isAuthenticated(profile: string): Promise<boolean>;
    decodeToken(token: string): TokenPayload;
    isTokenExpired(token: string): boolean;
    getValidToken(profile: string): Promise<string>;
    getUserScopes(profile: string): Promise<string[]>;
}
export declare const authManager: AuthManager;
//# sourceMappingURL=auth-manager.d.ts.map