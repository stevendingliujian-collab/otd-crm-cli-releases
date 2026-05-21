"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dictCommands = dictCommands;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const dictionary_1 = require("../../utils/dictionary");
function dictCommands(program) {
    const dict = program
        .command('dict')
        .description('Dictionary lookup commands (数据字典查询)');
    dict
        .command('list')
        .description('List dictionary items')
        .requiredOption('--code <code>', 'Dictionary code')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const items = (0, dictionary_1.formatDictItems)(await (0, dictionary_1.fetchDictItems)(client, options.code, traceId));
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'dict.list',
                resource_type: 'dict',
                resource_id: options.code,
                meta: {
                    profile,
                    api_url: await client['axiosInstance'].defaults.baseURL || '',
                },
            });
            if (globalOpts.json) {
                console.log(JSON.stringify(items, null, 2));
            }
            else {
                const output = formatter_1.formatter.format(items, {
                    format: 'table',
                    fields: ['order', 'name', 'code', 'id', 'enabled'],
                    headers: {
                        order: 'Order',
                        name: 'Name',
                        code: 'Code',
                        id: 'ID',
                        enabled: 'Enabled',
                    },
                });
                console.log(output);
                console.log(`\nTotal: ${items.length} items (dictionary: ${options.code})`);
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
                if (cliError.hint)
                    console.error(`\n💡 Hint: ${cliError.hint}`);
                console.error(`\n🔍 Trace ID: ${traceId}`);
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=index.js.map