/**
 * Configuration manager
 */
import type { CLIConfig, ProfileConfig } from '../../types/common';
export declare class ConfigManager {
    private configPath;
    private config;
    constructor(configPath?: string);
    load(): Promise<CLIConfig>;
    save(): Promise<void>;
    get(key: string, profile?: string): Promise<any>;
    set(key: string, value: any, profile?: string): Promise<void>;
    getCurrentProfile(): Promise<string>;
    setCurrentProfile(profile: string): Promise<void>;
    getProfileConfig(profile?: string): Promise<ProfileConfig>;
    private getDefaultConfig;
    private getDefaultProfileConfig;
}
export declare const configManager: ConfigManager;
//# sourceMappingURL=config-manager.d.ts.map