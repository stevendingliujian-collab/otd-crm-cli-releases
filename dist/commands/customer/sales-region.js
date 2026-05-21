"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUSTOMER_SALES_REGIONS = void 0;
exports.validateCustomerSalesRegion = validateCustomerSalesRegion;
const error_codes_1 = require("../../constants/error-codes");
const cli_error_1 = require("../../core/errors/cli-error");
exports.CUSTOMER_SALES_REGIONS = [
    '华北区',
    '华东区',
    '华南区',
    '华中区',
    '西南区',
    '西北区',
    '东北区',
    '港澳台区',
];
function validateCustomerSalesRegion(region) {
    if (exports.CUSTOMER_SALES_REGIONS.includes(region)) {
        return region;
    }
    throw new cli_error_1.ValidationError(error_codes_1.ERROR_CODES.VALIDATION_422, `Invalid sales region: ${region}`, `Available sales regions: ${exports.CUSTOMER_SALES_REGIONS.join(', ')}`);
}
//# sourceMappingURL=sales-region.js.map