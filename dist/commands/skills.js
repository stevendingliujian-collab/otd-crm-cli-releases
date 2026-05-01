"use strict";
/**
 * crm install-skills — Install Claude Code skills bundled with this package
 *
 * Copies all crm-* skill directories from the package's `skills/` folder
 * into the user's ~/.claude/skills/ directory so they can be used directly
 * in Claude Code.
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
exports.skillsCommands = skillsCommands;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const SKILLS_SRC = path.join(__dirname, '../../skills');
const SKILLS_DEST = path.join(os.homedir(), '.claude', 'skills');
function skillsCommands(cli) {
    const skills = cli.command('skills').description('Manage CRM Claude Code skills');
    skills
        .command('install')
        .description('Install CRM skills into ~/.claude/skills/ for use in Claude Code')
        .option('--list', 'List available skills without installing')
        .option('--force', 'Overwrite existing skills')
        .action((options) => {
        handleInstallSkills(options);
    });
    skills
        .command('list')
        .description('List installed CRM skills')
        .action(() => {
        handleListSkills();
    });
}
function getAvailableSkills() {
    if (!fs.existsSync(SKILLS_SRC)) {
        return [];
    }
    return fs
        .readdirSync(SKILLS_SRC)
        .filter((name) => fs.statSync(path.join(SKILLS_SRC, name)).isDirectory())
        .sort();
}
function handleInstallSkills(options) {
    const available = getAvailableSkills();
    if (available.length === 0) {
        console.error('❌ No skills found in package. Please reinstall crm-cli.');
        process.exit(1);
    }
    if (options.list) {
        console.log('\n📦 Available CRM skills:\n');
        for (const skill of available) {
            const skillMd = path.join(SKILLS_SRC, skill, 'SKILL.md');
            let description = '';
            if (fs.existsSync(skillMd)) {
                const firstLine = fs.readFileSync(skillMd, 'utf-8').split('\n').find(l => l.startsWith('#'));
                description = firstLine ? firstLine.replace(/^#+\s*/, '') : '';
            }
            const installed = fs.existsSync(path.join(SKILLS_DEST, skill));
            const status = installed ? '✅' : '  ';
            console.log(`  ${status} ${skill.padEnd(28)} ${description}`);
        }
        console.log(`\n  ✅ = already installed    Total: ${available.length} skills`);
        console.log('\nRun `crm skills install` to install all skills.\n');
        return;
    }
    // Ensure destination exists
    fs.mkdirSync(SKILLS_DEST, { recursive: true });
    const results = { installed: 0, updated: 0, skipped: 0 };
    console.log(`\n📦 Installing CRM skills to ${SKILLS_DEST}\n`);
    for (const skill of available) {
        const src = path.join(SKILLS_SRC, skill);
        const dest = path.join(SKILLS_DEST, skill);
        const alreadyExists = fs.existsSync(dest);
        if (alreadyExists && !options.force) {
            // Check if source is newer
            const srcMtime = fs.statSync(path.join(src, 'SKILL.md')).mtimeMs;
            const destMtime = fs.existsSync(path.join(dest, 'SKILL.md'))
                ? fs.statSync(path.join(dest, 'SKILL.md')).mtimeMs
                : 0;
            if (srcMtime <= destMtime) {
                console.log(`  ⏭  ${skill} (up to date)`);
                results.skipped++;
                continue;
            }
        }
        copyDir(src, dest);
        if (alreadyExists) {
            console.log(`  🔄 ${skill} (updated)`);
            results.updated++;
        }
        else {
            console.log(`  ✅ ${skill} (installed)`);
            results.installed++;
        }
    }
    console.log('\n─────────────────────────────────────────');
    console.log(`  Installed: ${results.installed}  Updated: ${results.updated}  Skipped: ${results.skipped}`);
    console.log('─────────────────────────────────────────');
    console.log('\n🎉 Skills are ready to use in Claude Code!\n');
    if (results.installed + results.updated > 0) {
        console.log('   Restart Claude Code (or reload the window) to activate new skills.\n');
    }
}
function handleListSkills() {
    if (!fs.existsSync(SKILLS_DEST)) {
        console.log('\nNo skills installed yet. Run `crm skills install` to install.\n');
        return;
    }
    const installed = fs
        .readdirSync(SKILLS_DEST)
        .filter((name) => name.startsWith('crm-') &&
        fs.statSync(path.join(SKILLS_DEST, name)).isDirectory())
        .sort();
    if (installed.length === 0) {
        console.log('\nNo CRM skills installed. Run `crm skills install` to install.\n');
        return;
    }
    console.log('\n📋 Installed CRM skills:\n');
    for (const skill of installed) {
        const skillMd = path.join(SKILLS_DEST, skill, 'SKILL.md');
        let description = '';
        if (fs.existsSync(skillMd)) {
            const firstLine = fs.readFileSync(skillMd, 'utf-8').split('\n').find(l => l.startsWith('#'));
            description = firstLine ? firstLine.replace(/^#+\s*/, '') : '';
        }
        console.log(`  ✅ ${skill.padEnd(28)} ${description}`);
    }
    console.log(`\n  Total: ${installed.length} skills\n`);
}
/**
 * Recursively copy a directory
 */
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        }
        else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
//# sourceMappingURL=skills.js.map