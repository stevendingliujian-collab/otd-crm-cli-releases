/**
 * Opportunity update command
 *
 * Uses /api/crm/business/updatePartial — true partial update.
 * Only the fields explicitly passed on the CLI are sent to the backend.
 * Un-passed fields are NOT included in the request body and are left untouched.
 *
 * DO NOT use /api/crm/business/update — that endpoint does a full replace
 * and will clear any field not explicitly included in the payload.
 */
import { Command } from 'commander';
export declare function updateCommand(opportunity: Command): void;
//# sourceMappingURL=update.d.ts.map