/**
 * Search parameters schemas
 */
import { z } from 'zod';
export declare const SearchParamsSchema: z.ZodObject<{
    keyword: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    size: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodOptional<z.ZodString>;
    sort_order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    size: number;
    keyword?: string | undefined;
    sort_by?: string | undefined;
    sort_order?: "asc" | "desc" | undefined;
}, {
    page?: number | undefined;
    size?: number | undefined;
    keyword?: string | undefined;
    sort_by?: string | undefined;
    sort_order?: "asc" | "desc" | undefined;
}>;
export type SearchParams = z.infer<typeof SearchParamsSchema>;
//# sourceMappingURL=search-params.d.ts.map