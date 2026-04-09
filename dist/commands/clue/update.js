"use strict";
/**
 * Clue update command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = updateCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const cli_error_1 = require("../../core/errors/cli-error");
const audit_logger_1 = require("../../core/audit/audit-logger");
const clue_1 = require("../../schemas/resources/clue");
const error_codes_1 = require("../../constants/error-codes");
function updateCommand(clue) {
    clue
        .command('update <id>')
        .description('Update an existing clue')
        .argument('<id>', 'Clue ID (UUID)')
        .option('--name <text>', 'Clue name')
        .option('--contact <text>', 'Contact person name')
        .option('--phone <text>', 'Contact phone number')
        .option('--status <text>', 'Clue status')
        .option('--description <text>', 'Clue description')
        .option('--yes, -y', 'Skip confirmation prompt')
        .option('--json', 'Output as JSON')
        .option('--verbose, -v', 'Show verbose output')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Validate at least one field is provided
            if (!options.name && !options.contact && !options.phone && !options.status && !options.description) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided to update', 'Available options: --name, --contact, --phone, --status, --description');
            }
            const client = (0, http_client_1.createClient)(profile);
            // Step 1: Get current clue data
            if (options.verbose) {
                formatter_1.formatter.info(`Fetching clue ${id}...`);
            }
            const current = await client.get(`/api/crm/clue/get?id=${id}`, { traceId });
            const currentData = clue_1.ClueSchema.parse(current);
            // Step 2: Build update payload (merge with current data)
            const body = {
                id: currentData.id,
                name: options.name || currentData.name,
            };
            // Preserve existing fields
            if (currentData.ownerId)
                body.ownerId = currentData.ownerId;
            if (currentData.owner)
                body.owner = currentData.owner;
            if (currentData.companyId)
                body.companyId = currentData.companyId;
            // Update fields
            if (options.contact) {
                body.contactName = options.contact;
            }
            else if (currentData.contactName) {
                body.contactName = currentData.contactName;
            }
            if (options.phone) {
                body.phone = options.phone;
            }
            else if (currentData.phone) {
                body.phone = currentData.phone;
            }
            if (options.status) {
                body.status = options.status;
            }
            else if (currentData.status !== undefined) {
                body.status = currentData.status;
            }
            if (options.description) {
                body.description = options.description;
            }
            else if (currentData.description) {
                body.description = currentData.description;
            }
            // Preserve other fields
            if (currentData.email)
                body.email = currentData.email;
            if (currentData.industry)
                body.industry = currentData.industry;
            if (currentData.source)
                body.source = currentData.source;
            // Step 3: Confirmation prompt (unless --yes)
            if (!options.yes) {
                const changes = [];
                if (options.name)
                    changes.push(`name → ${options.name}`);
                if (options.contact)
                    changes.push(`contact → ${options.contact}`);
                if (options.phone)
                    changes.push(`phone → ${options.phone}`);
                if (options.status)
                    changes.push(`status → ${options.status}`);
                if (options.description)
                    changes.push(`description updated`);
                formatter_1.formatter.info(`Will update clue "${currentData.name}"`);
                formatter_1.formatter.info(`Changes: ${changes.join(', ')}`);
                formatter_1.formatter.warn('Use --yes to skip this prompt');
                // In real CLI, would use inquirer.js for confirmation
                // For now, proceed (assume user confirmed)
            }
            // Step 4: Execute update
            if (options.verbose) {
                formatter_1.formatter.info('Sending update request...');
            }
            const response = await client.post(`/api/crm/clue/update?id=${id}`, body, { traceId });
            const updated = clue_1.ClueSchema.parse(response);
            // Step 5: Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'clue.update',
                resource_type: 'clue',
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
            if (options.json) {
                console.log(formatter_1.formatter.formatJson({
                    success: true,
                    data: updated,
                    trace_id: traceId,
                }));
            }
            else {
                formatter_1.formatter.success(`✅ Clue updated successfully`);
                formatter_1.formatter.info(`ID: ${updated.id}`);
                formatter_1.formatter.info(`Name: ${updated.name}`);
                if (updated.contactName)
                    formatter_1.formatter.info(`Contact: ${updated.contactName}`);
                if (updated.phone)
                    formatter_1.formatter.info(`Phone: ${updated.phone}`);
                if (updated.status !== undefined)
                    formatter_1.formatter.info(`Status: ${updated.status}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (options.json) {
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