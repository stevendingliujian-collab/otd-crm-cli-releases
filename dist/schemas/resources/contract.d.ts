/**
 * Contract resource schema
 */
import { z } from 'zod';
export declare const ContractSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    isSigned: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    signedDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contractStatusName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    name: z.ZodString;
    code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    isSigned: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    signedDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contractStatusName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    name: z.ZodString;
    code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    isSigned: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    signedDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contractStatusName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const ContractListResponseSchema: z.ZodObject<{
    totalCount: z.ZodNumber;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        isSigned: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        signedDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        contractStatusName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        isSigned: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        signedDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        contractStatusName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        isSigned: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        signedDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        contractStatusName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "strip", z.ZodTypeAny, {
    totalCount: number;
    items: z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        isSigned: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        signedDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        contractStatusName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">[];
}, {
    totalCount: number;
    items: z.objectInputType<{
        id: z.ZodString;
        name: z.ZodString;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        isSigned: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        signedDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        contractStatusName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">[];
}>;
//# sourceMappingURL=contract.d.ts.map