"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCompanyList = fetchCompanyList;
exports.searchCompanies = searchCompanies;
exports.resolveCompany = resolveCompany;
exports.fetchCompanyName = fetchCompanyName;
async function fetchCompanyList(client, traceId, pageSize = 999) {
    try {
        const response = await client.post('/api/otd/businessUnit/getPageList', {
            pageIndex: 1,
            pageSize,
        }, { traceId });
        return (response?.items || []);
    }
    catch {
        return [];
    }
}
function searchCompanies(companies, keyword) {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized)
        return companies;
    return companies.filter((company) => (company.id?.toLowerCase().includes(normalized)
        || company.code?.toLowerCase().includes(normalized)
        || company.name?.toLowerCase().includes(normalized)));
}
async function resolveCompany(client, raw, traceId) {
    const companies = await fetchCompanyList(client, traceId);
    const item = companies.find((company) => company.id === raw || company.code === raw || company.name === raw);
    if (!item)
        return undefined;
    return { id: item.id, name: item.name || '' };
}
async function fetchCompanyName(client, companyId, traceId) {
    const companies = await fetchCompanyList(client, traceId);
    return companies.find((company) => company.id === companyId)?.name;
}
//# sourceMappingURL=company.js.map