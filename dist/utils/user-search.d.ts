/**
 * User search utility
 * Shared by opportunity/customer/task assign commands
 */
export interface UserSearchResult {
    id: string;
    name: string;
    departmentName?: string;
    email?: string;
}
/**
 * Search users by name (fuzzy search)
 * Returns array of matching users
 */
export declare function searchUsers(client: any, keyword: string, traceId: string): Promise<UserSearchResult[]>;
//# sourceMappingURL=user-search.d.ts.map