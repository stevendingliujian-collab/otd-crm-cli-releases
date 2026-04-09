"use strict";
/**
 * Authentication manager
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authManager = exports.AuthManager = void 0;
const token_store_1 = require("./token-store");
const cli_error_1 = require("../errors/cli-error");
const error_codes_1 = require("../../constants/error-codes");
class AuthManager {
    tokenStore;
    constructor(tokenStore = token_store_1.tokenStore) {
        this.tokenStore = tokenStore;
    }
    async getToken(profile) {
        return await this.tokenStore.get(profile);
    }
    async setToken(profile, token) {
        await this.tokenStore.set(profile, token);
    }
    async deleteToken(profile) {
        await this.tokenStore.delete(profile);
    }
    async isAuthenticated(profile) {
        const token = await this.getToken(profile);
        return token !== null;
    }
    decodeToken(token) {
        try {
            // JWT token format: header.payload.signature
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid token format');
            }
            const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
            return JSON.parse(payload);
        }
        catch (error) {
            throw new cli_error_1.AuthError(error_codes_1.ERROR_CODES.AUTH_401_INVALID, 'Invalid token format', "Run 'crm auth login' again");
        }
    }
    isTokenExpired(token) {
        try {
            const payload = this.decodeToken(token);
            return payload.exp * 1000 < Date.now();
        }
        catch {
            return true;
        }
    }
    async getValidToken(profile) {
        const token = await this.getToken(profile);
        if (!token) {
            throw new cli_error_1.AuthError(error_codes_1.ERROR_CODES.AUTH_401, 'Not logged in', "Run 'crm auth login' first");
        }
        if (this.isTokenExpired(token)) {
            throw new cli_error_1.AuthError(error_codes_1.ERROR_CODES.AUTH_401_EXPIRED, 'Token expired', "Run 'crm auth login' again");
        }
        return token;
    }
    async getUserScopes(profile) {
        const token = await this.getValidToken(profile);
        const payload = this.decodeToken(token);
        return payload.scopes || [];
    }
}
exports.AuthManager = AuthManager;
exports.authManager = new AuthManager();
//# sourceMappingURL=auth-manager.js.map