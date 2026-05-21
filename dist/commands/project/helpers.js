"use strict";
/**
 * Project helpers - 项目命令专用解析封装
 *
 * 通用查询能力放在 src/utils 下；本文件只保留项目字段的业务语义：
 *   ProjectType       项目类型（存 id -> projectTypeId）
 *   MarketingProject  项目状态（存 id -> projectStatusId）
 *   ProjectStage      项目阶段（同时存 code -> projectStageCode 和 name -> projectStage）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDictItem = void 0;
exports.isUuid = isUuid;
exports.getDictItems = getDictItems;
exports.resolveProjectStage = resolveProjectStage;
exports.resolveDictId = resolveDictId;
exports.fetchCustomerName = fetchCustomerName;
exports.fetchContractInfo = fetchContractInfo;
exports.fetchCompanyList = fetchCompanyList;
exports.resolveCompany = resolveCompany;
exports.fetchCompanyName = fetchCompanyName;
exports.resolveUserRef = resolveUserRef;
const user_search_1 = require("../../utils/user-search");
const dictionary_1 = require("../../utils/dictionary");
Object.defineProperty(exports, "findDictItem", { enumerable: true, get: function () { return dictionary_1.findDictItem; } });
const company_1 = require("../../utils/company");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value) {
    return UUID_REGEX.test(value);
}
async function getDictItems(client, dictCode, traceId) {
    return (0, dictionary_1.fetchDictItems)(client, dictCode, traceId);
}
async function resolveProjectStage(client, raw, traceId) {
    const items = await getDictItems(client, 'ProjectStage', traceId);
    const item = (0, dictionary_1.findDictItem)(items, raw);
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
async function resolveDictId(client, dictCode, raw, traceId) {
    return (0, dictionary_1.resolveDictId)(client, dictCode, raw, traceId, isUuid);
}
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
async function fetchCompanyList(client, traceId) {
    return (0, company_1.fetchCompanyList)(client, traceId);
}
async function resolveCompany(client, raw, traceId) {
    return (0, company_1.resolveCompany)(client, raw, traceId);
}
async function fetchCompanyName(client, companyId, traceId) {
    return (0, company_1.fetchCompanyName)(client, companyId, traceId);
}
async function resolveUserRef(client, raw, traceId) {
    if (isUuid(raw)) {
        const byId = await (0, user_search_1.getUserById)(client, raw, traceId);
        if (byId) {
            return { id: byId.id, name: byId.name };
        }
        return { id: raw };
    }
    const users = await (0, user_search_1.searchUsers)(client, raw, traceId);
    const exactName = users.find((user) => user.name === raw);
    if (exactName) {
        return { id: exactName.id, name: exactName.name };
    }
    if (users.length === 1) {
        return { id: users[0].id, name: users[0].name };
    }
    if (users.length > 1) {
        const matched = users.find((user) => user.name.includes(raw));
        if (matched) {
            return { id: matched.id, name: matched.name };
        }
    }
    if (raw) {
        return { id: raw };
    }
    return {};
}
//# sourceMappingURL=helpers.js.map