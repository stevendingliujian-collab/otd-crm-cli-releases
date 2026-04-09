"use strict";
/**
 * Config commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.configCommands = configCommands;
const config_manager_1 = require("../../core/config/config-manager");
const formatter_1 = require("../../core/output/formatter");
function configCommands(program) {
    const config = program
        .command('config')
        .description('Configuration management');
    config
        .command('get <key>')
        .description('Get a configuration value')
        .addHelpText('after', `
Examples:
  # Get API URL
  $ crm config get api_url
  
  # Get current user ID
  $ crm config get user_id
  
  # Get config from a specific profile
  $ crm config get api_url --profile staging
  
  # Output as JSON
  $ crm config get api_url --json

Notes:
  - Common config keys: api_url, user_id, username, tenant_id
  - Config is profile-specific (use --profile to specify)
  - Returns error if key does not exist
  - Use 'crm config set' to update values
`)
        .action(async (key, _options, command) => {
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const value = await config_manager_1.configManager.get(key, profile);
            if (globalOpts.json) {
                console.log(JSON.stringify({ key, value }, null, 2));
            }
            else {
                console.log(`${key}: ${value}`);
            }
        }
        catch (error) {
            formatter_1.formatter.error(`Failed to get config: ${error.message}`);
            process.exit(1);
        }
    });
    config
        .command('set <key> <value>')
        .description('Set a configuration value')
        .addHelpText('after', `
Examples:
  # Set API URL
  $ crm config set api_url http://localhost:5000
  
  # Set API URL for staging profile
  $ crm config set api_url http://staging.example.com --profile staging
  
  # Set with JSON output
  $ crm config set timeout 60000 --json

Notes:
  - Common config keys: api_url, timeout, user_id
  - Config is profile-specific (use --profile to specify)
  - Use 'crm config get' to verify the value
  - Most config values are set automatically during 'crm auth login'
`)
        .action(async (key, value, _options, command) => {
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            await config_manager_1.configManager.set(key, value, profile);
            if (globalOpts.json) {
                console.log(JSON.stringify({ success: true, key, value }, null, 2));
            }
            else {
                formatter_1.formatter.success(`Set ${key} = ${value}`);
            }
        }
        catch (error) {
            formatter_1.formatter.error(`Failed to set config: ${error.message}`);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=index.js.map