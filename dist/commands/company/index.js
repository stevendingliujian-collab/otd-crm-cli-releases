"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyCommands = companyCommands;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const company_1 = require("../../utils/company");
const help_1 = require("../../utils/help");
function outputCompanies(companies, globalOpts) {
    if (globalOpts.json) {
        console.log(JSON.stringify(companies, null, 2));
        return;
    }
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
function companyCommands(program) {
    const company = program
        .command('company')
        .description('Company lookup commands (公司查询)');
    (0, help_1.addCommandGroupHelp)(company, {
        command: 'company',
        resource: 'company',
        searchExample: 'crm company search --help',
        getExample: 'crm company list --help',
        extraNotes: ['This command group currently has list/search only.'],
    });
    company
        .command('list')
        .description('List companies')
        .action(async (_options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const companies = await (0, company_1.fetchCompanyList)(client, traceId);
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'company.list',
                resource_type: 'company',
                resource_id: 'N/A',
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            outputCompanies(companies, globalOpts);
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (command.optsWithGlobals().json) {
                console.error(JSON.stringify({ error: { code: cliError.code, message: cliError.message, hint: cliError.hint, trace_id: traceId } }, null, 2));
            }
            else {
                formatter_1.formatter.error(`Error: ${cliError.code}`);
                console.error(`   ${cliError.message}`);
                if (cliError.hint)
                    console.error(`\n💡 Hint: ${cliError.hint}`);
                console.error(`\n🔍 Trace ID: ${traceId}`);
            }
            process.exit(1);
        }
    });
    company
        .command('search')
        .description('Search companies by id, code, or name')
        .requiredOption('--keyword <keyword>', 'Search keyword')
        .addHelpText('after', (0, help_1.searchResultHelp)('crm company search', 'company', 'company search accepts id, code, or name as keyword'))
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const companies = (0, company_1.searchCompanies)(await (0, company_1.fetchCompanyList)(client, traceId), options.keyword);
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'company.search',
                resource_type: 'company',
                resource_id: 'N/A',
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            outputCompanies(companies, globalOpts);
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (command.optsWithGlobals().json) {
                console.error(JSON.stringify({ error: { code: cliError.code, message: cliError.message, hint: cliError.hint, trace_id: traceId } }, null, 2));
            }
            else {
                formatter_1.formatter.error(`Error: ${cliError.code}`);
                console.error(`   ${cliError.message}`);
                if (cliError.hint)
                    console.error(`\n💡 Hint: ${cliError.hint}`);
                console.error(`\n🔍 Trace ID: ${traceId}`);
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=index.js.map