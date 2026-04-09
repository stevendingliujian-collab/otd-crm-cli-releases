"use strict";
/**
 * Followup resource schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowupListResponseSchema = exports.FollowupSchema = void 0;
const zod_1 = require("zod");
exports.FollowupSchema = zod_1.z.object({
    id: zod_1.z.string(),
    content: zod_1.z.string().nullable().optional(),
    relatedId: zod_1.z.string().nullable().optional(),
    relatedType: zod_1.z.number().nullable().optional(),
    type: zod_1.z.number().nullable().optional(),
    followUpDate: zod_1.z.string().nullable().optional(),
    owner: zod_1.z.string().nullable().optional(),
    ownerId: zod_1.z.string().nullable().optional(),
}).passthrough(); // Allow extra fields
exports.FollowupListResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(exports.FollowupSchema),
});
//# sourceMappingURL=followup.js.map