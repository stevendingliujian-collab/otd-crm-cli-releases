export declare const CUSTOMER_UPDATE_PRESERVE_FIELDS: readonly ["name", "code", "type", "ownerId", "owner", "industryCode", "industry", "level", "address", "description", "phone", "email", "contactName", "primaryBusiness", "website", "registeredCapital", "isListed", "socialInsuranceNum", "introduction", "shortName", "invoiceName", "taxpayerId", "salesRegion", "country", "province", "city", "district"];
type CustomerUpdateField = typeof CUSTOMER_UPDATE_PRESERVE_FIELDS[number];
export type CustomerUpdateOverrides = Partial<Record<CustomerUpdateField, unknown>>;
export declare function buildCustomerUpdateBody(current: Record<string, unknown>, overrides?: CustomerUpdateOverrides): Record<string, unknown>;
export {};
//# sourceMappingURL=payload.d.ts.map