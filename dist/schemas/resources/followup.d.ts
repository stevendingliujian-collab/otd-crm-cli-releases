/**
 * Followup resource schema
 */
import { z } from 'zod';
export declare const FollowupSchema: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    relatedId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    relatedType: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    type: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    followUpDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    relatedId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    relatedType: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    type: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    followUpDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    relatedId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    relatedType: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    type: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    followUpDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const FollowupListResponseSchema: z.ZodObject<{
    totalCount: z.ZodNumber;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        relatedId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        relatedType: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        type: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        followUpDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        relatedId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        relatedType: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        type: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        followUpDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        relatedId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        relatedType: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        type: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        followUpDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "strip", z.ZodTypeAny, {
    totalCount: number;
    items: z.objectOutputType<{
        id: z.ZodString;
        content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        relatedId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        relatedType: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        type: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        followUpDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">[];
}, {
    totalCount: number;
    items: z.objectInputType<{
        id: z.ZodString;
        content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        relatedId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        relatedType: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        type: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        followUpDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">[];
}>;
//# sourceMappingURL=followup.d.ts.map