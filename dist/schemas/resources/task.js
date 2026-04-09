"use strict";
/**
 * Task resource schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskListResponseSchema = exports.TaskSchema = void 0;
const zod_1 = require("zod");
exports.TaskSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string().nullable().optional(),
    status: zod_1.z.number().nullable().optional(),
    statusName: zod_1.z.string().nullable().optional(),
    priority: zod_1.z.number().nullable().optional(),
    priorityName: zod_1.z.string().nullable().optional(),
    assigneeId: zod_1.z.string().nullable().optional(),
    assignee: zod_1.z.string().nullable().optional(),
    creatorId: zod_1.z.string().nullable().optional(),
    creator: zod_1.z.string().nullable().optional(),
    dueDate: zod_1.z.string().nullable().optional(),
    completedDate: zod_1.z.string().nullable().optional(),
    relatedId: zod_1.z.string().nullable().optional(),
    relatedType: zod_1.z.number().nullable().optional(),
    createdTime: zod_1.z.string().nullable().optional(),
    updatedTime: zod_1.z.string().nullable().optional(),
}).passthrough(); // Allow extra fields
exports.TaskListResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(exports.TaskSchema),
});
//# sourceMappingURL=task.js.map