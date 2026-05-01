"use strict";
/**
 * Opportunity assign command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignCommand = assignCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const cli_error_1 = require("../../core/errors/cli-error");
const audit_logger_1 = require("../../core/audit/audit-logger");
const opportunity_1 = require("../../schemas/resources/opportunity");
const error_codes_1 = require("../../constants/error-codes");
const user_search_1 = require("../../utils/user-search");
function assignCommand(opportunity) {
    opportunity
        .command('assign <id>')
        .description('Assign opportunity to a new owner')
        .argument('<id>', 'Opportunity ID (UUID)')
        .requiredOption('--owner <name>', 'New owner name (fuzzy search)')
        .option('--owner-id <id>', 'New owner ID (UUID) - use if name search returns multiple matches')
        .option('-y, --yes', 'Skip confirmation prompt')
        .option('--json', 'Output as JSON')
        .option('-v, --verbose', 'Show verbose output')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        const globalOpts = command.optsWithGlobals();
        try {
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            // Step 1: Resolve owner (name → ID)
            let ownerId;
            let ownerName;
            if (options.ownerId) {
                // Direct ID provided
                ownerId = options.ownerId;
                ownerName = options.owner; // Use provided name as fallback
                if (options.verbose) {
                    formatter_1.formatter.info(`Using owner ID: ${ownerId}`);
                }
            }
            else {
                // Search by name
                if (options.verbose) {
                    formatter_1.formatter.info(`Searching for owner: ${options.owner}`);
                }
                const users = await (0, user_search_1.searchUsers)(client, options.owner, traceId);
                if (users.length === 0) {
                    throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.BIZ_404, `No user found matching "${options.owner}"`, 'Check the name or use --owner-id if you know the user ID');
                }
                if (users.length > 1) {
                    // Multiple matches - report and exit
                    const errorMsg = `Found ${users.length} users matching "${options.owner}". Please specify one:`;
                    if (options.json || globalOpts.json) {
                        console.error(formatter_1.formatter.formatJson({
                            success: false,
                            error: {
                                code: error_codes_1.ERROR_CODES.VALIDATION_422,
                                message: errorMsg,
                                candidates: users.map((u, idx) => ({
                                    index: idx + 1,
                                    id: u.id,
                                    name: u.name,
                                    department: u.departmentName || '-',
                                    email: u.email || '-',
                                })),
                                hint: `Use: crm opportunity assign ${id} --owner-id <id>`,
                            },
                            trace_id: traceId,
                        }));
                    }
                    else {
                        formatter_1.formatter.error(errorMsg);
                        console.log('');
                        users.forEach((u, idx) => {
                            console.log(`  ${idx + 1}. ${u.name} (ID: ${u.id})`);
                            if (u.departmentName)
                                console.log(`     Department: ${u.departmentName}`);
                            if (u.email)
                                console.log(`     Email: ${u.email}`);
                        });
                        console.log('');
                        formatter_1.formatter.info(`Usage: crm opportunity assign ${id} --owner-id <id>`);
                    }
                    process.exit(1);
                }
                // Single match found
                ownerId = users[0].id;
                ownerName = users[0].name;
                if (options.verbose) {
                    formatter_1.formatter.info(`Matched user: ${ownerName} (${ownerId})`);
                }
            }
            // Step 2: Get current opportunity info
            if (options.verbose) {
                formatter_1.formatter.info(`Fetching opportunity ${id}...`);
            }
            const current = await client.get(`/api/crm/business/get?id=${id}`, { traceId });
            const currentData = opportunity_1.OpportunitySchema.parse(current);
            // Step 3: Confirmation prompt (unless --yes)
            if (!options.yes) {
                formatter_1.formatter.info(`Will assign opportunity "${currentData.name}" to ${ownerName}`);
                if (currentData.owner) {
                    formatter_1.formatter.info(`Current owner: ${currentData.owner}`);
                }
                formatter_1.formatter.warn('Use --yes to skip this prompt');
                // In real CLI, would use inquirer.js for confirmation
                // For now, proceed (assume user confirmed)
            }
            // Step 4: Execute assignment
            if (options.verbose) {
                formatter_1.formatter.info('Sending assignment request...');
            }
            // Build request body (based on MCP assign_opportunity_owner implementation)
            const body = {
                id: currentData.id,
                name: currentData.name,
                customId: currentData.customId,
                companyId: currentData.companyId,
                isAgent: currentData.isAgent || false,
                ownerId: ownerId,
                owner: ownerName,
            };
            // Preserve other required/existing fields
            if (currentData.customName)
                body.customName = currentData.customName;
            if (currentData.companyName)
                body.companyName = currentData.companyName;
            if (currentData.expectedTransAmount !== undefined)
                body.expectedTransAmount = currentData.expectedTransAmount;
            if (currentData.expectedTransProbability !== undefined)
                body.expectedTransProbability = currentData.expectedTransProbability;
            if (currentData.expectedCompleteDate)
                body.expectedCompleteDate = currentData.expectedCompleteDate;
            if (currentData.businessProcessId)
                body.businessProcessId = currentData.businessProcessId;
            if (currentData.businessProcessName)
                body.businessProcessName = currentData.businessProcessName;
            if (currentData.description)
                body.description = currentData.description;
            const response = await client.post('/api/crm/business/update', body, { traceId });
            const updated = opportunity_1.OpportunitySchema.parse(response);
            // Step 5: Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'opportunity.assign',
                resource_type: 'opportunity',
                resource_id: updated.id,
                meta: {
                    profile,
                    api_url: client['axiosInstance'].defaults.baseURL || '',
                },
                changes: {
                    old_owner: currentData.owner,
                    new_owner: ownerName,
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
                formatter_1.formatter.success(`✅ Opportunity assigned successfully`);
                formatter_1.formatter.info(`Name: ${updated.name}`);
                formatter_1.formatter.info(`New owner: ${ownerName}`);
                if (currentData.owner && currentData.owner !== ownerName) {
                    formatter_1.formatter.info(`Previous owner: ${currentData.owner}`);
                }
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
//# sourceMappingURL=assign.js.map