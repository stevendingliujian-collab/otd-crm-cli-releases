"use strict";
/**
 * Followup create command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const followup_1 = require("../../schemas/resources/followup");
// relatedType string aliases → numeric value
// Source: FollowUpRelatedTypeEnum in OtdCrmBackEnd
// Business=0, Customer=1, Contact=2, CustomerBiz=3, Project=4, Clue=5, Contract=6, Receive=7
const RELATED_TYPE_MAP = {
    business: 0, '商机': 0,
    customer: 1, '客户': 1,
    contact: 2, '联系人': 2,
    project: 4, '项目': 4,
    clue: 5, '线索': 5,
    contract: 6, '合同': 6,
    receivable: 7, '应收款': 7,
};
// followup type string aliases → numeric value
const FOLLOWUP_TYPE_MAP = {
    other: 0, '其他': 0,
    phone: 1, '电话': 1,
    wechat: 2, '微信': 2,
    visit: 3, '拜访': 3,
};
function resolveRelatedType(raw) {
    if (RELATED_TYPE_MAP[raw] !== undefined)
        return RELATED_TYPE_MAP[raw];
    const n = parseInt(raw, 10);
    if (!isNaN(n))
        return n;
    throw new Error(`Invalid --related-type "${raw}". Valid values: business(0), customer(1), contact(2), project(4), clue(5), contract(6), receivable(7)`);
}
function resolveFollowupType(raw) {
    if (FOLLOWUP_TYPE_MAP[raw] !== undefined)
        return FOLLOWUP_TYPE_MAP[raw];
    const n = parseInt(raw, 10);
    if (!isNaN(n))
        return n;
    throw new Error(`Invalid --type "${raw}". Valid values: phone(1), wechat(2), visit(3), other(0)`);
}
function createCommand(followup) {
    followup
        .command('create')
        .description('Create a new followup record (跟进记录)')
        .requiredOption('--related-id <id>', 'Related object ID (UUID)')
        .requiredOption('--related-type <type>', 'Related object type: business(0), customer(1), contact(2), project(4), clue(5), contract(6), receivable(7)')
        .requiredOption('--type <type>', 'Followup method: phone(1), wechat(2), visit(3), other(0)')
        .requiredOption('--content <content>', 'Followup content (min 10 chars)')
        .requiredOption('--related-title <title>', 'Related object name (显示用，如客户名/商机名/应收款名)')
        .requiredOption('--date <date>', 'Followup date (YYYY-MM-DD)')
        .option('--next-plan <plan>', 'Next step plan')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
关联对象类型 (--related-type):
  business  / 商机    → 0
  customer  / 客户    → 1
  contact   / 联系人  → 2
  project   / 项目    → 4
  clue      / 线索    → 5
  contract  / 合同    → 6
  receivable / 应收款 → 7

跟进方式 (--type):
  phone  / 电话 → 1   (📞 电话沟通)
  wechat / 微信 → 2   (💬 微信沟通)
  visit  / 拜访 → 3   (🚶 客户拜访)
  other  / 其他 → 0   (💼 其他方式)

Examples:
  $ crm followup create \\
      --related-id <customerId> --related-type customer \\
      --type phone --content "电话沟通，确认项目进度，客户表示下周可以安排演示"

  $ crm followup create \\
      --related-id <receivableId> --related-type receivable \\
      --type visit --content "现场拜访，催收第一期款项，客户承诺本月底付款" \\
      --date 2026-04-15 --next-plan "跟进付款情况"

  $ crm followup create \\
      --related-id <businessId> --related-type business \\
      --type wechat --content "微信确认方案细节，客户已收到报价单，需要内部讨论" \\
      --json
`)
        .action(async (options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const relatedType = resolveRelatedType(options.relatedType);
            const followupType = resolveFollowupType(options.type);
            // Build request body
            const body = {
                relatedId: options.relatedId,
                relatedType,
                type: followupType,
                content: options.content,
            };
            body.relatedTitle = options.relatedTitle;
            body.followUpDate = options.date.includes('T')
                ? options.date
                : new Date(options.date + 'T00:00:00.000Z').toISOString();
            if (options.nextPlan)
                body.nextPlan = options.nextPlan;
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.post('/api/crm/followup/create', body, { traceId });
            const parseResult = followup_1.FollowupSchema.safeParse(response);
            const validated = parseResult.success
                ? parseResult.data
                : (response && typeof response === 'object' ? response : {});
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'followup.create',
                resource_type: 'followup',
                resource_id: validated.id,
                meta: { profile, api_url: '' },
            });
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: validated, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Followup record created successfully');
                if (validated.id)
                    formatter_1.formatter.info(`ID: ${validated.id}`);
                formatter_1.formatter.info(`Type: ${options.type}`);
                if (validated.followUpDate)
                    formatter_1.formatter.info(`Date: ${validated.followUpDate}`);
                if (validated.content)
                    formatter_1.formatter.info(`Content: ${validated.content.substring(0, 60)}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (options.json || (command.optsWithGlobals()).json) {
                console.error(formatter_1.formatter.formatJson({
                    success: false,
                    error: { code: cliError.code, message: cliError.message, hint: cliError.hint },
                    trace_id: traceId
                }));
            }
            else {
                formatter_1.formatter.error(`${cliError.code}: ${cliError.message}`);
                if (cliError.hint)
                    formatter_1.formatter.info(`Hint: ${cliError.hint}`);
                console.error(`\n🔍 Trace ID: ${traceId}`);
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=create.js.map