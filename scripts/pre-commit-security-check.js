#!/usr/bin/env node

/**
 * Pre-commit Security Check Script (Node.js version)
 * This script prevents committing secrets, API keys, passwords, and emails to Git
 * 
 * Usage: node scripts/pre-commit-security-check.js
 * Or add to .git/hooks/pre-commit
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let foundIssues = 0;

console.log('🔒 Running pre-commit security check...\n');

// Get list of staged files
let stagedFiles = [];
try {
    const result = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' });
    stagedFiles = result.trim().split('\n').filter(file => file);
} catch (error) {
    console.log('No files staged for commit.');
    process.exit(0);
}

if (stagedFiles.length === 0) {
    console.log('No files staged for commit.');
    process.exit(0);
}

console.log(`Checking ${stagedFiles.length} staged file(s)...\n`);

// Check for hardcoded API keys
console.log('🔍 Checking for hardcoded API keys...');
const apiKeyPatterns = [
    /AIza[0-9A-Za-z_-]{35}/,
    /ya29\.[0-9A-Za-z_-]+/,
    /sk-[0-9A-Za-z_-]+/,
    /AIzaSy[A-Za-z0-9_-]{35}/
];

for (const file of stagedFiles) {
    if (!fs.existsSync(file)) continue;
    
    try {
        const diff = execSync(`git diff --cached "${file}"`, { encoding: 'utf-8' });
        
        for (const pattern of apiKeyPatterns) {
            if (pattern.test(diff)) {
                // Check if it's a placeholder
                if (!diff.includes('YOUR_') && !diff.includes('PLACEHOLDER') && !diff.includes('process.env')) {
                    console.error(`${RED}❌ ERROR: Found hardcoded API key in ${file}${RESET}`);
                    console.error(`${YELLOW}   Pattern: ${pattern}${RESET}`);
                    foundIssues = 1;
                }
            }
        }
    } catch (error) {
        // File might not exist or might be binary
    }
}

// Check for hardcoded passwords
console.log('🔍 Checking for hardcoded passwords...');
const passwordPatterns = [
    /password\s*[:=]\s*['"](?![YOUR_|PLACEHOLDER|process\.env|example])[^'"]{6,}['"]/i,
    /PASSWORD\s*[:=]\s*['"](?![YOUR_|PLACEHOLDER|process\.env|example])[^'"]{6,}['"]/
];

for (const file of stagedFiles) {
    if (!fs.existsSync(file)) continue;
    
    try {
        const diff = execSync(`git diff --cached "${file}"`, { encoding: 'utf-8' });
        
        for (const pattern of passwordPatterns) {
            if (pattern.test(diff)) {
                // Check if it's a placeholder or process.env
                if (!diff.includes('YOUR_') && !diff.includes('PLACEHOLDER') && !diff.includes('process.env') && !diff.includes('example')) {
                    console.error(`${RED}❌ ERROR: Found hardcoded password in ${file}${RESET}`);
                    foundIssues = 1;
                }
            }
        }
    } catch (error) {
        // File might not exist or might be binary
    }
}

// Check for hardcoded emails (admin/founder emails)
console.log('🔍 Checking for hardcoded admin/founder emails...');
const emailPatterns = [
    /@gmail\.com/,
    /@outlook\.com/,
    /@yahoo\.com/,
    /@foodie.*\.com/,
    /admin.*@.*\.com/i,
    /founder.*@.*\.com/i
];

const safeEmails = [
    /example\.com/,
    /admin@example\.com/,
    /user[0-9]@example\.com/,
    /YOUR_EMAIL/,
    /PLACEHOLDER/
];

for (const file of stagedFiles) {
    if (!fs.existsSync(file)) continue;
    
    try {
        const diff = execSync(`git diff --cached "${file}"`, { encoding: 'utf-8' });
        
        for (const pattern of emailPatterns) {
            if (pattern.test(diff)) {
                // Check if it's a safe email (placeholder or process.env)
                let isSafe = false;
                for (const safe of safeEmails) {
                    if (safe.test(diff)) {
                        isSafe = true;
                        break;
                    }
                }
                
                if (!isSafe && !diff.includes('process.env')) {
                    console.error(`${RED}❌ ERROR: Found hardcoded email in ${file}${RESET}`);
                    foundIssues = 1;
                }
            }
        }
    } catch (error) {
        // File might not exist or might be binary
    }
}

// Check for .env files
console.log('🔍 Checking for .env files...');
for (const file of stagedFiles) {
    if (file.includes('.env') && !file.includes('.env.example')) {
        console.error(`${RED}❌ ERROR: Found .env file in staging: ${file}${RESET}`);
        console.error(`${YELLOW}   .env files should NEVER be committed to Git!${RESET}`);
        foundIssues = 1;
    }
}

// Summary
if (foundIssues === 1) {
    console.log('\n' + RED + '❌ SECURITY CHECK FAILED!' + RESET);
    console.log(YELLOW + 'Please remove all hardcoded secrets, API keys, passwords, and emails before committing.' + RESET);
    console.log('\nRecommended actions:');
    console.log('1. Replace hardcoded values with environment variables (process.env.REACT_APP_*)');
    console.log('2. Use placeholders (YOUR_API_KEY_HERE, YOUR_EMAIL_HERE) in test files');
    console.log('3. Ensure .env files are in .gitignore');
    console.log('4. Review files before committing\n');
    process.exit(1);
} else {
    console.log(GREEN + '✅ Security check passed!' + RESET);
    process.exit(0);
}

