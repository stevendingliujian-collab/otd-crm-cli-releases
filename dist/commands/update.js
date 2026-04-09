"use strict";
/**
 * CLI 自动更新命令
 *
 * 检查最新版本并自动更新
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = updateCommand;
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Update command implementation
 */
function updateCommand(cli) {
    cli
        .command('update')
        .description('Check for updates and upgrade CRM CLI')
        .option('--check', 'Only check version, do not update')
        .option('--force', 'Force update without confirmation')
        .option('--verbose', 'Show detailed output')
        .action(async (options) => {
        await handleUpdate(options);
    });
}
/**
 * Main update handler
 */
async function handleUpdate(options) {
    const currentVersion = getCurrentVersion();
    if (options.verbose) {
        console.log(`🔍 Current version: ${currentVersion}`);
    }
    // Step 1: Check latest version
    console.log('🔍 Checking for updates...');
    try {
        const latestRelease = await getLatestRelease();
        if (options.verbose) {
            console.log(`📦 Latest version: ${latestRelease.version}`);
            console.log(`📅 Published: ${latestRelease.publishedAt}`);
        }
        // Compare versions
        if (compareVersions(currentVersion, latestRelease.version) >= 0) {
            console.log('✅ You are already using the latest version!');
            return;
        }
        console.log(`\n📦 New version available!`);
        console.log(`   Current:  ${currentVersion}`);
        console.log(`   Latest:   ${latestRelease.version}`);
        console.log(`   Release:  ${latestRelease.url}\n`);
        // If --check only, stop here
        if (options.check) {
            return;
        }
        // Ask for confirmation (unless --force)
        if (!options.force) {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            const answer = await new Promise((resolve) => {
                readline.question('Update now? (Y/n) ', resolve);
            });
            readline.close();
            if (answer.toLowerCase() === 'n' || answer.toLowerCase() === 'no') {
                console.log('Update cancelled.');
                return;
            }
        }
        // Step 2: Perform update
        console.log('\n⬇️  Updating...\n');
        await performUpdate();
        console.log('\n✅ Update successful!');
        console.log(`🎉 CRM CLI updated to v${latestRelease.version}\n`);
    }
    catch (error) {
        console.error('❌ Update failed:', error instanceof Error ? error.message : error);
        console.error('\n💡 You can manually update by running:');
        console.error('   cd ~/.openclaw/workspace-cto/crm-cli');
        console.error('   git pull && npm install && npm run build && npm link\n');
        process.exit(1);
    }
}
/**
 * Get current CLI version from package.json
 */
function getCurrentVersion() {
    const packagePath = path.join(__dirname, '../../package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    return packageData.version || 'unknown';
}
/**
 * Get latest release info from GitHub Tags API (public releases repo)
 */
async function getLatestRelease() {
    try {
        const response = await axios_1.default.get('https://api.github.com/repos/stevendingliujian-collab/otd-crm-cli-releases/tags?per_page=1', {
            timeout: 5000,
            headers: {
                'User-Agent': 'crm-cli-update',
                'Accept': 'application/vnd.github.v3+json',
            },
        });
        if (response.data && response.data.length > 0) {
            const latestTag = response.data[0].name;
            return {
                version: latestTag.replace(/^v/, ''),
                publishedAt: response.data[0].commit?.committer?.date || new Date().toISOString(),
                url: `https://github.com/stevendingliujian-collab/otd-crm-cli-releases/tree/${latestTag}`,
                tagName: latestTag,
            };
        }
        throw new Error('No tags found');
    }
    catch (error) {
        throw new Error('无法连接到 GitHub。\n' +
            '可能原因：\n' +
            '  1. 网络连接问题\n' +
            '  2. GitHub API 限流\n\n' +
            '请手动更新：\n' +
            '  cd ~/.openclaw/workspace-cto/crm-cli\n' +
            '  git pull && npm install && npm run build && npm link');
    }
}
/**
 * Compare two version strings
 * Returns: -1 (v1 < v2), 0 (v1 === v2), 1 (v1 > v2)
 */
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        if (num1 < num2)
            return -1;
        if (num1 > num2)
            return 1;
    }
    return 0;
}
/**
 * Perform the actual update
 */
async function performUpdate() {
    const cliDir = path.join(__dirname, '../..');
    // Check if this is a git repository
    const gitDir = path.join(cliDir, '.git');
    if (!fs.existsSync(gitDir)) {
        throw new Error('Not a git repository. Please update manually.');
    }
    console.log('1. Pulling latest code from repository...');
    try {
        (0, child_process_1.execSync)('git pull', {
            cwd: cliDir,
            stdio: 'inherit',
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
        });
    }
    catch (error) {
        throw new Error('Failed to pull latest code. Please check your network connection.');
    }
    console.log('\n2. Installing dependencies...');
    try {
        (0, child_process_1.execSync)('npm install', {
            cwd: cliDir,
            stdio: 'inherit'
        });
    }
    catch (error) {
        throw new Error('Failed to install dependencies.');
    }
    console.log('\n3. Building CLI...');
    try {
        (0, child_process_1.execSync)('npm run build', {
            cwd: cliDir,
            stdio: 'inherit'
        });
    }
    catch (error) {
        throw new Error('Failed to build CLI.');
    }
    console.log('\n4. Linking CLI globally...');
    try {
        (0, child_process_1.execSync)('npm link', {
            cwd: cliDir,
            stdio: 'inherit'
        });
    }
    catch (error) {
        throw new Error('Failed to link CLI globally.');
    }
    console.log('\n5. Verifying installation...');
    try {
        const version = (0, child_process_1.execSync)('crm --version', {
            cwd: cliDir,
            encoding: 'utf-8'
        }).trim();
        console.log(`   Current version: ${version}`);
    }
    catch (error) {
        throw new Error('Failed to verify installation.');
    }
}
//# sourceMappingURL=update.js.map