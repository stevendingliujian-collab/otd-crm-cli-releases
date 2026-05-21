/**
 * User search utility
 * Shared by opportunity/customer/task assign commands
 */
export interface UserSearchResult {
    id: string;
    name: string;
    userName?: string;
    email?: string;
    phoneNumber?: string;
    isActive?: boolean;
}
export interface UserSearchOptions {
    keyword?: string;
    page?: number;
    size?: number;
    active?: boolean | null;
}
export interface UserSearchPage {
    totalCount?: number;
    items: UserSearchResult[];
}
/**
 * Search users by name (fuzzy search), returning the paged API shape.
 */
export declare function searchUsersPage(client: any, options: UserSearchOptions, traceId: string): Promise<UserSearchPage>;
/**
 * Search users by name (fuzzy search)
 * Returns array of matching users
 */
export declare function searchUsers(client: any, keyword: string, traceId: string): Promise<UserSearchResult[]>;
export declare function getUserById(client: any, userId: string, traceId: string): Promise<UserSearchResult | undefined>;
//# sourceMappingURL=user-search.d.ts.map