/**
 * Customer resource schemas
 */
import { z } from 'zod';
export declare const CustomerSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    name: z.ZodString;
    code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    name: z.ZodString;
    code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export type Customer = z.infer<typeof CustomerSchema>;
export declare const CustomerListResponseSchema: z.ZodObject<{
    totalCount: z.ZodNumber;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "strip", z.ZodTypeAny, {
    totalCount: number;
    items: z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">[];
}, {
    totalCount: number;
    items: z.objectInputType<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">[];
}>;
export type CustomerListResponse = z.infer<typeof CustomerListResponseSchema>;
//# sourceMappingURL=customer.d.ts.map