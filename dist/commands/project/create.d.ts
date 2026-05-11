/**
 * Project create command
 *
 * 必填字段：name, companyId, projectTypeId
 * 项目编号 code 不传则后端自动生成
 *
 * 名称自动补齐规则：
 *   - companyName: 如果只传 companyId，自动查询补齐
 *   - customName: 如果只传 customId，自动查询补齐
 *   - contractName/contractCode: 如果只传 contractId，自动查询补齐
 *   - projectStage/projectStageCode: 特殊处理，传入值可能是 id/code/name，统一转为 code+name
 *   - projectTypeId: 传入值可能是 id/code/name，统一转为 id
 *   - projectStatusId: 传入值可能是 id/code/name，统一转为 id
 */
import { Command } from 'commander';
export declare function createCommand(project: Command): void;
//# sourceMappingURL=create.d.ts.map