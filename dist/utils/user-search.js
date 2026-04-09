"use strict";
/**
 * User search utility
 * Shared by opportunity/customer/task assign commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = searchUsers;
const cli_error_1 = require("../core/errors/cli-error");
const error_codes_1 = require("../constants/error-codes");
/**
 * Search users by name (fuzzy search)
 * Returns array of matching users
 */
async function searchUsers(client, keyword, traceId) {
    try {
        // Use user search API
        const response = await client.get(`/api/app/account/users?keyword=${encodeURIComponent(keyword)}&maxResultCount=10`, { traceId });
        if (!response || !Array.isArray(response.items)) {
            // Fallback: return empty array if API format unexpected
            return [];
        }
        return response.items.map((u) => ({
            id: u.id,
            name: u.name || u.userName || u.realName,
            departmentName: u.departmentName || u.department?.name,
            email: u.email || u.emailAddress,
        }));
    }
    catch (error) {
        // If user search API not available, throw helpful error
        throw new cli_error_1.CLIError(error_codes_1.ERROR_CODES.UPSTREAM_502, 'Failed to search users', 'User search API may not be available. Try using --owner-id directly.');
    }
}
//# sourceMappingURL=user-search.js.map