import type { CRMClient } from '../core/client/http-client';
export interface CompanyItem {
    id: string;
    code?: string;
    name?: string;
}
export declare function fetchCompanyList(client: CRMClient, traceId: string, pageSize?: number): Promise<CompanyItem[]>;
export declare function searchCompanies(companies: CompanyItem[], keyword: string): CompanyItem[];
export declare function resolveCompany(client: CRMClient, raw: string, traceId: string): Promise<{
    id: string;
    name: string;
} | undefined>;
export declare function fetchCompanyName(client: CRMClient, companyId: string, traceId: string): Promise<string | undefined>;
//# sourceMappingURL=company.d.ts.map