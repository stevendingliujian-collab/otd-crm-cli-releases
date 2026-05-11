"use strict";
/**
 * Project search command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const project_1 = require("../../schemas/resources/project");
function searchCommand(project) {
    project
        .command('search')
        .description('Search projects (搜索项目列表)')
        .option('-k, --keyword <keyword>', 'Search keyword (模糊查询)')
        .option('--customer-name <name>', 'Filter by customer name')
        .option('--customer-id <id>', 'Filter by customer ID')
        .option('--contract-id <id>', 'Filter by contract ID')
        .option('--contract-name <name>', 'Filter by contract name')
        .option('--owner <owner>', 'Filter by owner name')
        .option('--owner-id <id>', 'Filter by owner ID')
        .option('--project-manager-id <id>', 'Filter by project manager ID')
        .option('--project-type-id <id>', 'Filter by project type ID')
        .option('--project-status-id <id>', 'Filter by project status ID')
        .option('--stage-code <code>', 'Filter by project stage code')
        .option('--city <city>', 'Filter by city')
        .option('--sales-region <region>', 'Filter by sales region')
        .option('--include-finished', 'Include finished projects')
        .option('--maintenance-expire-start <date>', 'Maintenance expire date >= (YYYY-MM-DD)')
        .option('--maintenance-expire-end <date>', 'Maintenance expire date <= (YYYY-MM-DD)')
        .option('--confirm-date-start <date>', 'Confirm date >= (YYYY-MM-DD)')
        .option('--confirm-date-end <date>', 'Confirm date <= (YYYY-MM-DD)')
        .option('--created-after <date>', 'Created time >= (YYYY-MM-DD)')
        .option('--created-before <date>', 'Created time <= (YYYY-MM-DD)')
        .option('--sort <field>', 'Sort field (name, code, creationTime, owner, projectManager, etc.)')
        .option('--sort-desc', 'Sort descending')
        .option('-p, --page <page>', 'Page number', '1')
        .option('-s, --size <size>', 'Page size', '20')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Build filter object
            const filter = {};
            if (options.keyword)
                filter.likeString = options.keyword;
            if (options.customerName)
                filter.customName = options.customerName;
            if (options.customerId)
                filter.customId = options.customerId;
            if (options.contractId)
                filter.contractId = options.contractId;
            if (options.contractName)
                filter.contractName = options.contractName;
            if (options.owner)
                filter.owner = options.owner;
            if (options.ownerId)
                filter.ownerId = options.ownerId;
            if (options.projectManagerId)
                filter.projectManagerId = options.projectManagerId;
            if (options.projectTypeId)
                filter.projectTypeId = options.projectTypeId;
            if (options.projectStatusId)
                filter.projectStatusId = options.projectStatusId;
            if (options.stageCode)
                filter.projectStageCode = options.stageCode;
            if (options.city)
                filter.city = options.city;
            if (options.salesRegion)
                filter.salesRegion = options.salesRegion;
            if (options.includeFinished)
                filter.isContainFinished = true;
            // Date range filters
            if (options.maintenanceExpireStart) {
                filter.maintenanceExpireStart = options.maintenanceExpireStart + 'T00:00:00';
            }
            if (options.maintenanceExpireEnd) {
                filter.maintenanceExpireEnd = options.maintenanceExpireEnd + 'T23:59:59';
            }
            if (options.confirmDateStart) {
                filter.confirmDateStart = options.confirmDateStart + 'T00:00:00';
            }
            if (options.confirmDateEnd) {
                filter.confirmDateEnd = options.confirmDateEnd + 'T23:59:59';
            }
            if (options.createdAfter) {
                const d = new Date(options.createdAfter + 'T00:00:00');
                d.setSeconds(d.getSeconds() - 1);
                filter.creationTimeStart = d.toISOString().replace('Z', '').split('.')[0];
            }
            if (options.createdBefore) {
                filter.creationTimeEnd = options.createdBefore + 'T23:59:59';
            }
            // Sort
            if (options.sort)
                filter.sortProperty = options.sort;
            if (options.sortDesc)
                filter.sortAsc = false;
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
            const response = await client.post('/api/crm/project/getList', requestBody, {
                traceId,
            });
            // Validate response
            const validated = project_1.ProjectListResponseSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'project.search',
                resource_type: 'project',
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
                        'customName',
                        'projectStage',
                        'projectStatusName',
                        'maintenanceExpire',
                        'owner',
                    ],
                    headers: {
                        id: 'ID',
                        name: 'Name',
                        code: 'Code',
                        customName: 'Customer',
                        projectStage: 'Stage',
                        projectStatusName: 'Status',
                        maintenanceExpire: 'Maint. Expire',
                        owner: 'Owner',
                    },
                });
                console.log(output);
                if (validated.totalCount > 0) {
                    console.log(`\nTotal: ${validated.totalCount} projects (page ${options.page})`);
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