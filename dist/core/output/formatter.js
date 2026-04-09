"use strict";
/**
 * Output formatter - table and JSON
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatter = exports.OutputFormatter = void 0;
const cli_table3_1 = __importDefault(require("cli-table3"));
const chalk_1 = __importDefault(require("chalk"));
class OutputFormatter {
    formatTable(data, options = {}) {
        if (!data || data.length === 0) {
            return chalk_1.default.yellow('No data found');
        }
        const { fields, headers } = options;
        const keys = fields || Object.keys(data[0]);
        const table = new cli_table3_1.default({
            head: keys.map((k) => chalk_1.default.cyan((headers?.[k] || k).toUpperCase())),
            style: {
                head: [],
                border: [],
            },
        });
        for (const item of data) {
            const row = keys.map((k) => this.formatValue(item[k]));
            table.push(row);
        }
        return table.toString();
    }
    formatJson(data) {
        return JSON.stringify(data, null, 2);
    }
    format(data, options = {}) {
        const { format = 'table' } = options;
        if (format === 'json') {
            return this.formatJson(data);
        }
        // Table format
        if (Array.isArray(data)) {
            return this.formatTable(data, options);
        }
        if (data.items && Array.isArray(data.items)) {
            const tableOutput = this.formatTable(data.items, options);
            // Add pagination info if available
            if (data.pagination) {
                const { page, size, total, has_more } = data.pagination;
                const paginationInfo = chalk_1.default.gray(`\nPage ${page} | Size ${size} | Total ${total} | More: ${has_more ? 'Yes' : 'No'}`);
                return tableOutput + paginationInfo;
            }
            return tableOutput;
        }
        // Single object
        return this.formatSingleObject(data);
    }
    formatSingleObject(obj) {
        const lines = [];
        for (const [key, value] of Object.entries(obj)) {
            lines.push(`${chalk_1.default.cyan(key)}: ${this.formatValue(value)}`);
        }
        return lines.join('\n');
    }
    formatValue(value) {
        if (value === null || value === undefined) {
            return chalk_1.default.gray('-');
        }
        if (typeof value === 'boolean') {
            return value ? chalk_1.default.green('✓') : chalk_1.default.red('✗');
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    }
    success(message) {
        console.log(chalk_1.default.green('✓'), message);
    }
    error(message) {
        console.error(chalk_1.default.red('✗'), message);
    }
    warn(message) {
        console.warn(chalk_1.default.yellow('⚠'), message);
    }
    info(message) {
        console.log(chalk_1.default.blue('ℹ'), message);
    }
}
exports.OutputFormatter = OutputFormatter;
exports.formatter = new OutputFormatter();
//# sourceMappingURL=formatter.js.map