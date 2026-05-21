"use strict";
/**
 * Project update command
 *
 * 实现逻辑：先查询现有项目数据，再用用户传入的字段覆盖，实现指定字段更新。
 * 不更新：合同、客户、公司（这些关联关系不允许通过 update 修改）
 *
 * 项目阶段特殊处理：传入值可能是 id/code/name，统一转为 code + name
 * 项目类型/状态：传入值可能是 id/code/name，统一转为 id
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = updateCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const project_1 = require("../../schemas/resources/project");
const helpers_1 = require("./helpers");
function updateCommand(project) {
    project
        .command('update')
        .description('Update an existing project (修改项目)')
        .argument('<id>', 'Project ID')
        .option('-n, --name <name>', 'Project name (项目名称)')
        .option('--stage <stage>', 'Project stage (项目阶段, id/code/name)')
        .option('--project-type <type>', 'Project type (项目类型, id/code/name)')
        .option('--project-status <status>', 'Project status (项目状态, id/code/name)')
        .option('--plan-start-date <date>', 'Plan start date (立项时间, YYYY-MM-DD)')
        .option('--plan-online-date <date>', 'Expected acceptance date (预期验收时间, YYYY-MM-DD)')
        .option('--real-start-date <date>', 'Actual start date (实际启动日期, YYYY-MM-DD)')
        .option('--real-online-date <date>', 'Actual delivery date (实际交付日期, YYYY-MM-DD)')
        .option('--confirm-date <date>', 'Acceptance date (项目验收日期, YYYY-MM-DD)')
        .option('--maintenance-expire <date>', 'Maintenance expiry date (运维到期时间, YYYY-MM-DD)')
        .option('--estimated-memo-time <date>', 'Estimated memo time (预计备忘录时间, YYYY-MM-DD)')
        .option('--owner-id <id>', 'Owner ID (跟进人员ID)')
        .option('--owner <name>', 'Owner name (跟进人员)')
        .option('--project-manager-id <id>', 'Project manager ID')
        .option('--project-manager <name>', 'Project manager name')
        .option('--plan-spend-day <days>', 'Planned man-days (项目计划投入人天)', parseFloat)
        .option('--real-spend-day <days>', 'Actual man-days (项目实际发生工时)', parseFloat)
        .option('--sales-region <region>', 'Sales region (销售区域)')
        .option('--country <country>', 'Country (所属国家)')
        .option('--province <province>', 'Province (所属省份)')
        .option('--city <city>', 'City (所属城市)')
        .option('--district <district>', 'District (区县)')
        .addHelpText('after', `
Examples:
  # Update project stage
  $ crm project update <id> --stage "实施中"

  # Update maintenance expiry date
  $ crm project update <id> --maintenance-expire 2027-12-31

  # Update project status and manager
  $ crm project update <id> --project-status "进行中" --project-manager "张三"

  # Update multiple fields at once
  $ crm project update <id> --stage "验收" --real-online-date 2026-06-01

Note:
  - 合同、客户、公司等关联关系不允许通过 update 修改
  - 项目阶段传入 id/code/name 均可，自动转换
  - 更新前会先查询现有数据，仅覆盖指定字段
`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            // ── Step 1: 查询现有项目数据 ────────────────────────────────────
            if (globalOpts.verbose)
                formatter_1.formatter.info('Fetching current project data...');
            const current = await client.get('/api/crm/project/getProjectById', {
                params: { id },
                traceId,
            });
            if (!current || !current.id) {
                throw new Error(`Project not found: ${id}`);
            }
            // ── Step 2: 构建更新体（基于现有数据） ──────────────────────────
            // 保留现有字段，用户传入的覆盖
            const requestBody = {
                // 保留不可修改的关联字段
                code: current.code,
                name: current.name,
                contractId: current.contractId,
                contractCode: current.contractCode,
                contractName: current.contractName,
                customId: current.customId,
                customCode: current.customCode,
                customName: current.customName,
                companyId: current.companyId,
                companyName: current.companyName,
                // 保留现有可修改字段
                projectTypeId: current.projectTypeId,
                projectStatusId: current.projectStatusId,
                projectStage: current.projectStage,
                projectStageCode: current.projectStageCode,
                planStartDate: current.planStartDate,
                planOnlineDate: current.planOnlineDate,
                realStartDate: current.realStartDate,
                realOnlineDate: current.realOnlineDate,
                confirmDate: current.confirmDate,
                maintenanceExpire: current.maintenanceExpire,
                estimatedMemoTime: current.estimatedMemoTime,
                ownerId: current.ownerId,
                owner: current.owner,
                projectManagerId: current.projectManagerId,
                projectManager: current.projectManager,
                planSpendDay: current.planSpendDay,
                realSpendDay: current.realSpendDay,
                salesRegion: current.salesRegion,
                country: current.country,
                province: current.province,
                city: current.city,
                district: current.district,
                resourceFiles: current.resourceFiles || [],
            };
            // ── Step 3: 覆盖用户指定的字段 ─────────────────────────────────
            if (options.name)
                requestBody.name = options.name;
            // 项目阶段（特殊：传 code + name）
            if (options.stage) {
                const stage = await (0, helpers_1.resolveProjectStage)(client, options.stage, traceId);
                requestBody.projectStage = stage.name;
                requestBody.projectStageCode = stage.code;
            }
            // 项目类型（字典 ProjectType，存 id）
            if (options.projectType) {
                const pt = await (0, helpers_1.resolveDictId)(client, 'ProjectType', options.projectType, traceId);
                requestBody.projectTypeId = pt.id;
            }
            // 项目状态（字典 MarketingProject，存 id）
            if (options.projectStatus) {
                const ps = await (0, helpers_1.resolveDictId)(client, 'MarketingProject', options.projectStatus, traceId);
                requestBody.projectStatusId = ps.id;
            }
            // 日期字段
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
            if (options.estimatedMemoTime)
                requestBody.estimatedMemoTime = options.estimatedMemoTime;
            // 人员字段
            let ownerId = options.ownerId;
            let ownerName = options.owner;
            if (ownerId && !ownerName) {
                const resolved = await (0, helpers_1.resolveUserRef)(client, ownerId, traceId);
                ownerName = resolved.name;
            }
            else if (ownerName && !ownerId) {
                const resolved = await (0, helpers_1.resolveUserRef)(client, ownerName, traceId);
                ownerId = resolved.id;
            }
            let projectManagerId = options.projectManagerId;
            let projectManagerName = options.projectManager;
            if (projectManagerId && !projectManagerName) {
                const resolved = await (0, helpers_1.resolveUserRef)(client, projectManagerId, traceId);
                projectManagerName = resolved.name;
            }
            else if (projectManagerName && !projectManagerId) {
                const resolved = await (0, helpers_1.resolveUserRef)(client, projectManagerName, traceId);
                projectManagerId = resolved.id;
            }
            if (ownerId)
                requestBody.ownerId = ownerId;
            if (ownerName)
                requestBody.owner = ownerName;
            if (projectManagerId)
                requestBody.projectManagerId = projectManagerId;
            if (projectManagerName)
                requestBody.projectManager = projectManagerName;
            // 工时字段
            if (options.planSpendDay !== undefined)
                requestBody.planSpendDay = options.planSpendDay;
            if (options.realSpendDay !== undefined)
                requestBody.realSpendDay = options.realSpendDay;
            // 地区字段
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
            if (globalOpts.verbose) {
                formatter_1.formatter.info('Update body:');
                console.log(JSON.stringify(requestBody, null, 2));
            }
            // ── Step 4: 发送更新请求 ────────────────────────────────────────
            const response = await client.post(`/api/crm/project/update?id=${id}`, requestBody, {
                traceId,
            });
            // Validate response
            const validated = project_1.ProjectSchema.parse(response);
            // Log audit
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'project.update',
                resource_type: 'project',
                resource_id: id,
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
                formatter_1.formatter.success('✓ Project updated successfully');
                console.log(`\nProject ID: ${validated.id}`);
                console.log(`Name: ${validated.name}`);
                if (validated.code)
                    console.log(`Code: ${validated.code}`);
                if (validated.projectStage)
                    console.log(`Stage: ${validated.projectStage}`);
                if (validated.projectStatusName)
                    console.log(`Status: ${validated.projectStatusName}`);
                if (validated.maintenanceExpire)
                    console.log(`Maintenance Expire: ${validated.maintenanceExpire}`);
                if (validated.owner)
                    console.log(`Owner: ${validated.owner}`);
                if (validated.projectManager)
                    console.log(`PM: ${validated.projectManager}`);
                console.log(`\n💡 Tip: Use 'crm project get ${id}' to view full details`);
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
//# sourceMappingURL=update.js.map