"use strict";
/**
 * Opportunity resource schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpportunityResponseSchema = exports.OpportunityListResponseSchema = exports.OpportunitySchema = void 0;
const zod_1 = require("zod");
// Relaxed schema - only validate required fields, allow extra properties
exports.OpportunitySchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    owner: zod_1.z.string().nullable().optional(),
    ownerId: zod_1.z.string().nullable().optional(),
}).passthrough(); // Allow extra fields
// Direct CRM API response format
exports.OpportunityListResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(exports.OpportunitySchema),
});
// For single opportunity get response
exports.OpportunityResponseSchema = exports.OpportunitySchema;
//# sourceMappingURL=opportunity.js.map