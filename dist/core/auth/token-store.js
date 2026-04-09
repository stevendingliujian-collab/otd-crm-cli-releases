"use strict";
/**
 * Token store interface and implementations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenStore = exports.EncryptedFileTokenStore = void 0;
exports.createTokenStore = createTokenStore;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Encrypted file-based token store
 * Used as fallback when system keychain is not available
 */
class EncryptedFileTokenStore {
    tokensPath;
    key;
    constructor(tokensPath) {
        this.tokensPath = tokensPath || path_1.default.join(os_1.default.homedir(), '.crm', 'tokens.enc');
        this.key = this.deriveKey();
    }
    async get(profile) {
        try {
            const tokens = await this.load();
            const encrypted = tokens[profile];
            if (!encrypted)
                return null;
            return this.decrypt(encrypted);
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return null;
            throw error;
        }
    }
    async set(profile, token) {
        const tokens = await this.load();
        tokens[profile] = this.encrypt(token);
        await this.save(tokens);
    }
    async delete(profile) {
        const tokens = await this.load();
        delete tokens[profile];
        await this.save(tokens);
    }
    async load() {
        try {
            const content = await promises_1.default.readFile(this.tokensPath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return {};
            throw error;
        }
    }
    async save(tokens) {
        await promises_1.default.mkdir(path_1.default.dirname(this.tokensPath), { recursive: true });
        await promises_1.default.writeFile(this.tokensPath, JSON.stringify(tokens, null, 2), { mode: 0o600 });
    }
    encrypt(text) {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv('aes-256-gcm', this.key, iv);
        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return JSON.stringify({
            iv: iv.toString('hex'),
            encrypted: encrypted.toString('hex'),
            tag: tag.toString('hex'),
        });
    }
    decrypt(encryptedData) {
        const data = JSON.parse(encryptedData);
        const decipher = crypto_1.default.createDecipheriv('aes-256-gcm', this.key, Buffer.from(data.iv, 'hex'));
        decipher.setAuthTag(Buffer.from(data.tag, 'hex'));
        return Buffer.concat([
            decipher.update(Buffer.from(data.encrypted, 'hex')),
            decipher.final(),
        ]).toString('utf8');
    }
    deriveKey() {
        // Derive key from machine-specific data
        const machineId = os_1.default.hostname() + os_1.default.userInfo().username;
        return crypto_1.default.scryptSync(machineId, 'crm-cli-salt', 32);
    }
}
exports.EncryptedFileTokenStore = EncryptedFileTokenStore;
// Factory function
function createTokenStore() {
    // For now, use encrypted file store
    // TODO: Add keychain support for macOS/Linux
    return new EncryptedFileTokenStore();
}
exports.tokenStore = createTokenStore();
//# sourceMappingURL=token-store.js.map