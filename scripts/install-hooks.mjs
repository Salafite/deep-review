#!/usr/bin/env node
/**
 * deep-review · install-hooks.mjs
 *
 * Pre-commit hook generator for Git repositories.
 * Installs or manages git pre-commit hooks to verify staged changes before committing.
 * Optionally installs the complementary cloudflare/security-audit-skill.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const HELP = `deep-review · install-hooks.mjs

Usage:
  node install-hooks.mjs [options]

Options:
  --install              Install the deep-review pre-commit hook into .git/hooks/
  --uninstall            Remove the installed deep-review hook
  --check                Check if the hook is installed and active
  --repo-dir <dir>       Path to git repository (default: current directory)
  --mode <fast|full>     Execution mode:
                           fast (default) - Runs complexity triage and hygiene gate
                           full           - Runs full local two-model adversarial audit
  --with-security-audit  Also install cloudflare/security-audit-skill for deep threat hunting
  --help, -h             Show this help message
`;

function parseArgs(argv) {
  const opts = {
    repoDir: process.cwd(),
    mode: 'fast',
    action: 'install',
    withSecurityAudit: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      process.stdout.write(HELP);
      process.exit(0);
    } else if (arg === '--install') {
      opts.action = 'install';
    } else if (arg === '--uninstall') {
      opts.action = 'uninstall';
    } else if (arg === '--check') {
      opts.action = 'check';
    } else if (arg === '--with-security-audit') {
      opts.withSecurityAudit = true;
    } else if (arg === '--mode') {
      opts.mode = argv[++i] || 'fast';
    } else if (arg === '--repo-dir') {
      opts.repoDir = path.resolve(argv[++i]);
    } else {
      process.stderr.write(`Unknown option: ${arg}\n`);
      process.exit(2);
    }
  }
  return opts;
}

function getGitDir(root) {
  const gitPath = path.join(root, '.git');
  if (!fs.existsSync(gitPath)) {
    throw new Error(`Not a git repository: ${root} (missing .git directory)`);
  }
  if (fs.statSync(gitPath).isFile()) {
    const content = fs.readFileSync(gitPath, 'utf8').trim();
    const match = content.match(/^gitdir:\s*(.+)$/i);
    if (match) return path.resolve(root, match[1]);
  }
  return gitPath;
}

function generateHookScript(mode, skillRoot) {
  return `#!/bin/sh
# deep-review pre-commit hook
# Mode: ${mode}

echo "🔍 [deep-review] Running pre-commit validation (${mode} mode)..."

# Check if there are staged changes
if git diff --cached --quiet; then
  exit 0
fi

if [ "${mode}" = "full" ]; then
  # Full local adversarial audit
  node "${path.join(skillRoot, 'scripts', 'review-pr.mjs').replace(/\\/g, '/')}" --local --base HEAD
  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo "❌ [deep-review] Pre-commit audit flagged blocking issues. Commit aborted."
    exit $EXIT_CODE
  fi
else
  # Fast complexity & surface triage
  if command -v python >/dev/null 2>&1; then
    git diff --cached | python "${path.join(skillRoot, 'scripts', 'pr-analyzer.py').replace(/\\/g, '/')}"
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
      echo "⚠️ [deep-review] Pre-commit triage check failed."
      exit $EXIT_CODE
    fi
  fi
fi

echo "✅ [deep-review] Staged changes passed pre-commit check."
exit 0
`;
}

function installSecurityAudit() {
  console.log(`\n🛡️ [deep-review] Installing cloudflare/security-audit-skill...`);
  try {
    execSync('npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit', { stdio: 'inherit' });
    console.log(`✅ cloudflare/security-audit-skill installed successfully.`);
  } catch (err) {
    console.warn(`⚠️ Could not automatically run npx skills add. You can install it manually:`);
    console.warn(`   npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit`);
  }
}

function main() {
  const opts = parseArgs(process.argv);
  const gitDir = getGitDir(opts.repoDir);
  const hooksDir = path.join(gitDir, 'hooks');
  const hookFile = path.join(hooksDir, 'pre-commit');
  const skillRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..').replace(/^\/([A-Za-z]:)/, '$1');

  if (opts.action === 'check') {
    if (fs.existsSync(hookFile)) {
      const content = fs.readFileSync(hookFile, 'utf8');
      if (content.includes('deep-review')) {
        console.log(`✅ deep-review hook is installed in: ${hookFile}`);
        process.exit(0);
      }
    }
    console.log(`❌ deep-review hook is not installed in: ${hookFile}`);
    process.exit(1);
  }

  if (opts.action === 'uninstall') {
    if (fs.existsSync(hookFile)) {
      const content = fs.readFileSync(hookFile, 'utf8');
      if (content.includes('deep-review')) {
        fs.unlinkSync(hookFile);
        console.log(`🗑️ Removed deep-review pre-commit hook.`);
        process.exit(0);
      }
    }
    console.log(`ℹ️ No deep-review hook was active.`);
    process.exit(0);
  }

  // Install hook
  fs.mkdirSync(hooksDir, { recursive: true });
  const scriptContent = generateHookScript(opts.mode, skillRoot);
  fs.writeFileSync(hookFile, scriptContent, { mode: 0o755 });
  console.log(`🎉 Successfully installed deep-review pre-commit hook (${opts.mode} mode) at:`);
  console.log(`   ${hookFile}`);

  if (opts.withSecurityAudit) {
    installSecurityAudit();
  } else {
    console.log(`\n💡 Tip: For comprehensive penetration testing and threat modeling, install Cloudflare's security-audit:`);
    console.log(`   node scripts/install-hooks.mjs --with-security-audit`);
    console.log(`   or: npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit\n`);
  }
}

main();
