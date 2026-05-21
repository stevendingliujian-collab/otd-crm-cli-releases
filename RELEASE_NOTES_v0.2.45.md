# CRM CLI v0.2.45

Date: 2026-05-21

## New Features

- Added company lookup commands: `crm company list` and `crm company search`.
- Added dictionary lookup command: `crm dict list --code <code>`.
- Added user lookup commands: `crm user search` and `crm user get`.
- Added customer owner assignment flow through `crm customer assign`.

## Related Changes

- Registered the new `company`, `dict`, and `user` command groups in the main `crm` command.
- Included new customer payload helpers and lookup utilities in the release build.
- Refreshed compiled `dist/` output and bundled skills for the release repository.
