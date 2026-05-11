"use strict";
/**
 * Project create command
 *
 * 必填字段：name, companyId, projectTypeId
 * 项目编号 code 不传则后端自动生成
 *
 * 名称自动补齐规则：
 *   - companyName: 如果只传 companyId，自动查询补齐
 *   - customName: 如果只传 customId，自动查询补齐
 *   - contractName/contractCode: 如果只传 contractId，自动查询补齐
 *   - projectStage/projectStageCode: 特殊处理，传入值可能是 id/code/name，统一转为 code+name
 *   - projectTypeId: 传入值可能是 id/code/name，统一转为 id
 *   - projectStatusId: 传入值可能是 id/code/name，统一转为 id
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const project_1 = require("../../schemas/resources/project");
const helpers_1 = require("./helpers");
function createCommand(project) {
    project
        .command('create')
        .description('Create a new project (新建项目)')
        .requiredOption('-n, --name <name>', 'Project name (项目名称)')
        .option('--company-id <id>', 'Company ID (公司ID, 不传则默认取第一个)')
        .option('--project-type <type>', 'Project type (项目类型, id/code/name, 不传则默认取第一个)')
        .option('--code <code>', 'Project code (项目编号, 不传则自动生成)')
        .option('--company-name <name>', 'Company name (不传则自动查询)')
        .option('--customer-id <id>', 'Customer ID (关联客户ID)')
        .option('--customer-name <name>', 'Customer name (不传则自动查询)')
        .option('--contract-id <id>', 'Contract ID (关联合同ID)')
        .option('--contract-name <name>', 'Contract name (不传则自动查询)')
        .option('--contract-code <code>', 'Contract code (不传则自动查询)')
        .option('--project-status <status>', 'Project status (项目状态, id/code/name)')
        .option('--stage <stage>', 'Project stage (项目阶段, id/code/name)')
        .option('--plan-start-date <date>', 'Plan start date (立项时间, YYYY-MM-DD)')
        .option('--plan-online-date <date>', 'Expected acceptance date (预期验收时间, YYYY-MM-DD)')
        .option('--real-start-date <date>', 'Actual start date (实际启动日期, YYYY-MM-DD)')
        .option('--real-online-date <date>', 'Actual delivery date (实际交付日期, YYYY-MM-DD)')
        .option('--confirm-date <date>', 'Acceptance date (项目验收日期, YYYY-MM-DD)')
        .option('--maintenance-expire <date>', 'Maintenance expiry date (运维到期时间, YYYY-MM-DD)')
        .option('--owner-id <id>', 'Owner ID (跟进人员ID)')
        .option('--owner <name>', 'Owner name (跟进人员)')
        .option('--project-manager-id <id>', 'Project manager ID')
        .option('--project-manager <name>', 'Project manager name')
        .option('--plan-spend-day <days>', 'Planned man-days (项目计划投入人天)', parseFloat)
        .option('--sales-region <region>', 'Sales region (销售区域)')
        .option('--country <country>', 'Country (所属国家)')
        .option('--province <province>', 'Province (所属省份)')
        .option('--city <city>', 'City (所属城市)')
        .option('--district <district>', 'District (区县)')
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            // ── 解析项目类型（未传则默认取第一个可用项）───────────────────
            let projectType;
            if (options.projectType) {
                projectType = await (0, helpers_1.resolveDictId)(client, 'ProjectType', options.projectType, traceId);
            }
            else {
                const items = await (0, helpers_1.getDictItems)(client, 'ProjectType', traceId);
                const first = items[0];
                if (!first) {
                    throw new Error('未找到可用的项目类型，请先检查 ProjectType 字典');
                }
                projectType = {
                    id: first.id,
                    name: first.displayText || '',
                };
            }
            // ── 解析项目状态（可选，字典 MarketingProject，存 id）─────────────
            let projectStatusId;
            if (options.projectStatus) {
                const ps = await (0, helpers_1.resolveDictId)(client, 'MarketingProject', options.projectStatus, traceId);
                projectStatusId = ps.id;
            }
            // ── 解析项目阶段（可选，字典 ProjectStage，存 code + name）────────
            let projectStage;
            let projectStageCode;
            if (options.stage) {
                const stage = await (0, helpers_1.resolveProjectStage)(client, options.stage, traceId);
                projectStage = stage.name;
                projectStageCode = stage.code;
            }
            // ── 解析公司（未传则默认取第一个可用项）──────────────────────────
            let companyId = options.companyId;
            let companyName = options.companyName;
            if (!companyId) {
                const companies = await (0, helpers_1.fetchCompanyList)(client, traceId);
                const firstCompany = companies[0];
                if (!firstCompany) {
                    throw new Error('未找到可用的公司，请先检查公司列表');
                }
                companyId = firstCompany.id;
                companyName = companyName || firstCompany.name;
            }
            // ── 自动补齐公司名称 ─────────────────────────────────────────────
            if (!companyName) {
                if (globalOpts.verbose)
                    formatter_1.formatter.info('Fetching company name...');
                companyName = await (0, helpers_1.fetchCompanyName)(client, companyId, traceId);
                if (!companyName) {
                    formatter_1.formatter.warn('Warning: 无法查询公司名称，请传 --company-name');
                }
            }
            // ── 自动补齐客户名称 ─────────────────────────────────────────────
            let customerName = options.customerName;
            if (options.customerId && !customerName) {
                if (globalOpts.verbose)
                    formatter_1.formatter.info('Fetching customer name...');
                customerName = await (0, helpers_1.fetchCustomerName)(client, options.customerId, traceId);
                if (!customerName) {
                    formatter_1.formatter.warn('Warning: 无法查询客户名称，请传 --customer-name');
                }
            }
            // ── 自动补齐合同名称/编号 ───────────────────────────────────────
            let contractName = options.contractName;
            let contractCode = options.contractCode;
            if (options.contractId && (!contractName || !contractCode)) {
                if (globalOpts.verbose)
                    formatter_1.formatter.info('Fetching contract info...');
                const info = await (0, helpers_1.fetchContractInfo)(client, options.contractId, traceId);
                if (info) {
                    if (!contractName)
                        contractName = info.name;
                    if (!contractCode)
                        contractCode = info.code;
                }
                if (!contractName) {
                    formatter_1.formatter.warn('Warning: 无法查询合同名称，请传 --contract-name');
                }
            }
            // ── 构建请求体 ──────────────────────────────────────────────────
            const requestBody = {
                name: options.name,
                companyId,
                projectTypeId: projectType.id,
            };
            if (companyName)
                requestBody.companyName = companyName;
            if (options.code)
                requestBody.code = options.code;
            if (options.customerId)
                requestBody.customId = options.customerId;
            if (customerName)
                requestBody.customName = customerName;
            if (options.contractId)
                requestBody.contractId = options.contractId;
            if (contractName)
                requestBody.contractName = contractName;
            if (contractCode)
                requestBody.contractCode = contractCode;
            if (projectStatusId)
                requestBody.projectStatusId = projectStatusId;
            if (projectStage)
                requestBody.projectStage = projectStage;
            if (projectStageCode)
                requestBody.projectStageCode = projectStageCode;
            if (options.planStartDate)
                requestBody.planStartDate = options.planStartDate;
            if (options.planOnlineDate)
                requestBody.planOnlineDate = options.planOnlineDate;
            if (options.realStartDate)
                requestBody.realStartDate = options.realStartDate;
            if (options.realOnlineDate)
                requestBody.realOnlineDate = options.realOnlineDate;
            if (options.confirmDate)
                requestBody.confirmDate = options.confirmDate;
            if (options.maintenanceExpire)
                requestBody.maintenanceExpire = options.maintenanceExpire;
            if (options.ownerId)
                requestBody.ownerId = options.ownerId;
            if (options.owner)
                requestBody.owner = options.owner;
            if (options.projectManagerId)
                requestBody.projectManagerId = options.projectManagerId;
            if (options.projectManager)
                requestBody.projectManager = options.projectManager;
            if (options.planSpendDay !== undefined)
                requestBody.planSpendDay = options.planSpendDay;
            if (options.salesRegion)
                requestBody.salesRegion = options.salesRegion;
            if (options.country)
                requestBody.country = options.country;
            if (options.province)
                requestBody.province = options.province;
            if (options.city)
                requestBody.city = options.city;
            if (options.district)
                requestBody.district = options.district;
            requestBody.resourceFiles = [];
            if (globalOpts.verbose) {
                formatter_1.formatter.info('Request body:');
                console.log(JSON.stringify(requestBody, null, 2));
            }
            // Make API request
            const response = await client.post('/api/crm/project/create', requestBody, {
                traceId,
            });
            // Validate response
            const validated = project_1.ProjectSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'project.create',
                resource_type: 'project',
                resource_id: validated.id,
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
                formatter_1.formatter.success('✓ Project created successfully');
                console.log(`\nProject ID: ${validated.id}`);
                console.log(`Name: ${validated.name}`);
                if (validated.code)
                    console.log(`Code: ${validated.code}`);
                if (validated.companyName)
                    console.log(`Company: ${validated.companyName}`);
                if (validated.customName)
                    console.log(`Customer: ${validated.customName}`);
                if (validated.projectTypeName)
                    console.log(`Type: ${validated.projectTypeName}`);
                if (validated.projectStage)
                    console.log(`Stage: ${validated.projectStage}`);
                if (validated.projectStatusName)
                    console.log(`Status: ${validated.projectStatusName}`);
                if (validated.maintenanceExpire)
                    console.log(`Maintenance Expire: ${validated.maintenanceExpire}`);
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
//# sourceMappingURL=create.js.map