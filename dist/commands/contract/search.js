"use strict";
/**
 * Contract search command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const contract_1 = require("../../schemas/resources/contract");
function searchCommand(contract) {
    contract
        .command('search')
        .description('Search contracts')
        .option('-k, --keyword <keyword>', 'Search keyword')
        .option('--customer-name <name>', 'Filter by customer name')
        .option('--customer-id <id>', 'Filter by customer ID')
        .option('--owner <owner>', 'Filter by owner name')
        .option('--signed', 'Filter by signed contracts only')
        // P2 priority - date and amount filters
        .option('--signed-after <date>', 'Signed date >= (YYYY-MM-DD)')
        .option('--signed-before <date>', 'Signed date <= (YYYY-MM-DD)')
        .option('--amount-min <number>', 'Contract amount >= (in CNY)', parseFloat)
        .option('--amount-max <number>', 'Contract amount <= (in CNY)', parseFloat)
        .option('--status <status>', 'Filter by contract status name')
        .option('--created-after <date>', 'Created time >= (YYYY-MM-DD)')
        .option('--created-before <date>', 'Created time <= (YYYY-MM-DD)')
        .option('-p, --page <page>', 'Page number', '1')
        .option('-s, --size <size>', 'Page size', '20')
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
            // Customer filters
            if (options.customerName) {
                filter.customName = options.customerName;
            }
            if (options.customerId) {
                filter.customId = options.customerId;
            }
            // Owner filter
            if (options.owner) {
                filter.owner = options.owner;
            }
            // Signed filter
            if (options.signed) {
                filter.isSigned = true;
            }
            // Signed date filters (P2)
            if (options.signedAfter) {
                const d = new Date(options.signedAfter + 'T00:00:00');
                d.setSeconds(d.getSeconds() - 1);
                filter.signedDateStart = d.toISOString().replace('Z', '').split('.')[0];
            }
            if (options.signedBefore) {
                filter.signedDateEnd = options.signedBefore + 'T23:59:59';
            }
            // Amount filters (P2)
            if (options.amountMin !== undefined) {
                filter.rateAmountStart = options.amountMin;
            }
            if (options.amountMax !== undefined) {
                filter.rateAmountEnd = options.amountMax;
            }
            // Status filter (P2)
            // Note: Backend uses contractStatusId (GUID), but we accept status name
            // Would need to lookup status ID by name, similar to opportunity stage
            if (options.status) {
                // For now, just pass as-is and let backend handle
                filter.docStatus = options.status;
            }
            // Creation time filters
            if (options.createdAfter) {
                const d = new Date(options.createdAfter + 'T00:00:00');
                d.setSeconds(d.getSeconds() - 1);
                filter.creationTimeStart = d.toISOString().replace('Z', '').split('.')[0];
            }
            if (options.createdBefore) {
                filter.creationTimeEnd = options.createdBefore + 'T23:59:59';
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
            const response = await client.post('/api/crm/contract/getList', requestBody, {
                traceId,
            });
            // Validate response
            const validated = contract_1.ContractListResponseSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'contract.search',
                resource_type: 'contract',
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
                        'customName',
                        'signedDate',
                        'rateAmount',
                        'contractStatusName',
                    ],
                    headers: {
                        id: 'ID',
                        name: 'Name',
                        customName: 'Customer',
                        signedDate: 'Signed Date',
                        rateAmount: 'Amount',
                        contractStatusName: 'Status',
                    },
                });
                console.log(output);
                if (validated.totalCount > 0) {
                    console.log(`\nTotal: ${validated.totalCount} contracts`);
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