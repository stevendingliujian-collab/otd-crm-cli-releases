"use strict";
/**
 * Project helpers - 字典查询、名称自动补齐、阶段解析
 *
 * 数据字典规则：
 *   ProjectType       项目类型（存 id -> projectTypeId）
 *   MarketingProject  项目状态（存 id -> projectStatusId）
 *   ProjectStage      项目阶段（同时存 code -> projectStageCode 和 name -> projectStage）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUuid = isUuid;
exports.getDictItems = getDictItems;
exports.findDictItem = findDictItem;
exports.resolveProjectStage = resolveProjectStage;
exports.resolveDictId = resolveDictId;
exports.fetchCustomerName = fetchCustomerName;
exports.fetchContractInfo = fetchContractInfo;
exports.fetchCompanyList = fetchCompanyList;
exports.resolveCompany = resolveCompany;
exports.fetchCompanyName = fetchCompanyName;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value) {
    return UUID_REGEX.test(value);
}
/**
 * 获取数据字典条目列表（走 /api/crm/project/getProjectStatussByCode）
 */
async function getDictItems(client, dictCode, traceId) {
    const response = await client.get('/api/crm/project/getProjectStatussByCode', {
        params: { code: dictCode },
        traceId,
    });
    if (!Array.isArray(response))
        return [];
    return response;
}
/**
 * 按 id / code / displayText 在字典条目里查找
 */
function findDictItem(items, raw) {
    return items.find((it) => it.id === raw || it.code === raw || it.displayText === raw);
}
/**
 * 解析项目阶段输入：
 *   - 输入可能是 UUID(字典id) / code / displayText
 *   - 返回 { code, name }；找不到时抛错并列出所有可用阶段
 */
async function resolveProjectStage(client, raw, traceId) {
    const items = await getDictItems(client, 'ProjectStage', traceId);
    const item = findDictItem(items, raw);
    if (!item) {
        const available = items
            .map((it) => `${it.displayText}(${it.code})`)
            .join(', ');
        throw new Error(`项目阶段未找到: "${raw}"\n可选阶段: ${available}`);
    }
    return {
        code: item.code || '',
        name: item.displayText || '',
    };
}
/**
 * 解析字典 id 类型字段（ProjectType / MarketingProject）：
 *   - 输入是 UUID -> 直接用
 *   - 输入是 code / displayText -> 查字典找 id
 */
async function resolveDictId(client, dictCode, raw, traceId) {
    if (isUuid(raw)) {
        // 为了拿到 name，还是查一下字典；查不到就只返回 id
        const items = await getDictItems(client, dictCode, traceId);
        const item = items.find((it) => it.id === raw);
        return { id: raw, name: item?.displayText || '' };
    }
    const items = await getDictItems(client, dictCode, traceId);
    const item = findDictItem(items, raw);
    if (!item) {
        const available = items.map((it) => `${it.displayText}(${it.code})`).join(', ');
        throw new Error(`字典"${dictCode}"中未找到: "${raw}"\n可选: ${available}`);
    }
    return { id: item.id, name: item.displayText || '' };
}
/**
 * 按 id 查询客户名称（前端需要 customName 显示）
 */
async function fetchCustomerName(client, customerId, traceId) {
    try {
        const res = await client.get('/api/crm/custom/getCustomById', {
            params: { id: customerId },
            traceId,
        });
        return res?.name;
    }
    catch {
        return undefined;
    }
}
/**
 * 按 id 查询合同信息（contractName / contractCode）
 */
async function fetchContractInfo(client, contractId, traceId) {
    try {
        const res = await client.get('/api/crm/contract/getContractById', {
            params: { id: contractId },
            traceId,
        });
        return {
            name: res?.name,
            code: res?.code,
        };
    }
    catch {
        return undefined;
    }
}
/**
 * 获取公司列表（POST /api/otd/businessUnit/getPageList）
 * 公司数量少，一次性拉全量
 */
async function fetchCompanyList(client, traceId) {
    try {
        const res = await client.post('/api/otd/businessUnit/getPageList', {
            pageIndex: 1,
            pageSize: 999,
        }, { traceId });
        return (res?.items || []);
    }
    catch {
        return [];
    }
}
/**
 * 按 id / code / name 查找公司，返回 { id, name }
 */
async function resolveCompany(client, raw, traceId) {
    const list = await fetchCompanyList(client, traceId);
    const item = list.find((c) => c.id === raw || c.code === raw || c.name === raw);
    if (item)
        return { id: item.id, name: item.name || '' };
    return undefined;
}
/**
 * 按 id 查找公司名称
 */
async function fetchCompanyName(client, companyId, traceId) {
    const list = await fetchCompanyList(client, traceId);
    const item = list.find((c) => c.id === companyId);
    return item?.name;
}
//# sourceMappingURL=helpers.js.map