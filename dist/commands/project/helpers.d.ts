/**
 * Project helpers - 项目命令专用解析封装
 *
 * 通用查询能力放在 src/utils 下；本文件只保留项目字段的业务语义：
 *   ProjectType       项目类型（存 id -> projectTypeId）
 *   MarketingProject  项目状态（存 id -> projectStatusId）
 *   ProjectStage      项目阶段（同时存 code -> projectStageCode 和 name -> projectStage）
 */
import type { CRMClient } from '../../core/client/http-client';
import { findDictItem, type DictItem } from '../../utils/dictionary';
import { type CompanyItem } from '../../utils/company';
export type { DictItem, CompanyItem };
export declare function isUuid(value: string): boolean;
export declare function getDictItems(client: CRMClient, dictCode: string, traceId: string): Promise<DictItem[]>;
export { findDictItem };
export declare function resolveProjectStage(client: CRMClient, raw: string, traceId: string): Promise<{
    code: string;
    name: string;
}>;
export declare function resolveDictId(client: CRMClient, dictCode: string, raw: string, traceId: string): Promise<{
    id: string;
    name: string;
}>;
export declare function fetchCustomerName(client: CRMClient, customerId: string, traceId: string): Promise<string | undefined>;
export declare function fetchContractInfo(client: CRMClient, contractId: string, traceId: string): Promise<{
    name?: string;
    code?: string;
} | undefined>;
export declare function fetchCompanyList(client: CRMClient, traceId: string): Promise<CompanyItem[]>;
export declare function resolveCompany(client: CRMClient, raw: string, traceId: string): Promise<{
    id: string;
    name: string;
} | undefined>;
export declare function fetchCompanyName(client: CRMClient, companyId: string, traceId: string): Promise<string | undefined>;
export interface ResolvedUserRef {
    id?: string;
    name?: string;
}
export declare function resolveUserRef(client: CRMClient, raw: string, traceId: string): Promise<ResolvedUserRef>;
//# sourceMappingURL=helpers.d.ts.map