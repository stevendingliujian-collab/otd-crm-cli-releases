"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDictItems = fetchDictItems;
exports.findDictItem = findDictItem;
exports.formatDictItems = formatDictItems;
exports.resolveDictId = resolveDictId;
async function fetchDictItems(client, dictCode, traceId) {
    const response = await client.get('/api/crm/project/getProjectStatussByCode', {
        params: { code: dictCode },
        traceId,
    });
    if (!Array.isArray(response))
        return [];
    return response;
}
function findDictItem(items, raw) {
    return items.find((item) => item.id === raw || item.code === raw || item.displayText === raw);
}
function formatDictItems(items) {
    return items
        .map((item) => ({
        order: item.order ?? 0,
        name: item.displayText || '',
        code: item.code || '',
        id: item.id,
        enabled: item.isEnabled !== false ? '✓' : '✗',
    }))
        .sort((a, b) => a.order - b.order);
}
async function resolveDictId(client, dictCode, raw, traceId, isUuid) {
    const items = await fetchDictItems(client, dictCode, traceId);
    if (isUuid(raw)) {
        const item = items.find((it) => it.id === raw);
        return { id: raw, name: item?.displayText || '' };
    }
    const item = findDictItem(items, raw);
    if (!item) {
        const available = items.map((it) => `${it.displayText}(${it.code})`).join(', ');
        throw new Error(`字典"${dictCode}"中未找到: "${raw}"\n可选: ${available}`);
    }
    return { id: item.id, name: item.displayText || '' };
}
//# sourceMappingURL=dictionary.js.map