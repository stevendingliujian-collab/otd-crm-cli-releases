"use strict";
/**
 * Followup get command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const followup_1 = require("../../schemas/resources/followup");
function getCommand(followup) {
    followup
        .command('get <id>')
        .description('Get followup record by ID')
        .argument('<id>', 'Followup ID (UUID)')
        .option('--json', 'Output as JSON (default)')
        .option('--format <format>', 'Output format: json | text | markdown', 'json')
        .action(async (id, options, command) => {
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            // Fetch followup
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.get(`/api/crm/followup/get?id=${id}`);
            // Validate response
            const followup = followup_1.FollowupSchema.parse(response);
            // Output based on format
            const outputFormat = options.json ? 'json' : options.format;
            switch (outputFormat) {
                case 'markdown':
                    outputMarkdown(followup);
                    break;
                case 'text':
                    outputText(followup);
                    break;
                case 'json':
                default:
                    console.log(formatter_1.formatter.formatJson(followup));
                    break;
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (options.json || options.format === 'json') {
                console.error(formatter_1.formatter.formatJson({
                    success: false,
                    error: {
                        code: cliError.code,
                        message: cliError.message,
                        hint: cliError.hint,
                    },
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
/**
 * Output followup in markdown format
 */
function outputMarkdown(followup) {
    const lines = [];
    lines.push(`# 跟进记录\n`);
    lines.push(`**ID**: ${followup.id}`);
    lines.push(`**日期**: ${followup.followUpDate || '-'}`);
    lines.push(`**类型**: ${followup.followUpTypeName || followup.followUpType || '-'}`);
    if (followup.relatedTitle) {
        lines.push(`**关联对象**: ${followup.relatedTitle} (${followup.relatedTypeName || followup.relatedType})`);
    }
    if (followup.creatorName) {
        lines.push(`**创建人**: ${followup.creatorName}`);
    }
    if (followup.createTime) {
        lines.push(`**创建时间**: ${followup.createTime}`);
    }
    lines.push('');
    lines.push('## 内容\n');
    lines.push(followup.content || '(无内容)');
    console.log(lines.join('\n'));
}
/**
 * Output followup in plain text format
 */
function outputText(followup) {
    const lines = [];
    lines.push('--- 跟进记录 ---');
    lines.push(`ID: ${followup.id}`);
    lines.push(`日期: ${followup.followUpDate || '-'}`);
    lines.push(`类型: ${followup.followUpTypeName || followup.followUpType || '-'}`);
    if (followup.relatedTitle) {
        lines.push(`关联: ${followup.relatedTitle} (${followup.relatedTypeName || followup.relatedType})`);
    }
    if (followup.creatorName) {
        lines.push(`创建人: ${followup.creatorName}`);
    }
    if (followup.createTime) {
        lines.push(`创建时间: ${followup.createTime}`);
    }
    lines.push('');
    lines.push('内容:');
    lines.push(followup.content || '(无内容)');
    lines.push('');
    console.log(lines.join('\n'));
}
//# sourceMappingURL=get.js.map