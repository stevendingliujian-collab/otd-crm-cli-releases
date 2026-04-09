"use strict";
/**
 * Clue resource schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClueResponseSchema = exports.ClueListResponseSchema = exports.ClueSchema = void 0;
const zod_1 = require("zod");
// Relaxed schema - only validate required fields, allow extra properties
exports.ClueSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    owner: zod_1.z.string().nullable().optional(),
    ownerId: zod_1.z.string().nullable().optional(),
}).passthrough(); // Allow extra fields
// Direct CRM API response format
exports.ClueListResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(exports.ClueSchema),
});
// For single clue get response
exports.ClueResponseSchema = exports.ClueSchema;
//# sourceMappingURL=clue.js.map