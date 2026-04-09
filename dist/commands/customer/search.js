"use strict";
/**
 * Customer search command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const customer_1 = require("../../schemas/resources/customer");
function searchCommand(customer) {
    customer
        .command('search')
        .description('Search customers')
        .option('-k, --keyword <keyword>', 'Search keyword (matches name, code, contact, phone, email)')
        .option('-p, --page <page>', 'Page number (starts from 1)', '1')
        .option('-s, --size <size>', 'Page size (max 500)', '20')
        .option('--created-after <date>', 'Filter by creation time (start date, YYYY-MM-DD)')
        .option('--created-before <date>', 'Filter by creation time (end date, YYYY-MM-DD)')
        .option('--updated-after <date>', 'Filter by last modification time (start date, YYYY-MM-DD)')
        .option('--updated-before <date>', 'Filter by last modification time (end date, YYYY-MM-DD)')
        .option('--sort-by <field>', 'Sort by field (e.g., creationTime, name)')
        .option('--sort-order <order>', 'Sort order (asc/desc)', 'asc')
        .addHelpText('after', `
Examples:
  # Search customers by keyword
  $ crm customer search --keyword "科技"
  
  # Search with pagination (page 2, 50 records per page)
  $ crm customer search --page 2 --size 50
  
  # Filter by creation date range
  $ crm customer search --created-after 2026-01-01 --created-before 2026-03-31
  
  # Search and sort by creation time (newest first)
  $ crm customer search --keyword "制造" --sort-by creationTime --sort-order desc
  
  # Export results as JSON
  $ crm customer search --keyword "汽车" --json > customers.json
  
  # Custom fields output (table format)
  $ crm customer search --fields id,name,industry,owner_name

Notes:
  - Keyword searches across: name, code, contact person, phone, email
  - Date filters use ISO format (YYYY-MM-DD)
  - Default sort order is ascending (asc)
  - Maximum page size is 500 records
  - Use --json for machine-readable output
`)
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build filter object
            const filter = {};
            if (options.keyword) {
                filter.LikeString = options.keyword;
            }
            if (options.createdAfter) {
                filter.CreationTimeStart = new Date(options.createdAfter).toISOString();
            }
            if (options.createdBefore) {
                filter.CreationTimeEnd = new Date(options.createdBefore + 'T23:59:59').toISOString();
            }
            if (options.updatedAfter) {
                filter.LastModificationTimeStart = new Date(options.updatedAfter).toISOString();
            }
            if (options.updatedBefore) {
                filter.LastModificationTimeEnd = new Date(options.updatedBefore + 'T23:59:59').toISOString();
            }
            if (options.sortBy) {
                filter.SortProperty = options.sortBy;
                filter.SortAsc = options.sortOrder !== 'desc';
            }
            // Build CRM API request body
            const requestBody = {
                maxResultCount: parseInt(options.size, 10),
                skipCount: (parseInt(options.page, 10) - 1) * parseInt(options.size, 10),
                Filter: filter,
            };
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/crm/custom/getList', requestBody, {
                traceId,
            });
            // Validate response
            const validated = customer_1.CustomerListResponseSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user', // Will be replaced with actual user
                action: 'customer.search',
                resource_type: 'customer',
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
                        'code',
                        'industry',
                        'status',
                        'owner_name',
                    ],
                    headers: {
                        id: 'ID',
                        name: 'Name',
                        code: 'Code',
                        industry: 'Industry',
                        status: 'Status',
                        owner_name: 'Owner',
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
//# sourceMappingURL=search.js.map