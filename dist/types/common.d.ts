/**
 * Common type definitions
 */
export interface GlobalOptions {
    profile?: string;
    env?: string;
    json?: boolean;
    output?: 'table' | 'json';
    fields?: string;
    yes?: boolean;
    timeout?: number;
    verbose?: boolean;
}
export interface CommandContext {
    profile: string;
    verbose: boolean;
    json: boolean;
}
export interface CLIConfig {
    profiles: Record<string, ProfileConfig>;
    current_profile: string;
}
export interface ProfileConfig {
    api_url: string;
    timeout: number;
    user_id?: string;
    tenant_id?: string;
    tenant_name?: string;
}
//# sourceMappingURL=common.d.ts.map