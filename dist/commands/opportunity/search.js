"use strict";
/**
 * Opportunity search command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const opportunity_1 = require("../../schemas/resources/opportunity");
function searchCommand(opportunity) {
    opportunity
        .command('search')
        .description('Search opportunities (sales deals)')
        .option('-k, --keyword <keyword>', 'Search keyword (matches name, customer, description)')
        .option('-p, --page <page>', 'Page number (starts from 1)', '1')
        .option('-s, --size <size>', 'Page size (max 500)', '20')
        // Stage filters
        .option('--stage <name>', 'Filter by stage name (e.g., "报价", "方案", "谈判")')
        .option('--stage-id <uuid>', 'Filter by stage ID (UUID)')
        // Owner filters
        .option('--owner <name>', 'Filter by owner name (sales rep)')
        .option('--owner-id <uuid>', 'Filter by owner ID (UUID)')
        // Customer filter
        .option('--customer-id <uuid>', 'Filter by customer ID (UUID)')
        // Expected complete date filters
        .option('--expected-after <date>', 'Expected close date >= (YYYY-MM-DD)')
        .option('--expected-before <date>', 'Expected close date <= (YYYY-MM-DD)')
        // Amount filters
        .option('--amount-min <number>', 'Expected amount >= (in CNY, e.g., 100000)', parseFloat)
        .option('--amount-max <number>', 'Expected amount <= (in CNY, e.g., 5000000)', parseFloat)
        // Creation time filters
        .option('--created-after <date>', 'Created date >= (YYYY-MM-DD)')
        .option('--created-before <date>', 'Created date <= (YYYY-MM-DD)')
        // Last modification time filters (for stale opportunity detection)
        .option('--updated-after <date>', 'Last modified >= (YYYY-MM-DD)')
        .option('--updated-before <date>', 'Last modified <= (YYYY-MM-DD, used for stale detection)')
        .option('--followup-before <date>', 'Last followup date <= (YYYY-MM-DD, more precise than --updated-before)')
        // Sorting
        .option('--sort-by <field>', 'Sort by field (CreationTime, ExpectedCompleteDate, ExpectedTransAmount)')
        .option('--sort-order <order>', 'Sort order (asc/desc)', 'asc')
        .addHelpText('after', `
Examples:
  # Search opportunities by keyword
  $ crm opportunity search --keyword "MES"
  
  # Filter by stage
  $ crm opportunity search --stage "报价"
  
  # Filter by expected close date (Q1 2026)
  $ crm opportunity search --expected-after 2026-01-01 --expected-before 2026-03-31
  
  # Filter by amount range (100K-500K)
  $ crm opportunity search --amount-min 100000 --amount-max 500000
  
  # Find stale opportunities (no followup in 30 days)
  $ crm opportunity search --followup-before 2026-03-04
  
  # Find opportunities not updated in 30 days (alternative method)
  $ crm opportunity search --updated-before 2026-03-01
  
  # Filter by owner and sort by amount (highest first)
  $ crm opportunity search --owner "张三" --sort-by ExpectedTransAmount --sort-order desc
  
  # Export high-value deals as JSON
  $ crm opportunity search --amount-min 1000000 --json > high-value-deals.json
  
  # Custom fields output
  $ crm opportunity search --fields id,name,businessProcessName,expectedTransAmount

Notes:
  - Keyword searches across: name, customer name, description
  - Stage names: 报价, 方案, 谈判, 签约, etc. (use --verbose to see stage lookup)
  - Amount is in CNY (Chinese Yuan)
  - --followup-before: precise last followup date filter (recommended)
  - --updated-before: calculates days without update (fallback method)
  - Default sort order is ascending (asc)
  - Maximum page size is 500 records
  - Use --json for machine-readable output
  - Use --verbose to see detailed filter logic
`)
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            // Build filter object
            const filter = {};
            // Keyword filter
            if (options.keyword) {
                filter.LikeString = options.keyword;
            }
            // Stage filters
            if (options.stageId) {
                filter.BusinessProcessId = options.stageId;
            }
            else if (options.stage) {
                // Lookup stage ID by name
                if (globalOpts.verbose) {
                    formatter_1.formatter.info(`Looking up stage ID for: ${options.stage}`);
                }
                const stagesResponse = await client.get('/api/crm/project/getProjectStatussByCode', {
                    params: { code: 'BusinessProcess' },
                    traceId,
                });
                const stage = stagesResponse.find((s) => s.displayText === options.stage || s.code === options.stage);
                if (!stage) {
                    throw new Error(`Stage not found: ${options.stage}`);
                }
                filter.BusinessProcessId = stage.id;
                if (globalOpts.verbose) {
                    formatter_1.formatter.info(`Found stage ID: ${stage.id}`);
                }
            }
            // Owner filters
            if (options.ownerId) {
                filter.OwnerId = options.ownerId;
            }
            else if (options.owner) {
                filter.Owner = options.owner;
            }
            // Customer filter
            if (options.customerId) {
                filter.CustomId = options.customerId;
            }
            // Expected complete date filters
            if (options.expectedAfter) {
                filter.ExpectedCompleteDateStart = new Date(options.expectedAfter).toISOString();
            }
            if (options.expectedBefore) {
                filter.ExpectedCompleteDateEnd = new Date(options.expectedBefore + 'T23:59:59').toISOString();
            }
            // Amount filters
            if (options.amountMin !== undefined) {
                filter.ExpectedTransAmountStart = options.amountMin;
            }
            if (options.amountMax !== undefined) {
                filter.ExpectedTransAmountEnd = options.amountMax;
            }
            // Creation time filters
            if (options.createdAfter) {
                filter.CreationTimeStart = new Date(options.createdAfter).toISOString();
            }
            if (options.createdBefore) {
                filter.CreationTimeEnd = new Date(options.createdBefore + 'T23:59:59').toISOString();
            }
            // Last modification time filters (for stale opportunity detection)
            // Note: Backend uses LastFollowUpDateOutDays for "X days without update"
            if (options.followupBefore) {
                // Use LastFollowUpDateEnd for precise followup date filter
                filter.LastFollowUpDateEnd = new Date(options.followupBefore + 'T23:59:59').toISOString();
            }
            else if (options.updatedBefore) {
                // Calculate days from updated-before to today (fallback method)
                const beforeDate = new Date(options.updatedBefore);
                const today = new Date();
                const daysDiff = Math.floor((today.getTime() - beforeDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff > 0) {
                    filter.LastFollowUpDateOutDays = daysDiff;
                }
            }
            // Sorting
            if (options.sortBy) {
                filter.SortProperty = options.sortBy;
                filter.SortAsc = options.sortOrder === 'asc';
            }
            // Build request body
            const requestBody = {
                maxResultCount: parseInt(options.size, 10),
                skipCount: (parseInt(options.page, 10) - 1) * parseInt(options.size, 10),
                Filter: filter,
            };
            if (globalOpts.verbose) {
                formatter_1.formatter.info('Request filter:');
                console.log(JSON.stringify(filter, null, 2));
            }
            // Make API request
            const response = await client.post('/api/crm/business/getList', requestBody, {
                traceId,
            });
            // Validate response
            const validated = opportunity_1.OpportunityListResponseSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'opportunity.search',
                resource_type: 'opportunity',
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
                        'businessProcessName',
                        'owner',
                        'expectedTransAmount',
                        'expectedCompleteDate',
                    ],
                    headers: {
                        id: 'ID',
                        name: 'Name',
                        businessProcessName: 'Stage',
                        owner: 'Owner',
                        expectedTransAmount: 'Amount',
                        expectedCompleteDate: 'Expected Date',
                    },
                });
                console.log(output);
                if (validated.totalCount > 0) {
                    console.log(`\nTotal: ${validated.totalCount} opportunities`);
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