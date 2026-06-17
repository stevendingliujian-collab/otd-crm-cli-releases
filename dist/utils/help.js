"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCommandGroupHelp = addCommandGroupHelp;
exports.getByIdHelp = getByIdHelp;
exports.searchResultHelp = searchResultHelp;
/**
 * Add guidance for the top-level resource command, e.g. `crm customer --help`.
 */
function addCommandGroupHelp(command, options) {
    const searchExample = options.searchExample ?? `crm ${options.command} search --help`;
    const getExample = options.getExample ?? `crm ${options.command} get --help`;
    const extraNotes = options.extraNotes?.map((note) => `  - ${note}`).join('\n');
    return command.addHelpText('after', `
How to choose a subcommand:
  - Use search/list first when you do not already have the record ID.
  - Use get only when you already have one exact ID.
  - Use create/update/assign/delete only after checking that subcommand's help.

Where to find optional parameters:
  - This page lists only the ${options.resource} subcommands.
  - Optional filters and required arguments live on each subcommand.
  - Before using filters, run:
    $ ${searchExample}
  - Before reading one record, run:
    $ ${getExample}

ID and code rules:
  - ID is the stable key for get/update/assign/delete and for linking records.
  - Search output is mainly used to obtain ID values.
  - Code is useful for display and for commands that explicitly say they accept code.
  - Do not pass code to get unless that get help explicitly says code is accepted.
${extraNotes ? `\n${extraNotes}` : ''}
`);
}
function getByIdHelp(commandPath, resource, findCommand) {
    const searchCommand = findCommand ?? `crm ${commandPath.replace(/ get$/, '')} search`;
    return `
AI usage guidance:
  - This command can get exactly one ${resource} by ID only.
  - The <id> argument must be an ID from CRM search/list output, usually a UUID.
  - Do not use name, code, title, phone, or keyword as <id>.
  - If you only know a name/code/keyword, run '${searchCommand}' first, then use the returned id.
`;
}
function searchResultHelp(commandPath, resource, codeNote) {
    return `
AI usage guidance:
  - This command returns a page of ${resource} candidates, not one guaranteed record.
  - Use the returned id as the primary value for later get/update/assign/link commands.
  - Use --json when another program or agent will read the result.
  - Use --fields id,name or --fields id,code,name when table output is enough.
  - ${codeNote ? `Code guidance: ${codeNote}.` : 'If the result includes code, use it for display/recognition; ID remains the safer follow-up key.'}
  - For optional filters, this '${commandPath} --help' output is authoritative.
`;
}
//# sourceMappingURL=help.js.map