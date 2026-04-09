"use strict";
/**
 * Task assign command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignCommand = assignCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const cli_error_1 = require("../../core/errors/cli-error");
const audit_logger_1 = require("../../core/audit/audit-logger");
const task_1 = require("../../schemas/resources/task");
const error_codes_1 = require("../../constants/error-codes");
const user_search_1 = require("../../utils/user-search");
function assignCommand(task) {
    task
        .command('assign <id>')
        .description('Assign task to a new responsible user')
        .argument('<id>', 'Task ID (UUID)')
        .requiredOption('--owner <name>', 'New responsible user name (fuzzy search)')
        .option('--owner-id <id>', 'New responsible user ID (UUID) - use if name search returns multiple matches')
        .option('--yes, -y', 'Skip confirmation prompt')
        .option('--json', 'Output as JSON')
        .option('--verbose, -v', 'Show verbose output')
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            // Step 1: Resolve owner (name → ID)
            let ownerId;
            let ownerName;
            if (options.ownerId) {
                // Direct ID provided
                ownerId = options.ownerId;
                ownerName = options.owner;
                if (options.verbose) {
                    formatter_1.formatter.info(`Using owner ID: ${ownerId}`);
                }
            }
            else {
                // Search by name
                if (options.verbose) {
                    formatter_1.formatter.info(`Searching for user: ${options.owner}`);
                }
                const users = await (0, user_search_1.searchUsers)(client, options.owner, traceId);
                if (users.length === 0) {
                    throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.BIZ_404, `No user found matching "${options.owner}"`, 'Check the name or use --owner-id if you know the user ID');
                }
                if (users.length > 1) {
                    // Multiple matches - report and exit
                    const errorMsg = `Found ${users.length} users matching "${options.owner}". Please specify one:`;
                    if (options.json) {
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
                                hint: `Use: crm task assign ${id} --owner-id <id>`,
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
                        formatter_1.formatter.info(`Usage: crm task assign ${id} --owner-id <id>`);
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
            // Step 2: Get current task info
            if (options.verbose) {
                formatter_1.formatter.info(`Fetching task ${id}...`);
            }
            const current = await client.get(`/api/tms/task/get?id=${id}`, { traceId });
            const currentData = task_1.TaskSchema.parse(current);
            // Step 3: Confirmation prompt (unless --yes)
            if (!options.yes) {
                formatter_1.formatter.info(`Will assign task "${currentData.title}" to ${ownerName}`);
                if (currentData.responsibleName) {
                    formatter_1.formatter.info(`Current responsible: ${currentData.responsibleName}`);
                }
                formatter_1.formatter.warn('Use --yes to skip this prompt');
            }
            // Step 4: Execute assignment
            if (options.verbose) {
                formatter_1.formatter.info('Sending assignment request...');
            }
            const body = {
                id: currentData.id,
                title: currentData.title,
                responsibleId: ownerId,
            };
            // Preserve existing fields
            if (currentData.description)
                body.description = currentData.description;
            if (currentData.status !== undefined)
                body.status = currentData.status;
            if (currentData.priority !== undefined)
                body.priority = currentData.priority;
            if (currentData.dueDate)
                body.dueDate = currentData.dueDate;
            if (currentData.relatedType !== undefined)
                body.relatedType = currentData.relatedType;
            if (currentData.relatedId)
                body.relatedId = currentData.relatedId;
            const response = await client.post(`/api/tms/task/update?id=${id}`, body, { traceId });
            const updated = task_1.TaskSchema.parse(response);
            // Step 5: Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'task.assign',
                resource_type: 'task',
                resource_id: updated.id,
                meta: {
                    profile,
                    api_url: client['axiosInstance'].defaults.baseURL || '',
                },
                changes: {
                    old_responsible: currentData.responsibleName,
                    new_responsible: ownerName,
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
                formatter_1.formatter.success(`✅ Task assigned successfully`);
                formatter_1.formatter.info(`Title: ${updated.title}`);
                formatter_1.formatter.info(`New responsible: ${ownerName}`);
                if (currentData.responsibleName && currentData.responsibleName !== ownerName) {
                    formatter_1.formatter.info(`Previous responsible: ${currentData.responsibleName}`);
                }
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
//# sourceMappingURL=assign.js.map