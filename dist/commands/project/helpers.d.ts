/**
 * Project helpers - 字典查询、名称自动补齐、阶段解析
 *
 * 数据字典规则：
 *   ProjectType       项目类型（存 id -> projectTypeId）
 *   MarketingProject  项目状态（存 id -> projectStatusId）
 *   ProjectStage      项目阶段（同时存 code -> projectStageCode 和 name -> projectStage）
 */
import type { CRMClient } from '../../core/client/http-client';
export declare function isUuid(value: string): boolean;
export interface DictItem {
    id: string;
    code?: string | null;
    displayText?: string | null;
    order?: number | null;
}
/**
 * 获取数据字典条目列表（走 /api/crm/project/getProjectStatussByCode）
 */
export declare function getDictItems(client: CRMClient, dictCode: string, traceId: string): Promise<DictItem[]>;
/**
 * 按 id / code / displayText 在字典条目里查找
 */
export declare function findDictItem(items: DictItem[], raw: string): DictItem | undefined;
/**
 * 解析项目阶段输入：
 *   - 输入可能是 UUID(字典id) / code / displayText
 *   - 返回 { code, name }；找不到时抛错并列出所有可用阶段
 */
export declare function resolveProjectStage(client: CRMClient, raw: string, traceId: string): Promise<{
    code: string;
    name: string;
}>;
/**
 * 解析字典 id 类型字段（ProjectType / MarketingProject）：
 *   - 输入是 UUID -> 直接用
 *   - 输入是 code / displayText -> 查字典找 id
 */
export declare function resolveDictId(client: CRMClient, dictCode: string, raw: string, traceId: string): Promise<{
    id: string;
    name: string;
}>;
/**
 * 按 id 查询客户名称（前端需要 customName 显示）
 */
export declare function fetchCustomerName(client: CRMClient, customerId: string, traceId: string): Promise<string | undefined>;
/**
 * 按 id 查询合同信息（contractName / contractCode）
 */
export declare function fetchContractInfo(client: CRMClient, contractId: string, traceId: string): Promise<{
    name?: string;
    code?: string;
} | undefined>;
export interface CompanyItem {
    id: string;
    code?: string;
    name?: string;
}
/**
 * 获取公司列表（POST /api/otd/businessUnit/getPageList）
 * 公司数量少，一次性拉全量
 */
export declare function fetchCompanyList(client: CRMClient, traceId: string): Promise<CompanyItem[]>;
/**
 * 按 id / code / name 查找公司，返回 { id, name }
 */
export declare function resolveCompany(client: CRMClient, raw: string, traceId: string): Promise<{
    id: string;
    name: string;
} | undefined>;
/**
 * 按 id 查找公司名称
 */
export declare function fetchCompanyName(client: CRMClient, companyId: string, traceId: string): Promise<string | undefined>;
//# sourceMappingURL=helpers.d.ts.map