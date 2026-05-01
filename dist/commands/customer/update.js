"use strict";
/**
 * Customer update command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = updateCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const cli_error_1 = require("../../core/errors/cli-error");
const audit_logger_1 = require("../../core/audit/audit-logger");
const customer_1 = require("../../schemas/resources/customer");
const error_codes_1 = require("../../constants/error-codes");
function updateCommand(customer) {
    customer
        .command('update <id>')
        .description('Update an existing customer')
        .option('--name <text>', 'Customer name')
        .option('--industry <text>', 'Industry')
        .option('--level <text>', 'Customer level (A/B/C/D)')
        .option('--address <text>', 'Detailed address')
        .option('--description <text>', 'Customer description')
        .option('-y, --yes', 'Skip confirmation prompt')
        .option('--json', 'Output as JSON')
        .option('-v, --verbose', 'Show verbose output')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        const globalOpts = command.optsWithGlobals();
        try {
            const profile = globalOpts.profile || 'default';
            // Validate at least one field is provided
            if (!options.name && !options.industry && !options.level && !options.address && !options.description) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided to update', 'Available options: --name, --industry, --level, --address, --description');
            }
            const client = (0, http_client_1.createClient)(profile);
            // Step 1: Get current customer data
            if (options.verbose) {
                formatter_1.formatter.info(`Fetching customer ${id}...`);
            }
            const current = await client.get(`/api/crm/custom/getCustomById`, { params: { id }, traceId });
            const currentData = customer_1.CustomerSchema.parse(current);
            // Step 2: Build update payload (merge with current data)
            // Note: ID is in URL query, not in body
            const body = {
                name: options.name || currentData.name,
                code: currentData.code,
                type: currentData.type ?? 0,
            };
            // Preserve existing fields
            if (currentData.ownerId)
                body.ownerId = currentData.ownerId;
            if (currentData.owner)
                body.owner = currentData.owner;
            // Update fields
            if (options.industry) {
                body.industry = options.industry;
            }
            else if (currentData.industry) {
                body.industry = currentData.industry;
            }
            if (options.level) {
                body.level = options.level;
            }
            else if (currentData.level) {
                body.level = currentData.level;
            }
            if (options.address) {
                body.address = options.address;
            }
            else if (currentData.address) {
                body.address = currentData.address;
            }
            if (options.description) {
                body.description = options.description;
            }
            else if (currentData.description) {
                body.description = currentData.description;
            }
            // Preserve other common fields
            if (currentData.phone)
                body.phone = currentData.phone;
            if (currentData.email)
                body.email = currentData.email;
            if (currentData.contactName)
                body.contactName = currentData.contactName;
            // Step 3: Confirmation prompt (unless --yes)
            if (!options.yes) {
                const changes = [];
                if (options.name)
                    changes.push(`name → ${options.name}`);
                if (options.industry)
                    changes.push(`industry → ${options.industry}`);
                if (options.level)
                    changes.push(`level → ${options.level}`);
                if (options.address)
                    changes.push(`address updated`);
                if (options.description)
                    changes.push(`description updated`);
                formatter_1.formatter.info(`Will update customer "${currentData.name}"`);
                formatter_1.formatter.info(`Changes: ${changes.join(', ')}`);
                formatter_1.formatter.warn('Use --yes to skip this prompt');
                // In real CLI, would use inquirer.js for confirmation
                // For now, proceed (assume user confirmed)
            }
            // Step 4: Execute update
            if (options.verbose) {
                formatter_1.formatter.info('Sending update request...');
            }
            if (process.env.DEBUG_CRM) {
                console.error(`[DEBUG] → POST /api/crm/custom/update?id=${id}`);
                console.error(`[DEBUG]   body:`, JSON.stringify(body, null, 2));
            }
            const response = await client.post(`/api/crm/custom/update?id=${id}`, body, { traceId });
            if (process.env.DEBUG_CRM) {
                console.error(`[DEBUG] ← response:`, JSON.stringify(response, null, 2));
            }
            const updated = customer_1.CustomerSchema.parse(response);
            // Step 5: Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'customer.update',
                resource_type: 'customer',
                resource_id: updated.id,
                meta: {
                    profile,
                    api_url: client['axiosInstance'].defaults.baseURL || '',
                },
                changes: {
                    fields_updated: Object.keys(options).filter(k => k !== 'yes' && k !== 'json' && k !== 'verbose'),
                },
            });
            // Step 6: Output
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson({
                    success: true,
                    data: updated,
                    trace_id: traceId,
                }));
            }
            else {
                formatter_1.formatter.success(`✅ Customer updated successfully`);
                formatter_1.formatter.info(`ID: ${updated.id}`);
                formatter_1.formatter.info(`Name: ${updated.name}`);
                if (updated.industry)
                    formatter_1.formatter.info(`Industry: ${updated.industry}`);
                if (updated.level)
                    formatter_1.formatter.info(`Level: ${updated.level}`);
                if (updated.address)
                    formatter_1.formatter.info(`Address: ${updated.address}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (options.json || globalOpts.json) {
                console.error(formatter_1.formatter.formatJson({
                    success: false,
                    error: {
                        code: cliError.code,
                        message: cliError.message,
                        hint: cliError.hint,
                    },
                    trace_id: traceId,
                }));
            }
            else {
                formatter_1.formatter.error(`${cliError.code}: ${cliError.message}`);
                if (cliError.hint)
                    formatter_1.formatter.info(`Hint: ${cliError.hint}`);
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=update.js.map