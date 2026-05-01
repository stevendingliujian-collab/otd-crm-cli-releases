"use strict";
/**
 * Opportunity update command
 *
 * Uses /api/crm/business/updatePartial — true partial update.
 * Only the fields explicitly passed on the CLI are sent to the backend.
 * Un-passed fields are NOT included in the request body and are left untouched.
 *
 * DO NOT use /api/crm/business/update — that endpoint does a full replace
 * and will clear any field not explicitly included in the payload.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = updateCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const cli_error_1 = require("../../core/errors/cli-error");
const audit_logger_1 = require("../../core/audit/audit-logger");
const opportunity_1 = require("../../schemas/resources/opportunity");
const error_codes_1 = require("../../constants/error-codes");
function updateCommand(opportunity) {
    opportunity
        .command('update <id>')
        .description('Update an existing opportunity (partial update — only provided fields are changed)')
        .option('--name <name>', 'Opportunity name')
        .option('--stage <name>', 'Business stage/process name (fuzzy matched against available stages)')
        .option('--amount <number>', 'Expected transaction amount (含税)', parseFloat)
        .option('--amount-no-tax <number>', 'Expected transaction amount (不含税)', parseFloat)
        .option('--probability <value>', 'Expected probability, e.g. 80 or 80%')
        .option('--expected-date <date>', 'Expected completion date (YYYY-MM-DD)')
        .option('--impl-cycle <months>', 'Expected implementation cycle (months)', parseFloat)
        .option('--description <text>', 'Opportunity description')
        .option('--capital-type-id <id>', 'Currency/capital type ID (UUID)')
        .option('--business-type-id <id>', 'Business type ID (UUID)')
        .option('--business-priority-id <id>', 'Priority ID (UUID)')
        .option('--business-source-id <id>', 'Source ID (UUID)')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Notes:
  - Uses /updatePartial: only the fields you pass are updated, everything else untouched.
  - --stage accepts a stage name (fuzzy matched). Run 'crm opportunity stages' to list names.
  - --probability accepts a number (80) or a string with percent sign (80%).
  - --amount and --amount-no-tax are in CNY by default unless --capital-type-id is set.

Examples:
  $ crm opportunity update <id> --amount 250000
  $ crm opportunity update <id> --stage "报价" --expected-date 2026-06-30
  $ crm opportunity update <id> --amount 250000 --impl-cycle 3 --probability 60
  $ crm opportunity update <id> --name "新商机名称" --description "项目背景说明"
`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        const globalOpts = command.optsWithGlobals();
        try {
            const profile = globalOpts.profile || 'default';
            // ── Validate at least one field provided ──────────────────────────────
            const knownFields = [
                'name', 'stage', 'amount', 'amountNoTax', 'probability',
                'expectedDate', 'implCycle', 'description',
                'capitalTypeId', 'businessTypeId', 'businessPriorityId', 'businessSourceId',
            ];
            const hasAny = knownFields.some(f => options[f] !== undefined);
            if (!hasAny) {
                throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422_REQUIRED, 'At least one field must be provided', 'Options: --name, --stage, --amount, --amount-no-tax, --probability, --expected-date, --impl-cycle, --description, --capital-type-id, --business-type-id, --business-priority-id, --business-source-id');
            }
            const client = (0, http_client_1.createClient)(profile);
            // ── Build partial update body — only include what was passed ──────────
            const body = {};
            if (options.name !== undefined) {
                body.name = options.name;
            }
            if (options.amount !== undefined) {
                body.expectedTransAmount = options.amount;
            }
            if (options.amountNoTax !== undefined) {
                body.expectedTransNoRateAmount = options.amountNoTax;
            }
            if (options.probability !== undefined) {
                // Accept "80" or "80%" — normalize to string with %
                const raw = String(options.probability).trim().replace(/%$/, '');
                body.expectedTransProbability = `${raw}%`;
            }
            if (options.expectedDate !== undefined) {
                body.expectedCompleteDate = options.expectedDate;
            }
            if (options.implCycle !== undefined) {
                body.expectedImpleCycle = options.implCycle;
            }
            if (options.description !== undefined) {
                body.description = options.description;
            }
            if (options.capitalTypeId !== undefined) {
                body.capitalTypeId = options.capitalTypeId;
            }
            if (options.businessTypeId !== undefined) {
                body.businessTypeId = options.businessTypeId;
            }
            if (options.businessPriorityId !== undefined) {
                body.businessPriorityId = options.businessPriorityId;
            }
            if (options.businessSourceId !== undefined) {
                body.businessSourceId = options.businessSourceId;
            }
            // ── Stage: name → ID lookup ───────────────────────────────────────────
            if (options.stage !== undefined) {
                const stages = await client.get('/api/crm/businessprocess/getList?businessType=0', { traceId });
                if (!Array.isArray(stages?.items)) {
                    throw new Error('Failed to fetch business stages');
                }
                // Exact match first, then case-insensitive contains
                const exact = stages.items.find((s) => s.name === options.stage);
                const fuzzy = exact ?? stages.items.find((s) => s.name?.toLowerCase().includes(options.stage.toLowerCase()));
                if (!fuzzy) {
                    const available = stages.items.map((s) => s.name).join(', ');
                    throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422, `Stage "${options.stage}" not found`, `Available stages: ${available}`);
                }
                body.businessProcessId = fuzzy.id;
                // Do NOT include businessProcessName — backend resolves the name from ID
            }
            // ── Call updatePartial ────────────────────────────────────────────────
            const response = await client.post(`/api/crm/business/updatePartial?id=${id}`, body, { traceId });
            const updated = opportunity_1.OpportunitySchema.parse(response);
            // ── Audit log ─────────────────────────────────────────────────────────
            await audit_logger_1.auditLogger.log({
                trace_id: traceId,
                operator: 'current_user',
                action: 'opportunity.update',
                resource_type: 'opportunity',
                resource_id: updated.id,
                meta: { profile, api_url: client['axiosInstance']?.defaults?.baseURL || '' },
                changes: { fields_updated: Object.keys(body) },
            });
            // ── Output ────────────────────────────────────────────────────────────
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson({ success: true, data: updated, trace_id: traceId }));
            }
            else {
                formatter_1.formatter.success('✅ Opportunity updated successfully');
                formatter_1.formatter.info(`ID: ${updated.id}`);
                formatter_1.formatter.info(`Name: ${updated.name}`);
                if (updated.businessProcessName)
                    formatter_1.formatter.info(`Stage: ${updated.businessProcessName}`);
                if (updated.expectedTransAmount)
                    formatter_1.formatter.info(`Amount: ¥${updated.expectedTransAmount}`);
                if (updated.expectedTransProbability)
                    formatter_1.formatter.info(`Probability: ${updated.expectedTransProbability}`);
                if (updated.expectedCompleteDate)
                    formatter_1.formatter.info(`Expected Date: ${updated.expectedCompleteDate}`);
                formatter_1.formatter.info(`Fields updated: ${Object.keys(body).join(', ')}`);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (options.json || globalOpts.json) {
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
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=update.js.map