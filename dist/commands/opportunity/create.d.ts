/**
 * Opportunity create command
 *
 * IMPORTANT: Always send customName and companyName alongside their IDs.
 * The backend does NOT auto-populate names from IDs, and the frontend
 * detail page will render blank if these name fields are null.
 * If the caller omits --customer-name, this command auto-fetches it.
 */
import { Command } from 'commander';
export declare function createCommand(opportunity: Command): void;
//# sourceMappingURL=create.d.ts.map