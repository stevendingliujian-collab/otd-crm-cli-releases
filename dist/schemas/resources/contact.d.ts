/**
 * Contact resource schema
 */
import { z } from 'zod';
export declare const ContactSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    position: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    wechat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    qq: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    remark: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    updatedTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    position: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    wechat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    qq: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    remark: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    updatedTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    position: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    wechat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    qq: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    remark: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    updatedTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const ContactListResponseSchema: z.ZodObject<{
    totalCount: z.ZodNumber;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        position: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        wechat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        qq: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        remark: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        updatedTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodString;
        phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        position: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        wechat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        qq: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        remark: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        updatedTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        name: z.ZodString;
        phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        position: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        wechat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        qq: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        remark: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        updatedTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "strip", z.ZodTypeAny, {
    totalCount: number;
    items: z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodString;
        phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        position: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        wechat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        qq: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        remark: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        updatedTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">[];
}, {
    totalCount: number;
    items: z.objectInputType<{
        id: z.ZodString;
        name: z.ZodString;
        phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        position: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        owner: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        wechat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        qq: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        remark: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        updatedTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">[];
}>;
//# sourceMappingURL=contact.d.ts.map