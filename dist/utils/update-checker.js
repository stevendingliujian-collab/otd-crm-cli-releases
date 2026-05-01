"use strict";
/**
 * Update checker - Check for new CLI versions on startup
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
exports.checkForUpdates = checkForUpdates;
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const CACHE_FILE = path.join(__dirname, '../../.version-cache.json');
const CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour
/**
 * Check for updates and notify if new version available
 * Non-blocking, runs in background
 */
async function checkForUpdates() {
    try {
        const currentVersion = getCurrentVersion();
        const cache = loadCache();
        // Skip if checked recently
        if (cache.lastChecked && Date.now() - cache.lastChecked < CHECK_INTERVAL) {
            if (cache.latestVersion !== currentVersion && compareVersions(currentVersion, cache.latestVersion) < 0) {
                showUpdateNotification(currentVersion, cache.latestVersion);
            }
            return;
        }
        // Fetch latest version (non-blocking)
        const latestVersion = await fetchLatestVersion();
        // Save cache
        saveCache({
            lastChecked: Date.now(),
            latestVersion,
            currentVersion,
        });
        // Show notification if update available
        if (compareVersions(currentVersion, latestVersion) < 0) {
            showUpdateNotification(currentVersion, latestVersion);
        }
    }
    catch (error) {
        // Silently fail - update check is not critical
    }
}
/**
 * Get current CLI version
 */
function getCurrentVersion() {
    const packagePath = path.join(__dirname, '../../package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    return packageData.version || '0.0.0';
}
/**
 * Load version cache from file
 */
function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        }
    }
    catch (error) {
        // Ignore cache errors
    }
    return {
        lastChecked: 0,
        latestVersion: '0.0.0',
        currentVersion: '0.0.0',
    };
}
/**
 * Save version cache to file
 */
function saveCache(cache) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    }
    catch (error) {
        // Ignore cache write errors
    }
}
/**
 * Fetch latest version from GitHub Releases API (public releases repo).
 * Uses /releases/latest which returns the most recently published release.
 */
async function fetchLatestVersion() {
    try {
        const response = await axios_1.default.get('https://api.github.com/repos/stevendingliujian-collab/otd-crm-cli-releases/releases/latest', {
            timeout: 5000,
            headers: {
                'User-Agent': 'crm-cli-update-checker',
                'Accept': 'application/vnd.github.v3+json',
            },
        });
        if (response.data && response.data.tag_name) {
            return response.data.tag_name.replace(/^v/, '');
        }
    }
    catch (error) {
        // GitHub not accessible, return current version silently
    }
    return getCurrentVersion();
}
/**
 * Compare two version strings
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
 * Show update notification
 */
function showUpdateNotification(current, latest) {
    const message = [
        '',
        '╔══════════════════════════════════════════════════════════╗',
        '║  📦 New version available!                               ║',
        `║     Current:  v${current.padEnd(10)}  →  Latest: v${latest.padEnd(10)}  ║`,
        '║                                                          ║',
        '║     Run: crm update                                      ║',
        '╚══════════════════════════════════════════════════════════╝',
        '',
    ].join('\n');
    // Print to stderr so it doesn't interfere with JSON output
    console.error(message);
}
//# sourceMappingURL=update-checker.js.map