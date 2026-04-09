/**
 * Error code constants
 */
export declare const ERROR_CODES: {
    readonly AUTH_401: "AUTH_401";
    readonly AUTH_401_EXPIRED: "AUTH_401_EXPIRED";
    readonly AUTH_401_INVALID: "AUTH_401_INVALID";
    readonly PERM_403: "PERM_403";
    readonly PERM_403_READONLY: "PERM_403_READONLY";
    readonly PERM_403_OWNER: "PERM_403_OWNER";
    readonly VALIDATION_422: "VALIDATION_422";
    readonly VALIDATION_422_REQUIRED: "VALIDATION_422_REQUIRED";
    readonly VALIDATION_422_FORMAT: "VALIDATION_422_FORMAT";
    readonly VALIDATION_422_RANGE: "VALIDATION_422_RANGE";
    readonly BIZ_404: "BIZ_404";
    readonly BIZ_409: "BIZ_409";
    readonly BIZ_409_CONVERTED: "BIZ_409_CONVERTED";
    readonly BIZ_422: "BIZ_422";
    readonly BIZ_422_STATUS: "BIZ_422_STATUS";
    readonly RATE_429: "RATE_429";
    readonly RATE_429_DAILY: "RATE_429_DAILY";
    readonly UPSTREAM_502: "UPSTREAM_502";
    readonly UPSTREAM_503: "UPSTREAM_503";
    readonly UPSTREAM_504: "UPSTREAM_504";
    readonly SYSTEM_500: "SYSTEM_500";
    readonly SYSTEM_500_CONFIG: "SYSTEM_500_CONFIG";
    readonly SYSTEM_500_NETWORK: "SYSTEM_500_NETWORK";
};
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export declare const HTTP_TO_ERROR_CODE: Record<number, ErrorCode>;
export declare const ERROR_HINTS: Record<ErrorCode, string>;
//# sourceMappingURL=error-codes.d.ts.map