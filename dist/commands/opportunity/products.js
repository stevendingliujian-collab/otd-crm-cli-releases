"use strict";
/**
 * Opportunity products command
 * Returns products linked to an opportunity via getBusinessProductsById
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsCommand = productsCommand;
const http_client_1 = require("../../core/client/http-client");
const formatter_1 = require("../../core/output/formatter");
const error_handler_1 = require("../../core/errors/error-handler");
const audit_logger_1 = require("../../core/audit/audit-logger");
const zod_1 = require("zod");
const ProductDetailSchema = zod_1.z.object({
    productId: zod_1.z.string().optional().nullable(),
    quantity: zod_1.z.number().optional().nullable(),
    productPrice: zod_1.z.number().optional().nullable(),
    productRatePrice: zod_1.z.number().optional().nullable(),
    productRate: zod_1.z.string().optional().nullable(),
    productTotalAmount: zod_1.z.number().optional().nullable(),
    productTotalRateAmount: zod_1.z.number().optional().nullable(),
    percent: zod_1.z.string().optional().nullable(),
    discountTotalAmount: zod_1.z.number().optional().nullable(),
    remark: zod_1.z.string().optional().nullable(),
    product: zod_1.z.object({
        name: zod_1.z.string().optional().nullable(),
        code: zod_1.z.string().optional().nullable(),
    }).passthrough().optional().nullable(),
}).passthrough();
const ProductsResponseSchema = zod_1.z.array(ProductDetailSchema);
function productsCommand(opportunity) {
    opportunity
        .command('products <id>')
        .description('List products linked to an opportunity')
        .option('--json', 'Output as JSON')
        .addHelpText('after', `
Examples:
  # List products for an opportunity
  $ crm opportunity products 3a1f58d9-4e81-4096-a1c0-5ecae79140fd

  # Export as JSON (useful for health-check skill)
  $ crm opportunity products 3a1f58d9-4e81-4096-a1c0-5ecae79140fd --json

Notes:
  - Returns all products linked to the opportunity
  - Includes quantity, unit price, total amount, tax rate, discount
  - Product names are used by crm-health-check skill to identify industry playbook
`)
        .action(async (id, options, command) => {
        const traceId = audit_logger_1.auditLogger.generateTraceId();
        try {
            const globalOpts = command.optsWithGlobals();
            const profile = globalOpts.profile || 'default';
            const client = (0, http_client_1.createClient)(profile);
            const response = await client.get('/api/crm/business/getBusinessProductsById', {
                params: { id },
                traceId,
            });
            const parseResult = ProductsResponseSchema.safeParse(response);
            const items = parseResult.success
                ? parseResult.data
                : Array.isArray(response) ? response : [];
            if (options.json || globalOpts.json) {
                console.log(formatter_1.formatter.formatJson(items));
            }
            else {
                if (items.length === 0) {
                    console.log('No products linked to this opportunity.');
                    return;
                }
                // Flatten for display: use product.name if available
                const displayItems = items.map((item) => ({
                    name: item.product?.name || item.productId || '-',
                    code: item.product?.code || '-',
                    quantity: item.quantity ?? '-',
                    unitPrice: item.productPrice ?? '-',
                    totalAmount: item.productTotalAmount ?? '-',
                    taxRate: item.productRate || '-',
                    discount: item.percent || '-',
                    remark: item.remark || '-',
                }));
                const output = formatter_1.formatter.format(displayItems, {
                    format: 'table',
                    fields: ['name', 'code', 'quantity', 'unitPrice', 'totalAmount', 'taxRate'],
                    headers: {
                        name: 'Product',
                        code: 'Code',
                        quantity: 'Qty',
                        unitPrice: 'Unit Price',
                        totalAmount: 'Total',
                        taxRate: 'Tax Rate',
                    },
                });
                console.log(`Found ${items.length} product(s)\n`);
                console.log(output);
            }
        }
        catch (error) {
            const cliError = error_handler_1.errorHandler.handle(error);
            if (options.json || (command.optsWithGlobals()).json) {
                console.error(formatter_1.formatter.formatJson({ success: false, error: { code: cliError.code, message: cliError.message }, trace_id: traceId }));
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
//# sourceMappingURL=products.js.map