"use strict";
/**
 * Project resource schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectDeleteResponseSchema = exports.ProjectListResponseSchema = exports.ProjectSchema = void 0;
const zod_1 = require("zod");
exports.ProjectSchema = zod_1.z.object({
    id: zod_1.z.string(),
    code: zod_1.z.string().nullable().optional(),
    name: zod_1.z.string().nullable().optional(),
    salesRegion: zod_1.z.string().nullable().optional(),
    country: zod_1.z.string().nullable().optional(),
    province: zod_1.z.string().nullable().optional(),
    city: zod_1.z.string().nullable().optional(),
    district: zod_1.z.string().nullable().optional(),
    contractId: zod_1.z.string().nullable().optional(),
    contractCode: zod_1.z.string().nullable().optional(),
    contractName: zod_1.z.string().nullable().optional(),
    contractStatus: zod_1.z.string().nullable().optional(),
    customId: zod_1.z.string().nullable().optional(),
    customCode: zod_1.z.string().nullable().optional(),
    customName: zod_1.z.string().nullable().optional(),
    businessId: zod_1.z.string().nullable().optional(),
    businessName: zod_1.z.string().nullable().optional(),
    businessCode: zod_1.z.string().nullable().optional(),
    // 项目阶段：字段存 displayText，projectStageCode 存字典项 code
    projectStage: zod_1.z.string().nullable().optional(),
    projectStageCode: zod_1.z.string().nullable().optional(),
    // 项目类型：字典 `ProjectType`，只存 id
    projectTypeId: zod_1.z.string().nullable().optional(),
    projectTypeName: zod_1.z.string().nullable().optional(),
    // 项目状态：字典 `MarketingProject`，只存 id
    projectStatusId: zod_1.z.string().nullable().optional(),
    projectStatusName: zod_1.z.string().nullable().optional(),
    planStartDate: zod_1.z.string().nullable().optional(),
    planOnlineDate: zod_1.z.string().nullable().optional(),
    realStartDate: zod_1.z.string().nullable().optional(),
    realOnlineDate: zod_1.z.string().nullable().optional(),
    confirmDate: zod_1.z.string().nullable().optional(),
    maintenanceExpire: zod_1.z.string().nullable().optional(),
    estimatedMemoTime: zod_1.z.string().nullable().optional(),
    ownerId: zod_1.z.string().nullable().optional(),
    owner: zod_1.z.string().nullable().optional(),
    projectManager: zod_1.z.string().nullable().optional(),
    projectManagerId: zod_1.z.string().nullable().optional(),
    planSpendDay: zod_1.z.number().nullable().optional(),
    realSpendDay: zod_1.z.number().nullable().optional(),
    companyId: zod_1.z.string().nullable().optional(),
    companyName: zod_1.z.string().nullable().optional(),
    costAmount: zod_1.z.number().nullable().optional(),
    followUpCount: zod_1.z.number().nullable().optional(),
    taskCount: zod_1.z.number().nullable().optional(),
    taskDoneCount: zod_1.z.number().nullable().optional(),
    lastFollowUpDate: zod_1.z.string().nullable().optional(),
    creationTime: zod_1.z.string().nullable().optional(),
    creatorName: zod_1.z.string().nullable().optional(),
}).passthrough(); // Allow extra fields
exports.ProjectListResponseSchema = zod_1.z.object({
    totalCount: zod_1.z.number(),
    items: zod_1.z.array(exports.ProjectSchema),
});
exports.ProjectDeleteResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean().optional(),
    message: zod_1.z.string().nullable().optional(),
    code: zod_1.z.number().nullable().optional(),
}).passthrough();
//# sourceMappingURL=project.js.map