import type { CRMClient } from '../core/client/http-client';
export interface DictItem {
    id: string;
    code?: string | null;
    displayText?: string | null;
    order?: number | null;
    description?: string | null;
    isEnabled?: boolean | null;
}
export interface DictListItem {
    order: number;
    name: string;
    code: string;
    id: string;
    enabled: string;
}
export declare function fetchDictItems(client: CRMClient, dictCode: string, traceId: string): Promise<DictItem[]>;
export declare function findDictItem(items: DictItem[], raw: string): DictItem | undefined;
export declare function formatDictItems(items: DictItem[]): DictListItem[];
export declare function resolveDictId(client: CRMClient, dictCode: string, raw: string, traceId: string, isUuid: (value: string) => boolean): Promise<{
    id: string;
    name: string;
}>;
//# sourceMappingURL=dictionary.d.ts.map