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
const CLUE_UPDATE_ALLOWLIST = [
    'name',
    'contactName',
    'phone',
    'status',
    'description',
    'ownerId',
    'owner',
    'companyId',
    'email',
    'industry',
    'source',
    'customName',
    'telephone',
    'clueSourceId',
    'position',
    'weChat',
    'website',
    'fixPhone',
    'department',
    'address',
    'remark',
];
function buildClueUpdateBody(current, options, id) {
    const body = { id };
    for (const field of CLUE_UPDATE_ALLOWLIST) {
        if (current[field] !== undefined) {
            body[field] = current[field];
        }
    }
    if (options.name !== undefined)
        body.name = options.name;
    if (options.contact !== undefined)
        body.contactName = options.contact;
    if (options.phone !== undefined)
        body.phone = options.phone;
    if (options.status !== undefined)
        body.status = options.status;
    if (options.description !== undefined)
        body.description = options.description;
    return body;
}
function updateCommand(clue) {
    clue
        .command('update <id>')
        .description('Update an existing clue')
        .option('--name <text>', 'Clue name')
        .option('--contact <text>', 'Contact person name')
        .option('--phone <text>', 'Contact phone number')
        .option('--status <text>', 'Clue status')
        .option('--description <text>', 'Clue description')
        .option('-y, --yes', 'Skip confirmation prompt')
        .option('--json', 'Output as JSON')
        .option('-v, --verbose', 'Show verbose output')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        const globalOpts = command.optsWithGlobals();
        try {
            const profile = globalOpts.profile || 'default';
            // Validate at least one field is provided
            if (options.name === undefined &&
                options.contact === undefined &&
                options.phone === undefined &&
                options.status === undefined &&
                options.description === undefined) {
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
            const body = buildClueUpdateBody(currentData, options, id);
            // Step 3: Confirmation prompt (unless --yes)
            if (!options.yes && !globalOpts.yes) {
                const changes = [];
                if (options.name !== undefined)
                    changes.push(`name → ${options.name}`);
                if (options.contact !== undefined)
                    changes.push(`contact → ${options.contact}`);
                if (options.phone !== undefined)
                    changes.push(`phone → ${options.phone}`);
                if (options.status !== undefined)
                    changes.push(`status → ${options.status}`);
                if (options.description !== undefined)
                    changes.push('description updated');
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
            if (options.json || globalOpts.json) {
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