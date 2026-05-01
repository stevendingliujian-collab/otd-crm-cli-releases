#!/usr/bin/env node

const { buildProgram } = require('../dist/index.js');
const { checkForUpdates } = require('../dist/utils/update-checker.js');

const program = buildProgram();
program.parse(process.argv);

// Check for updates (non-blocking, runs in background)
checkForUpdates().catch(() => {});

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
