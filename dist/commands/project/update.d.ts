/**
 * Project update command
 *
 * 实现逻辑：先查询现有项目数据，再用用户传入的字段覆盖，实现指定字段更新。
 * 不更新：合同、客户、公司（这些关联关系不允许通过 update 修改）
 *
 * 项目阶段特殊处理：传入值可能是 id/code/name，统一转为 code + name
 * 项目类型/状态：传入值可能是 id/code/name，统一转为 id
 */
import { Command } from 'commander';
export declare function updateCommand(project: Command): void;
//# sourceMappingURL=update.d.ts.map