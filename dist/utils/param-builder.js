"use strict";
/**
 * CRM API 参数构建工具
 *
 * 将 CLI 参数转换为 CRM API 所需的格式
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPagedRequest = buildPagedRequest;
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
function buildPagedRequest(params, filterMapping) {
    const pageIndex = params.page || 1;
    const pageSize = params.size || 20;
    const filter = {};
    // 处理 keyword -> likeString
    if (params.keyword) {
        filter.likeString = params.keyword;
    }
    // 处理其他自定义字段映射
    if (filterMapping) {
        for (const [paramKey, filterKey] of Object.entries(filterMapping)) {
            if (params[paramKey] !== undefined && params[paramKey] !== null) {
                filter[filterKey] = params[paramKey];
            }
        }
    }
    return {
        pageIndex,
        pageSize,
        filter: Object.keys(filter).length > 0 ? filter : {},
    };
}
//# sourceMappingURL=param-builder.js.map