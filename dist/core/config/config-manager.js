"use strict";
/**
 * Configuration manager
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configManager = exports.ConfigManager = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
class ConfigManager {
    configPath;
    config = null;
    constructor(configPath) {
        this.configPath = configPath || path_1.default.join(os_1.default.homedir(), '.crm', 'config.json');
    }
    async load() {
        if (this.config) {
            return this.config;
        }
        try {
            const content = await promises_1.default.readFile(this.configPath, 'utf-8');
            this.config = JSON.parse(content);
            return this.config;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                // Create default config
                this.config = this.getDefaultConfig();
                await this.save();
                return this.config;
            }
            throw error;
        }
    }
    async save() {
        if (!this.config) {
            throw new Error('No config to save');
        }
        // Ensure directory exists
        await promises_1.default.mkdir(path_1.default.dirname(this.configPath), { recursive: true });
        // Write config with proper permissions
        await promises_1.default.writeFile(this.configPath, JSON.stringify(this.config, null, 2), { mode: 0o600 });
    }
    async get(key, profile) {
        const config = await this.load();
        const targetProfile = profile || config.current_profile;
        if (!config.profiles[targetProfile]) {
            throw new Error(`Profile '${targetProfile}' not found`);
        }
        const keys = key.split('.');
        let value = config.profiles[targetProfile];
        for (const k of keys) {
            if (value === undefined)
                break;
            value = value[k];
        }
        return value;
    }
    async set(key, value, profile) {
        const config = await this.load();
        const targetProfile = profile || config.current_profile;
        if (!config.profiles[targetProfile]) {
            config.profiles[targetProfile] = this.getDefaultProfileConfig();
        }
        const keys = key.split('.');
        let obj = config.profiles[targetProfile];
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        this.config = config;
        await this.save();
    }
    async getCurrentProfile() {
        const config = await this.load();
        return process.env.CRM_PROFILE || config.current_profile;
    }
    async setCurrentProfile(profile) {
        const config = await this.load();
        if (!config.profiles[profile]) {
            throw new Error(`Profile '${profile}' does not exist`);
        }
        config.current_profile = profile;
        this.config = config;
        await this.save();
    }
    async getProfileConfig(profile) {
        const config = await this.load();
        const targetProfile = profile || config.current_profile;
        if (!config.profiles[targetProfile]) {
            throw new Error(`Profile '${targetProfile}' not found`);
        }
        return config.profiles[targetProfile];
    }
    getDefaultConfig() {
        return {
            profiles: {
                default: this.getDefaultProfileConfig(),
            },
            current_profile: 'default',
        };
    }
    getDefaultProfileConfig() {
        return {
            api_url: process.env.CRM_API_URL || 'https://crm.otd.com/api',
            timeout: 30000,
        };
    }
}
exports.ConfigManager = ConfigManager;
// Singleton instance
exports.configManager = new ConfigManager();
//# sourceMappingURL=config-manager.js.map