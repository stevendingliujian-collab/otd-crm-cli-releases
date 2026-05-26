"use strict";
/**
 * TMS task status actions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusesCommand = statusesCommand;
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
function statusesCommand(task) {
    task
        .command('statuses')
        .description('List supported task status actions')
        .action(async (_options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const validated = [
                { name: 'start', path: '/api/tms/taskItem/start' },
                { name: 'done', path: '/api/tms/taskItem/done' },
                { name: 'check', path: '/api/tms/taskItem/check' },
                { name: 'reject', path: '/api/tms/taskItem/reject' },
                { name: 'stop', path: '/api/tms/taskItem/stop' },
                { name: 'cancel', path: '/api/tms/taskItem/cancel' },
            ];
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'task.statuses',
                resource_type: 'task',
                resource_id: 'N/A',
                meta: {
                    profile,
                    api_url: 'static',
                },
            });
            // Output
            if (globalOpts.json) {
                console.log(JSON.stringify(validated, null, 2));
            }
            else {
                const output = formatter_1.formatter.format(validated, {
                    format: 'table',
                    fields: ['id', 'name'],
                    headers: {
                        id: 'ID',
                        name: 'Status Name',
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
//# sourceMappingURL=statuses.js.map