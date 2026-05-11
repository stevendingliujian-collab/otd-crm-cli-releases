"use strict";
/**
 * Project get command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const project_1 = require("../../schemas/resources/project");
function getCommand(project) {
    project
        .command('get <id>')
        .description('Get project details by ID (根据ID获取项目详情)')
        .action(async (id, _options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.get('/api/crm/project/getProjectById', {
                params: { id },
                traceId,
            });
            // Validate response
            const validated = project_1.ProjectSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'project.get',
                resource_type: 'project',
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
                const output = formatter_1.formatter.format([validated], {
                    format: 'table',
                    fields: globalOpts.fields?.split(',') || [
                        'id',
                        'name',
                        'code',
                        'customName',
                        'projectStage',
                        'projectStatusName',
                        'maintenanceExpire',
                        'owner',
                        'projectManager',
                    ],
                    headers: {
                        id: 'ID',
                        name: 'Name',
                        code: 'Code',
                        customName: 'Customer',
                        projectStage: 'Stage',
                        projectStatusName: 'Status',
                        maintenanceExpire: 'Maintenance Expire',
                        owner: 'Owner',
                        projectManager: 'PM',
                    },
                });
                console.log(output);
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
//# sourceMappingURL=get.js.map