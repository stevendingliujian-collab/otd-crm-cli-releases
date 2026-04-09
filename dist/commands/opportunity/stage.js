"use strict";
/**
 * Opportunity stage command
 * Update opportunity stage (business process)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stageCommand = stageCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const opportunity_1 = require("../../schemas/resources/opportunity");
function stageCommand(opportunity) {
    opportunity
        .command('stage <id>')
        .description('Update opportunity stage')
        .option('--stage <stage-id>', 'Stage ID (UUID) to set')
        .option('--stage-name <name>', 'Stage name (will lookup ID automatically)')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Validate ID format
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
                throw new Error('Invalid opportunity ID format. Expected UUID.');
            }
            const client = (0, http_client_1.createClient)(profile);
            let stageId = options.stage;
            // If stage name provided, lookup stage ID
            if (options.stageName && !options.stage) {
                if (globalOpts.verbose) {
                    formatter_1.formatter.info(`Looking up stage ID for: ${options.stageName}`);
                }
                // Get all stages
                const stagesResponse = await client.get('/api/crm/project/getProjectStatussByCode', {
                    params: { code: 'BusinessProcess' },
                    traceId,
                });
                if (!Array.isArray(stagesResponse)) {
                    throw new Error('Failed to fetch stages list');
                }
                // Find matching stage
                const stage = stagesResponse.find((s) => s.displayText === options.stageName || s.code === options.stageName);
                if (!stage) {
                    const availableStages = stagesResponse.map((s) => s.displayText).join(', ');
                    throw new Error(`Stage not found: ${options.stageName}\nAvailable stages: ${availableStages}`);
                }
                stageId = stage.id;
                if (globalOpts.verbose) {
                    formatter_1.formatter.info(`Found stage ID: ${stageId}`);
                }
            }
            // Validate stage ID
            if (!stageId) {
                throw new Error('Stage ID is required. Use --stage <id> or --stage-name <name>');
            }
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stageId)) {
                throw new Error('Invalid stage ID format. Expected UUID.');
            }
            // Make API request
            if (globalOpts.verbose) {
                formatter_1.formatter.info('Updating opportunity stage...');
            }
            const response = await client.post(`/api/crm/business/updateBusinessProcess?id=${id}&businessProcessId=${stageId}`, {}, { traceId });
            // Validate response
            const validated = opportunity_1.OpportunitySchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'opportunity.stage',
                resource_type: 'opportunity',
                resource_id: id,
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            // Output
            if (globalOpts.json) {
                console.log(JSON.stringify(validated, null, 2));
            }
            else {
                formatter_1.formatter.success('Opportunity stage updated successfully!');
                console.log(`\nOpportunity ID: ${validated.id}`);
                console.log(`Name: ${validated.name || 'N/A'}`);
                if (globalOpts.verbose && response.businessProcessName) {
                    console.log(`Stage: ${response.businessProcessName}`);
                }
                console.log(`\n💡 Tip: Use 'crm opportunity get ${id}' to view full details`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (command.optsWithGlobals().json) {
                console.error(JSON.stringify({
                    error: {
                        code: cliError.code,
                        message: cliError.message,
                        hint: cliError.hint,
                        trace_id: traceId,
                    },
                }, null, 2));
            }
            else {
                formatter_1.formatter.error(`Error: ${cliError.code}`);
                console.error(`   ${cliError.message}`);
                if (cliError.hint) {
                    console.error(`\n💡 Hint: ${cliError.hint}`);
                }
                console.error(`\n🔍 Trace ID: ${traceId}`);
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=stage.js.map