"use strict";
/**
 * Clue search command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const clue_1 = require("../../schemas/resources/clue");
const param_builder_1 = require("../../utils/param-builder");
function searchCommand(clue) {
    clue
        .command('search')
        .description('Search clues (leads)')
        .option('-k, --keyword <keyword>', 'Search keyword (matches name, contact, phone, email, company)')
        .option('-p, --page <page>', 'Page number (starts from 1)', '1')
        .option('-s, --size <size>', 'Page size (max 500)', '20')
        .addHelpText('after', `
Examples:
  # Search clues by keyword
  $ crm clue search --keyword "张三"
  
  # Search with pagination
  $ crm clue search --page 2 --size 50
  
  # Export all clues as JSON
  $ crm clue search --size 1000 --json > clues.json
  
  # Custom fields output (table format)
  $ crm clue search --fields id,name,owner --keyword "北京"

Notes:
  - Keyword searches across: name, contact person, phone, email, company name
  - Clues are potential customers (leads) not yet converted
  - Use 'crm clue convert <id>' to convert a clue to a customer
  - Maximum page size is 500 records
  - Use --json for machine-readable output
`)
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build CRM API request body
            const requestBody = (0, param_builder_1.buildPagedRequest)({
                keyword: options.keyword,
                page: parseInt(options.page, 10),
                size: parseInt(options.size, 10),
            });
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/crm/clue/getList', requestBody, {
                traceId,
            });
            // Validate response
            const validated = clue_1.ClueListResponseSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'clue.search',
                resource_type: 'clue',
                resource_id: 'N/A',
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
                const output = formatter_1.formatter.format(validated.items, {
                    format: 'table',
                    fields: globalOpts.fields?.split(',') || [
                        'id',
                        'name',
                        'owner',
                    ],
                    headers: {
                        id: 'ID',
                        name: 'Name',
                        owner: 'Owner',
                    },
                });
                console.log(output);
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
//# sourceMappingURL=search.js.map