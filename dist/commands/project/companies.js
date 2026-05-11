"use strict";
/**
 * Project companies command
 * List all available companies (公司列表)
 * API: POST /api/otd/businessUnit/getPageList
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.companiesCommand = companiesCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const helpers_1 = require("./helpers");
function companiesCommand(project) {
    project
        .command('companies')
        .description('List all companies (查询公司列表)')
        .action(async (_options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const companies = await (0, helpers_1.fetchCompanyList)(client, traceId);
            if (companies.length === 0) {
                formatter_1.formatter.warn('No companies found.');
                return;
            }
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'project.companies',
                resource_type: 'company',
                resource_id: 'N/A',
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            // Output
            if (globalOpts.json) {
                console.log(JSON.stringify(companies, null, 2));
            }
            else {
                const output = formatter_1.formatter.format(companies, {
                    format: 'table',
                    fields: ['id', 'code', 'name'],
                    headers: {
                        id: 'ID',
                        code: 'Code',
                        name: 'Name',
                    },
                });
                console.log(output);
                console.log(`\nTotal: ${companies.length} companies`);
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
//# sourceMappingURL=companies.js.map