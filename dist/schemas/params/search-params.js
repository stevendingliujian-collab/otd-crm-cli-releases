"use strict";
/**
 * Search parameters schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchParamsSchema = void 0;
const zod_1 = require("zod");
exports.SearchParamsSchema = zod_1.z.object({
    keyword: zod_1.z.string().optional(),
    page: zod_1.z.number().min(1).default(1),
    size: zod_1.z.number().min(1).max(100).default(20),
    sort_by: zod_1.z.string().optional(),
    sort_order: zod_1.z.enum(['asc', 'desc']).optional(),
});
//# sourceMappingURL=search-params.js.map