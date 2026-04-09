/**
 * Token store interface and implementations
 */
export interface TokenStore {
    get(profile: string): Promise<string | null>;
    set(profile: string, token: string): Promise<void>;
    delete(profile: string): Promise<void>;
}
/**
 * Encrypted file-based token store
 * Used as fallback when system keychain is not available
 */
export declare class EncryptedFileTokenStore implements TokenStore {
    private readonly tokensPath;
    private readonly key;
    constructor(tokensPath?: string);
    get(profile: string): Promise<string | null>;
    set(profile: string, token: string): Promise<void>;
    delete(profile: string): Promise<void>;
    private load;
    private save;
    private encrypt;
    private decrypt;
    private deriveKey;
}
export declare function createTokenStore(): TokenStore;
export declare const tokenStore: TokenStore;
//# sourceMappingURL=token-store.d.ts.map