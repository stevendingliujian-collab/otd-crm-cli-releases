"use strict";
/**
 * Contract resource schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractListResponseSchema = exports.ContractSchema = void 0;
const zod_1 = require("zod");
exports.ContractSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    code: zod_1.z.string().nullable().optional(),
    customName: zod_1.z.string().nullable().optional(),
    customId: zod_1.z.string().nullable().optional(),
    owner: zod_1.z.string().nullable().optional(),
    ownerId: zod_1.z.string().nullable().optional(),
    amount: zod_1.z.number().nullable().optional(),
    isSigned: zod_1.z.boolean().nullable().optional(),
    signedDate: zod_1.z.string().nullable().optional(),
    contractStatusName: zod_1.z.string().nullable().optional(),
}).passthrough(); // Allow extra fields
exports.ContractListResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(exports.ContractSchema),
});
//# sourceMappingURL=contract.js.map