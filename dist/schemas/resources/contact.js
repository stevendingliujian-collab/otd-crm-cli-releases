"use strict";
/**
 * Contact resource schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactListResponseSchema = exports.ContactSchema = void 0;
const zod_1 = require("zod");
exports.ContactSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    phone: zod_1.z.string().nullable().optional(),
    email: zod_1.z.string().nullable().optional(),
    position: zod_1.z.string().nullable().optional(),
    customId: zod_1.z.string().nullable().optional(),
    customName: zod_1.z.string().nullable().optional(),
    owner: zod_1.z.string().nullable().optional(),
    ownerId: zod_1.z.string().nullable().optional(),
    wechat: zod_1.z.string().nullable().optional(),
    qq: zod_1.z.string().nullable().optional(),
    remark: zod_1.z.string().nullable().optional(),
    createdTime: zod_1.z.string().nullable().optional(),
    updatedTime: zod_1.z.string().nullable().optional(),
}).passthrough(); // Allow extra fields
exports.ContactListResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(exports.ContactSchema),
});
//# sourceMappingURL=contact.js.map