"use strict";
/**
 * Customer resource schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerListResponseSchema = exports.CustomerSchema = void 0;
const zod_1 = require("zod");
// Relaxed schema - only validate required fields, allow extra properties
exports.CustomerSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    code: zod_1.z.string().nullable().optional(),
    owner: zod_1.z.string().nullable().optional(),
    ownerId: zod_1.z.string().nullable().optional(),
}).passthrough(); // Allow extra fields
// Direct CRM API response format
exports.CustomerListResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(exports.CustomerSchema),
});
//# sourceMappingURL=customer.js.map