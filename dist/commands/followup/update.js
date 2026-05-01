"use strict";
/**
 * Update followup command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFollowupCommand = updateFollowupCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const followup_1 = require("../../schemas/resources/followup");
// followup type string aliases → numeric value
const FOLLOWUP_TYPE_MAP = {
    other: 0, '其他': 0,
    phone: 1, '电话': 1,
    wechat: 2, '微信': 2,
    visit: 3, '拜访': 3,
};
function resolveFollowupType(raw) {
    if (FOLLOWUP_TYPE_MAP[raw] !== undefined)
        return FOLLOWUP_TYPE_MAP[raw];
    const n = parseInt(raw, 10);
    if (!isNaN(n))
        return n;
    throw new Error(`Invalid --type "${raw}". Valid values: phone(1), wechat(2), visit(3), other(0)`);
}
function updateFollowupCommand(followup) {
    followup
        .command('update <id>')
        .description('Update an existing followup record')
        .option('--content <content>', 'Followup content')
        .option('--date <date>', 'Follow-up date (YYYY-MM-DD)')
        .option('--next-date <date>', 'Next follow-up date (YYYY-MM-DD)')
        .option('--type <type>', 'Follow-up type: phone(1), wechat(2), visit(3), other(0)')
        .option('--next-plan <plan>', 'Next step plan')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # Update followup content
  $ crm followup update <id> --content "电话确认，客户已同意方案，下周签合同"

  # Update followup date and type
  $ crm followup update <id> --date 2026-04-15 --type visit

  # Update next followup date and plan
  $ crm followup update <id> --next-date 2026-04-20 --next-plan "跟进合同签署进度"

  # Output as JSON
  $ crm followup update <id> --content "..." --json

Notes:
  - At least one option must be provided
  - --type values: phone/电话(1), wechat/微信(2), visit/拜访(3), other/其他(0)
  - --date format: YYYY-MM-DD
`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            if (!options.content && !options.date && !options.nextDate && !options.type && !options.nextPlan) {
                throw new Error('At least one option must be provided: --content, --date, --next-date, --type, --next-plan');
            }
            const client = (0, http_client_1.createClient)(profile);
            // Get current followup data
            if (process.env.DEBUG_CRM) {
                console.error(`[DEBUG] Fetching current followup data for ${id}...`);
            }
            const current = await client.get(`/api/crm/followup/get?id=${id}`, { traceId });
            if (process.env.DEBUG_CRM) {
                console.error(`[DEBUG] Current data:`, JSON.stringify(current));
            }
            // Resolve type if provided
            const resolvedType = options.type !== undefined
                ? resolveFollowupType(options.type)
                : current.followUpType;
            // Build update payload (merge with current data)
            const updateData = {
                id: current.id || id,
                content: options.content || current.content,
                followUpDate: options.date
                    ? (options.date.includes('T') ? options.date : new Date(options.date + 'T00:00:00.000Z').toISOString())
                    : current.followUpDate,
                nextFollowUpDate: options.nextDate || current.nextFollowUpDate,
                type: resolvedType,
                nextPlan: options.nextPlan || current.nextPlan,
                // Preserve required fields from current record
                relatedId: current.relatedId,
                relatedType: current.relatedType,
                relatedTitle: current.relatedTitle,
            };
            if (current.ownerId)
                updateData.ownerId = current.ownerId;
            if (current.owner)
                updateData.owner = current.owner;
            if (process.env.DEBUG_CRM) {
                console.error(`[DEBUG] Calling POST /api/crm/followup/update?id=${id} with:`, JSON.stringify(updateData));
            }
            const response = await client.post(`/api/crm/followup/update?id=${id}`, updateData, { traceId });
            if (process.env.DEBUG_CRM) {
                console.error(`[DEBUG] Response:`, JSON.stringify(response));
            }
            // Try to parse as full followup; fall back to raw response
            const parseResult = followup_1.FollowupSchema.safeParse(response);
            const updated = parseResult.success
                ? parseResult.data
                : (response && typeof response === 'object' ? response : { id });
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'followup.update',
                resource_type: 'followup',
                resource_id: id,
                meta: { profile, api_url: '' },
                changes: {
                    fields_updated: ['content', 'date', 'nextDate', 'type', 'nextPlan'].filter(k => options[k] !== undefined),
                },
            });
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: updated, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Followup record updated successfully');
                formatter_1.formatter.info(`ID: ${id}`);
                if (updateData.followUpDate)
                    formatter_1.formatter.info(`Date: ${updateData.followUpDate}`);
                if (updateData.content)
                    formatter_1.formatter.info(`Content: ${String(updateData.content).substring(0, 60)}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (options.json || (command.optsWithGlobals()).json) {
                console.error(formatter_1.formatter.formatJson({
                    success: false,
                    error: { code: cliError.code, message: cliError.message, hint: cliError.hint },
                    trace_id: traceId,
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
//# sourceMappingURL=update.js.map