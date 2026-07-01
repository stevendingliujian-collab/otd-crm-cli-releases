"use strict";
/**
 * TMS task create command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const task_1 = require("../../schemas/resources/task");
const RELATED_TYPE_HELP = [
    '0 Meeting',
    '1 ThirdParty',
    '2 Others',
    '3 Project',
    '4 Manually',
    '5 OtdCrm',
].join(', ');
const CRM_SUB_RELATED_TYPE_HELP = [
    'Leads',
    'Contacts',
    'Opportunities',
    'Accounts',
    'Contracts',
    'Projects',
    'Procurements',
    'Delivery',
].join(', ');
function createCommand(task) {
    task
        .command('create')
        .description('Create a new task item')
        .requiredOption('-t, --title <title>', 'Task title')
        .option('-d, --description <description>', 'Task description')
        .option('-a, --assignee-id <assigneeId>', 'Responsible user ID')
        .option('--priority <priority>', 'Task priority (number)')
        .option('--status <status>', 'Task status (number)')
        .option('--due-date <dueDate>', 'Due date (YYYY-MM-DD)')
        .option('--related-id <relatedId>', 'Related resource ID')
        .option('--related-type <relatedType>', `Related source type (number): ${RELATED_TYPE_HELP}`)
        .option('--sub-related-type <subRelatedType>', `CRM source module when --related-type is 5: ${CRM_SUB_RELATED_TYPE_HELP}`)
        .option('--related-name <relatedName>', 'Related resource name')
        .addHelpText('after', `
Related source type (--related-type):
  0 Meeting
  1 ThirdParty
  2 Others
  3 Project
  4 Manually
  5 OtdCrm

CRM source module (--sub-related-type, used with --related-type 5):
  Leads, Contacts, Opportunities, Accounts, Contracts, Projects, Procurements, Delivery

Examples:
  $ crm task create --title "新任务" \\
      --related-id <opportunityId> \\
      --related-type 5 \\
      --sub-related-type Opportunities \\
      --related-name "关联项名称" \\
      --json
`)
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build request body
            const requestBody = {
                title: options.title,
                taskType: 0,
            };
            if (options.description)
                requestBody.description = options.description;
            if (options.assigneeId)
                requestBody.responsibleUserId = options.assigneeId;
            if (options.priority)
                requestBody.priority = parseInt(options.priority, 10);
            if (options.status)
                requestBody.status = parseInt(options.status, 10);
            if (options.dueDate)
                requestBody.planDoneDate = options.dueDate;
            if (options.relatedId)
                requestBody.relatedId = options.relatedId;
            if (options.relatedType)
                requestBody.relatedType = parseInt(options.relatedType, 10);
            if (options.subRelatedType)
                requestBody.subRelatedType = options.subRelatedType;
            if (options.relatedName)
                requestBody.relatedName = options.relatedName;
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/tms/taskItem/create', requestBody, {
                traceId,
            });
            // Validate response
            const validated = task_1.TaskSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'task.create',
                resource_type: 'task',
                resource_id: validated.id,
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
                formatter_1.formatter.success(`✓ Task created successfully`);
                console.log(`\nTask ID: ${validated.id}`);
                console.log(`Title: ${validated.title}`);
                if (validated.responsibleUserName)
                    console.log(`Responsible: ${validated.responsibleUserName}`);
                if (validated.planDoneDate)
                    console.log(`Due Date: ${validated.planDoneDate}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (command.optsWithGlobals().json) {
                console.error(formatter_1.formatter.formatJson({ success: false, error: { code: cliError.code, message: cliError.message, hint: cliError.hint }, trace_id: traceId }));
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
//# sourceMappingURL=create.js.map