"use strict";
/**
 * Followup search command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const followup_1 = require("../../schemas/resources/followup");
function searchCommand(followup) {
    followup
        .command('search')
        .description('Search followup records')
        .option('-k, --keyword <keyword>', 'Search keyword in content')
        .option('--related-id <id>', 'Filter by related object ID')
        .option('--related-type <type>', 'Filter by related type (0-7)', parseInt)
        .option('--customer-id <id>', 'Filter by customer ID (shorthand for --related-id + --related-type 1)')
        .option('--opportunity-id <id>', 'Filter by opportunity ID (shorthand for --related-id + --related-type 0)')
        .option('--type <type>', 'Filter by followup type (1-4)', parseInt)
        // P2 priority - date filters
        .option('--date-after <date>', 'Followup date >= (YYYY-MM-DD)')
        .option('--date-before <date>', 'Followup date <= (YYYY-MM-DD)')
        .option('--created-after <date>', 'Creation time >= (YYYY-MM-DD)')
        .option('--created-before <date>', 'Creation time <= (YYYY-MM-DD)')
        // Owner filter
        .option('--owner <name>', 'Filter by owner name')
        .option('--owner-id <uuid>', 'Filter by owner ID')
        .option('-p, --page <page>', 'Page number', '1')
        .option('-s, --size <size>', 'Page size', '20')
        .addHelpText('after', `
Examples:
  # Search all followup records for a customer
  $ crm followup search --customer-id 3a1973c6-0a85-b26f-1bbd-d236ff3e0250
  
  # Search followup records for an opportunity
  $ crm followup search --opportunity-id abc123-def456
  
  # Search by keyword
  $ crm followup search --keyword "技术方案"
  
  # Search recent followups (last 7 days)
  $ crm followup search --date-after 2026-03-27
  
  # Export as JSON
  $ crm followup search --customer-id xxx --json > followups.json

Notes:
  - --customer-id is shorthand for --related-id <id> --related-type 1
  - --opportunity-id is shorthand for --related-id <id> --related-type 0
  - Related types: 0=Opportunity, 1=Customer, 2=Contact
  - Followup types: 1=Phone, 2=Email, 3=Visit, 4=Other
  - Use --json for machine-readable output
`)
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build filter object
            const filter = {};
            // Keyword filter
            if (options.keyword) {
                filter.likeString = options.keyword;
            }
            // Related object filters (with shortcuts)
            if (options.customerId) {
                filter.relatedId = options.customerId;
                filter.relatedType = 1; // Customer
            }
            else if (options.opportunityId) {
                filter.relatedId = options.opportunityId;
                filter.relatedType = 0; // Opportunity
            }
            else {
                if (options.relatedId) {
                    filter.relatedId = options.relatedId;
                }
                if (options.relatedType !== undefined) {
                    filter.relatedType = options.relatedType;
                }
            }
            // Type filter
            if (options.type !== undefined) {
                filter.type = options.type;
            }
            // Followup date filters (P2)
            if (options.dateAfter) {
                filter.followUpDateStart = new Date(options.dateAfter).toISOString();
            }
            if (options.dateBefore) {
                filter.followUpDateEnd = new Date(options.dateBefore + 'T23:59:59').toISOString();
            }
            // Creation time filters
            if (options.createdAfter) {
                filter.creationTimeStart = new Date(options.createdAfter).toISOString();
            }
            if (options.createdBefore) {
                filter.creationTimeEnd = new Date(options.createdBefore + 'T23:59:59').toISOString();
            }
            // Owner filters
            if (options.ownerId) {
                filter.userId = options.ownerId;
            }
            // Build request body
            const requestBody = {
                pageIndex: parseInt(options.page, 10),
                pageSize: parseInt(options.size, 10),
                filter,
            };
            if (globalOpts.verbose) {
                formatter_1.formatter.info('Request filter:');
                console.log(JSON.stringify(filter, null, 2));
            }
            // Make API request
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/crm/followup/getList', requestBody, {
                traceId,
            });
            // Validate response
            const validated = followup_1.FollowupListResponseSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'followup.search',
                resource_type: 'followup',
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
                        'content',
                        'typeName',
                        'followUpDate',
                        'ownerName',
                    ],
                    headers: {
                        id: 'ID',
                        content: 'Content',
                        typeName: 'Type',
                        followUpDate: 'Date',
                        ownerName: 'Owner',
                    },
                });
                console.log(output);
                if (validated.totalCount > 0) {
                    console.log(`\nTotal: ${validated.totalCount} followup records`);
                }
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