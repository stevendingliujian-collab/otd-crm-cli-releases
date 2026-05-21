"use strict";
/**
 * User search utility
 * Shared by opportunity/customer/task assign commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsersPage = searchUsersPage;
exports.searchUsers = searchUsers;
exports.getUserById = getUserById;
const cli_error_1 = require("../core/errors/cli-error");
const error_codes_1 = require("../constants/error-codes");
/**
 * Search users by name (fuzzy search), returning the paged API shape.
 */
async function searchUsersPage(client, options, traceId) {
    try {
        const response = await client.post('/api/Users/page', {
            pageIndex: options.page ?? 1,
            pageSize: options.size ?? 10,
            filter: options.keyword || '',
            isActive: options.active ?? null,
        }, { traceId });
        if (!response || !Array.isArray(response.items)) {
            return { totalCount: 0, items: [] };
        }
        return {
            totalCount: response.totalCount,
            items: response.items.map((u) => ({
                id: u.id,
                name: u.name,
                userName: u.userName,
                email: u.email,
                phoneNumber: u.phoneNumber,
                isActive: u.isActive,
            })),
        };
    }
    catch (error) {
        // If user search API not available, throw helpful error
        throw new cli_error_1.CLIError(error_codes_1.ERROR_CODES.UPSTREAM_502, 'Failed to search users', 'User search API may not be available. Try using --owner-id directly.');
    }
}
/**
 * Search users by name (fuzzy search)
 * Returns array of matching users
 */
async function searchUsers(client, keyword, traceId) {
    const result = await searchUsersPage(client, { keyword, page: 1, size: 10, active: null }, traceId);
    return result.items;
}
async function getUserById(client, userId, traceId) {
    try {
        const response = await client.get(`/api/Users/get?id=${encodeURIComponent(userId)}`, { traceId });
        if (!response || !response.id)
            return undefined;
        return {
            id: response.id,
            name: response.name,
            userName: response.userName,
            email: response.email,
            phoneNumber: response.phoneNumber,
            isActive: response.isActive,
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=user-search.js.map