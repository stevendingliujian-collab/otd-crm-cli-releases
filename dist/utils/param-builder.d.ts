/**
 * CRM API 参数构建工具
 *
 * 将 CLI 参数转换为 CRM API 所需的格式
 */
export interface PagedParams {
    keyword?: string;
    page?: number;
    size?: number;
    [key: string]: unknown;
}
/**
 * 构建分页查询请求体
 *
 * CRM API 需要的格式：
 * {
 *   pageIndex: 1,
 *   pageSize: 20,
 *   filter: {
 *     likeString: "关键词"
 *   }
 * }
 */
export declare function buildPagedRequest(params: PagedParams, filterMapping?: Record<string, string>): Record<string, unknown>;
//# sourceMappingURL=param-builder.d.ts.map