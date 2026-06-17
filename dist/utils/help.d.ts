import { Command } from 'commander';
interface CommandGroupHelpOptions {
    command: string;
    resource: string;
    searchExample?: string;
    getExample?: string;
    extraNotes?: string[];
}
/**
 * Add guidance for the top-level resource command, e.g. `crm customer --help`.
 */
export declare function addCommandGroupHelp(command: Command, options: CommandGroupHelpOptions): Command;
export declare function getByIdHelp(commandPath: string, resource: string, findCommand?: string): string;
export declare function searchResultHelp(commandPath: string, resource: string, codeNote?: string): string;
export {};
//# sourceMappingURL=help.d.ts.map