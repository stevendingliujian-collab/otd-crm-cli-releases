# OTD CRM CLI Releases

Public release artifacts for OTD CRM CLI (without private source repository).

## Install from release artifact
1. Download the latest `crm-cli-<version>-runtime.tar.gz` from Releases.
2. Extract it.
3. Run:

```bash
cd crm-cli-<version>-runtime
npm install --omit=dev
npm link
crm --version
```

## Verify login flow
```bash
crm auth device
crm auth whoami --json
```
