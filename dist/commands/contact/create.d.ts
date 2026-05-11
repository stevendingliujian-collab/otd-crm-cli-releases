/**
 * Contact create command
 *
 * IMPORTANT: Always send customName alongside customId.
 * The backend does NOT auto-populate names from IDs. A null customName
 * causes the associated customer to not display correctly on the contact.
 * If the caller omits --customer-name, this command auto-fetches it.
 */
import { Command } from 'commander';
export declare function createCommand(contact: Command): void;
//# sourceMappingURL=create.d.ts.map