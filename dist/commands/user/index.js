"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userCommands = userCommands;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const cli_error_1 = require("../../core/errors/cli-error");
const audit_logger_1 = require("../../core/audit/audit-logger");
const error_codes_1 = require("../../constants/error-codes");
const user_search_1 = require("../../utils/user-search");
const help_1 = require("../../utils/help");
function parsePositiveInt(value) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
        throw new Error('Expected a positive integer');
    }
    return parsed;
}
function userCommands(program) {
    const user = program
        .command('user')
        .description('User lookup commands (人员查询)');
    (0, help_1.addCommandGroupHelp)(user, {
        command: 'user',
        resource: 'user',
        searchExample: 'crm user search --help',
        getExample: 'crm user get --help',
    });
    user
        .command('search')
        .description('Search users')
        .requiredOption('--keyword <keyword>', 'Search keyword')
        .option('-p, --page <page>', 'Page number', parsePositiveInt, 1)
        .option('-s, --size <size>', 'Page size', parsePositiveInt, 10)
        .option('--active', 'Only active users')
        .option('--inactive', 'Only inactive users')
        .addHelpText('after', (0, help_1.searchResultHelp)('crm user search', 'user'))
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            if (options.active && options.inactive) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422, 'Cannot use --active and --inactive together', 'Choose one status filter');
            }
            const active = options.active ? true : options.inactive ? false : null;
            const client = (0, http_client_1.createClient)(profile);
            const result = await (0, user_search_1.searchUsersPage)(client, {
                keyword: options.keyword,
                page: options.page,
                size: options.size,
                active,
            }, traceId);
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'user.search',
                resource_type: 'user',
                resource_id: 'N/A',
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            if (globalOpts.json) {
                console.log(JSON.stringify(result, null, 2));
            }
            else {
                const output = formatter_1.formatter.format(result.items, {
                    format: 'table',
                    fields: ['id', 'name', 'userName', 'email', 'phoneNumber', 'isActive'],
                    headers: {
                        id: 'ID',
                        name: 'Name',
                        userName: 'Username',
                        email: 'Email',
                        phoneNumber: 'Phone',
                        isActive: 'Active',
                    },
                });
                console.log(output);
                console.log(`\nTotal: ${result.totalCount ?? result.items.length} users`);
            }
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
    user
        .command('get <id>')
        .description('Get user by ID')
        .addHelpText('after', (0, help_1.getByIdHelp)('user get', 'user', 'crm user search'))
        .action(async (id, _options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const result = await (0, user_search_1.getUserById)(client, id, traceId);
            if (!result) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.BIZ_404, `User not found: ${id}`, 'Check user ID');
            }
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'user.get',
                resource_type: 'user',
                resource_id: id,
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            if (globalOpts.json) {
                console.log(JSON.stringify(result, null, 2));
            }
            else {
                console.log(formatter_1.formatter.format(result, { format: 'table' }));
            }
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