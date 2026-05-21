"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUSTOMER_UPDATE_PRESERVE_FIELDS = void 0;
exports.buildCustomerUpdateBody = buildCustomerUpdateBody;
exports.CUSTOMER_UPDATE_PRESERVE_FIELDS = [
    'name',
    'code',
    'type',
    'ownerId',
    'owner',
    'industryCode',
    'industry',
    'level',
    'address',
    'description',
    'phone',
    'email',
    'contactName',
    'primaryBusiness',
    'website',
    'registeredCapital',
    'isListed',
    'socialInsuranceNum',
    'introduction',
    'shortName',
    'invoiceName',
    'taxpayerId',
    'salesRegion',
    'country',
    'province',
    'city',
    'district',
];
function buildCustomerUpdateBody(current, overrides = {}) {
    const body = {};
    for (const field of exports.CUSTOMER_UPDATE_PRESERVE_FIELDS) {
        if (current[field] !== undefined) {
            body[field] = current[field];
        }
    }
    if (body.type === undefined) {
        body.type = 0;
    }
    for (const [field, value] of Object.entries(overrides)) {
        if (value !== undefined) {
            body[field] = value;
        }
    }
    return body;
}
//# sourceMappingURL=payload.js.map