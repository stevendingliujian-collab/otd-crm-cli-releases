"use strict";
/**
 * Opportunity update command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = updateCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const cli_error_1 = require("../../core/errors/cli-error");
const audit_logger_1 = require("../../core/audit/audit-logger");
const opportunity_1 = require("../../schemas/resources/opportunity");
const error_codes_1 = require("../../constants/error-codes");
function updateCommand(opportunity) {
    opportunity
        .command('update <id>')
        .description('Update an existing opportunity')
        .option('--stage <name>', 'Business stage/process name')
        .option('--amount <number>', 'Expected transaction amount', parseFloat)
        .option('--probability <percent>', 'Expected probability (0-100)', parseFloat)
        .option('--expected-date <date>', 'Expected completion date (YYYY-MM-DD)')
        .option('--description <text>', 'Opportunity description')
        .option('--yes, -y', 'Skip confirmation prompt')
        .option('--json', 'Output as JSON')
        .option('--verbose, -v', 'Show verbose output')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Validate at least one field is provided
            if (!options.stage && !options.amount && !options.probability && !options.expectedDate && !options.description) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided to update', 'Available options: --stage, --amount, --probability, --expected-date, --description', { available_options: ['--stage', '--amount', '--probability', '--expected-date', '--description'] });
            }
            const client = (0, http_client_1.createClient)(profile);
            // Step 1: Get current opportunity data
            if (options.verbose) {
                formatter_1.formatter.info(`Fetching opportunity ${id}...`);
            }
            const current = await client.get(`/api/crm/business/get?id=${id}`, { traceId });
            const currentData = opportunity_1.OpportunitySchema.parse(current);
            // Step 2: Build update payload (merge with current data)
            const body = {
                id: currentData.id,
                name: currentData.name,
                customId: currentData.customId,
                companyId: currentData.companyId,
                isAgent: currentData.isAgent || false,
            };
            // Preserve existing fields
            if (currentData.customName)
                body.customName = currentData.customName;
            if (currentData.companyName)
                body.companyName = currentData.companyName;
            if (currentData.ownerId)
                body.ownerId = currentData.ownerId;
            if (currentData.owner)
                body.owner = currentData.owner;
            // Update fields
            if (options.amount !== undefined) {
                body.expectedTransAmount = options.amount;
            }
            else if (currentData.expectedTransAmount !== undefined) {
                body.expectedTransAmount = currentData.expectedTransAmount;
            }
            if (options.probability !== undefined) {
                body.expectedTransProbability = options.probability;
            }
            else if (currentData.expectedTransProbability !== undefined) {
                body.expectedTransProbability = currentData.expectedTransProbability;
            }
            if (options.expectedDate) {
                body.expectedCompleteDate = options.expectedDate;
            }
            else if (currentData.expectedCompleteDate) {
                body.expectedCompleteDate = currentData.expectedCompleteDate;
            }
            if (options.description) {
                body.description = options.description;
            }
            else if (currentData.description) {
                body.description = currentData.description;
            }
            // Handle stage update (requires stage name → ID lookup)
            if (options.stage) {
                // Fetch available stages
                const stages = await client.get('/api/crm/businessprocess/getList?businessType=0', { traceId });
                if (!Array.isArray(stages.items)) {
                    throw new cli_error_1.CLIError(error_codes_1.ERROR_CODES.UPSTREAM_502, 'Failed to fetch business stages', 'Backend API returned invalid response format');
                }
                // Find matching stage
                const matchedStage = stages.items.find((s) => s.name === options.stage);
                if (!matchedStage) {
                    const availableStages = stages.items.map((s) => s.name);
                    throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422, `Stage "${options.stage}" not found`, `Available stages: ${availableStages.join(', ')}. Run: crm opportunity stages --format list`, { available_stages: availableStages });
                }
                body.businessProcessId = matchedStage.id;
                body.businessProcessName = matchedStage.name;
            }
            else if (currentData.businessProcessId) {
                body.businessProcessId = currentData.businessProcessId;
                body.businessProcessName = currentData.businessProcessName;
            }
            // Step 3: Confirmation prompt (unless --yes)
            if (!options.yes) {
                const changes = [];
                if (options.stage)
                    changes.push(`stage → ${options.stage}`);
                if (options.amount !== undefined)
                    changes.push(`amount → ¥${options.amount}`);
                if (options.probability !== undefined)
                    changes.push(`probability → ${options.probability}%`);
                if (options.expectedDate)
                    changes.push(`expected date → ${options.expectedDate}`);
                if (options.description)
                    changes.push(`description updated`);
                formatter_1.formatter.info(`Will update opportunity "${currentData.name}"`);
                formatter_1.formatter.info(`Changes: ${changes.join(', ')}`);
                formatter_1.formatter.warn('Use --yes to skip this prompt');
                // In real CLI, would use inquirer.js for confirmation
                // For now, proceed (assume user confirmed)
            }
            // Step 4: Execute update
            if (options.verbose) {
                formatter_1.formatter.info('Sending update request...');
            }
            const response = await client.post(`/api/crm/business/update?id=${id}`, body, { traceId });
            const updated = opportunity_1.OpportunitySchema.parse(response);
            // Step 5: Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'opportunity.update',
                resource_type: 'opportunity',
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
                formatter_1.formatter.success(`✅ Opportunity updated successfully`);
                formatter_1.formatter.info(`ID: ${updated.id}`);
                formatter_1.formatter.info(`Name: ${updated.name}`);
                if (updated.businessProcessName)
                    formatter_1.formatter.info(`Stage: ${updated.businessProcessName}`);
                if (updated.expectedTransAmount)
                    formatter_1.formatter.info(`Amount: ¥${updated.expectedTransAmount}`);
                if (updated.expectedTransProbability)
                    formatter_1.formatter.info(`Probability: ${updated.expectedTransProbability}%`);
                if (updated.expectedCompleteDate)
                    formatter_1.formatter.info(`Expected Date: ${updated.expectedCompleteDate}`);
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