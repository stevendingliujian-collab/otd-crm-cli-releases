#!/usr/bin/env node
"use strict";
/**
 * CRM CLI - Main entry point
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProgram = buildProgram;
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const auth_1 = require("./commands/auth");
const config_1 = require("./commands/config");
const customer_1 = require("./commands/customer");
const clue_1 = require("./commands/clue");
const opportunity_1 = require("./commands/opportunity");
const contract_1 = require("./commands/contract");
const followup_1 = require("./commands/followup");
const task_1 = require("./commands/task");
const contact_1 = require("./commands/contact");
const receive_1 = require("./commands/receive");
const receivable_1 = require("./commands/receivable");
const invoice_1 = require("./commands/invoice");
const update_1 = require("./commands/update");
const skills_1 = require("./commands/skills");
const update_checker_1 = require("./utils/update-checker");
// Read version dynamically from package.json so it stays in sync with releases
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
/**
 * Build a fresh Commander program instance.
 * Exported so tests can call buildProgram().parseAsync([...]) without
 * running into stale state between test cases.
 */
function buildProgram() {
    const program = new commander_1.Command();
    program
        .name('crm')
        .description('OTD CRM Command Line Interface')
        .version(pkg.version)
        .addHelpText('after', `
Getting Started:
  1. Login to CRM
     $ crm auth login
  
  2. Verify your login
     $ crm auth whoami
  
  3. Search for customers
     $ crm customer search --keyword "科技"
  
  4. Get customer details
     $ crm customer get <customer-id>

Common Commands:
  crm auth login              Login to CRM with username/password
  crm customer search         Search customers by keyword
  crm clue search             Search leads (potential customers)
  crm opportunity search      Search sales opportunities
  crm contract search         Search contracts
  crm task search             Search tasks

Global Options:
  --profile <name>            Switch between multiple CRM accounts (default: "default")
                              Example: crm --profile staging customer search
  
  --json                      Output in JSON format for scripting/automation
                              Example: crm customer search --json > customers.json
  
  --fields <fields>           Customize table output columns (comma-separated)
                              Example: crm customer search --fields id,name,industry
  
  --verbose                   Show detailed request/response information
                              Useful for debugging API issues

Examples:
  # Login to default profile
  $ crm auth login
  
  # Search customers in staging environment
  $ crm --profile staging customer search --keyword "汽车"
  
  # Export high-value opportunities as JSON
  $ crm opportunity search --amount-min 1000000 --json > deals.json
  
  # Search with custom output fields
  $ crm customer search --fields id,name,owner_name --keyword "制造"

Documentation:
  GitHub:  https://github.com/stevendingliujian-collab/otd-crm-cli
  Issues:  https://github.com/stevendingliujian-collab/otd-crm-cli/issues
  
For command-specific help:
  $ crm <command> -h
  $ crm <command> <subcommand> -h
`);
    // Global options
    program
        .option('--profile <name>', 'Account profile', 'default')
        .option('--env <env>', 'Environment (dev/staging/prod)')
        .option('--json', 'Output in JSON format', false)
        .option('-o, --output <format>', 'Output format (table/json)', 'table')
        .option('--fields <fields>', 'Fields to return (comma-separated)')
        .option('-y, --yes', 'Skip confirmation', false)
        .option('--timeout <ms>', 'Request timeout in milliseconds', '30000')
        .option('-v, --verbose', 'Verbose output', false);
    // Register command groups
    (0, auth_1.authCommands)(program);
    (0, config_1.configCommands)(program);
    (0, customer_1.customerCommands)(program);
    (0, clue_1.clueCommands)(program);
    (0, opportunity_1.opportunityCommands)(program);
    (0, contract_1.contractCommands)(program);
    (0, followup_1.followupCommands)(program);
    (0, task_1.registerTaskCommands)(program);
    (0, contact_1.contactCommands)(program);
    (0, receive_1.receiveCommands)(program);
    (0, receivable_1.receivableCommands)(program);
    (0, invoice_1.invoiceCommands)(program);
    (0, update_1.updateCommand)(program);
    (0, skills_1.skillsCommands)(program);
    return program;
}
// ── Entry point (only when run directly) ──────────────────────────────────────
if (require.main === module) {
    const program = buildProgram();
    program.parse(process.argv);
    // Check for updates (non-blocking, runs in background)
    (0, update_checker_1.checkForUpdates)().catch(() => { });
    // Show help if no command
    if (!process.argv.slice(2).length) {
        program.outputHelp();
    }
}
//# sourceMappingURL=index.js.map