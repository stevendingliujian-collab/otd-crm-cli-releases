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
const RELEASES_REPO = 'stevendingliujian-collab/otd-crm-cli-releases';
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
        console.log(`   Release:  ${latestRelease.url}`);
        console.log(`   Install:  npm install -g ${latestRelease.tarballUrl}\n`);
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
        await performUpdate(latestRelease.tarballUrl, latestRelease.version);
        console.log('\n✅ Update successful!');
        console.log(`🎉 CRM CLI updated to v${latestRelease.version}\n`);
    }
    catch (error) {
        console.error('❌ Update failed:', error instanceof Error ? error.message : error);
        console.error('\n💡 You can manually update by running:');
        console.error(`   npm install -g https://github.com/${RELEASES_REPO}/releases/latest/download/otd-crm-cli-latest.tgz\n`);
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
 * Get latest release info from GitHub Releases API (public releases repo)
 */
async function getLatestRelease() {
    try {
        const response = await axios_1.default.get(`https://api.github.com/repos/${RELEASES_REPO}/releases/latest`, {
            timeout: 15000,
            headers: {
                'User-Agent': 'crm-cli-update',
                'Accept': 'application/vnd.github.v3+json',
            },
        });
        const release = response.data;
        if (!release || !release.tag_name) {
            throw new Error('No releases found');
        }
        const version = release.tag_name.replace(/^v/, '');
        // Find the .tgz asset uploaded by npm pack
        const tgzAsset = (release.assets || []).find((a) => a.name.endsWith('.tgz'));
        const tarballUrl = tgzAsset
            ? tgzAsset.browser_download_url
            : `https://github.com/${RELEASES_REPO}/releases/download/${release.tag_name}/otd-crm-cli-${version}.tgz`;
        return {
            version,
            publishedAt: release.published_at || new Date().toISOString(),
            url: release.html_url,
            tagName: release.tag_name,
            tarballUrl,
        };
    }
    catch (error) {
        // Re-throw with user-friendly message
        if (error.response || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            throw new Error('无法连接到 GitHub，请检查网络连接。\n\n' +
                '手动更新方法：\n' +
                `  npm install -g https://github.com/${RELEASES_REPO}/releases/latest/download/otd-crm-cli-latest.tgz`);
        }
        throw error;
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
 * Perform the actual update via npm install -g <tarball-url>
 */
async function performUpdate(tarballUrl, targetVersion) {
    console.log(`1. Installing v${targetVersion} from GitHub Releases...`);
    console.log(`   ${tarballUrl}\n`);
    try {
        (0, child_process_1.execSync)(`npm install -g "${tarballUrl}"`, {
            stdio: 'inherit',
            env: { ...process.env },
        });
    }
    catch (error) {
        throw new Error(`安装失败。请手动执行：\n   npm install -g "${tarballUrl}"`);
    }
    console.log('\n2. Verifying installation...');
    try {
        const version = (0, child_process_1.execSync)('crm --version', { encoding: 'utf-8' }).trim();
        console.log(`   Installed version: ${version}`);
    }
    catch (error) {
        // Non-fatal: install succeeded even if version check fails
        console.log('   (version check skipped)');
    }
}
//# sourceMappingURL=update.js.map