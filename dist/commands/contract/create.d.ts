/**
 * Contract create command
 *
 * IMPORTANT: Always send customName alongside customId.
 * The backend does NOT auto-populate names from IDs, and the frontend
 * detail page will render blank if customName is null.
 * If the caller omits --customer-name, this command auto-fetches it.
 */
import { Command } from 'commander';
export declare function createCommand(contract: Command): void;
//# sourceMappingURL=create.d.ts.map