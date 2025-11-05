#!/bin/bash

# Pre-commit Security Check Script
# This script prevents committing secrets, API keys, passwords, and emails to Git

echo "🔒 Running pre-commit security check..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if we found any issues
FOUND_ISSUES=0

# Get list of files that are staged for commit
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    echo "No files staged for commit."
    exit 0
fi

echo "Checking ${#STAGED_FILES[@]} staged file(s)..."

# Check for hardcoded API keys
echo "🔍 Checking for hardcoded API keys..."
API_KEY_PATTERNS=(
    "AIza[0-9A-Za-z_-]{35}"
    "ya29\.[0-9A-Za-z_-]+"
    "sk-[0-9A-Za-z_-]+"
    "AIzaSy[A-Za-z0-9_-]{35}"
)

for file in $STAGED_FILES; do
    if [ -f "$file" ]; then
        for pattern in "${API_KEY_PATTERNS[@]}"; do
            if git diff --cached "$file" | grep -qE "$pattern"; then
                echo -e "${RED}❌ ERROR: Found hardcoded API key in $file${NC}"
                echo -e "${YELLOW}   Pattern: $pattern${NC}"
                FOUND_ISSUES=1
            fi
        done
    fi
done

# Check for hardcoded passwords
echo "🔍 Checking for hardcoded passwords..."
PASSWORD_PATTERNS=(
    "password.*=.*['\"][^'\"]{6,}['\"]"
    "PASSWORD.*=.*['\"][^'\"]{6,}['\"]"
    "password:.*['\"][^'\"]{6,}['\"]"
    "password\":.*['\"][^'\"]{6,}['\"]"
)

for file in $STAGED_FILES; do
    if [ -f "$file" ]; then
        for pattern in "${PASSWORD_PATTERNS[@]}"; do
            if git diff --cached "$file" | grep -qiE "$pattern"; then
                # Skip if it's a placeholder or process.env
                if ! git diff --cached "$file" | grep -qiE "$pattern" | grep -qE "process\.env|YOUR_|PLACEHOLDER|example"; then
                    echo -e "${RED}❌ ERROR: Found hardcoded password in $file${NC}"
                    echo -e "${YELLOW}   Pattern: $pattern${NC}"
                    FOUND_ISSUES=1
                fi
            fi
        done
    fi
done

# Check for hardcoded emails (admin/founder emails)
echo "🔍 Checking for hardcoded admin/founder emails..."
EMAIL_PATTERNS=(
    "@gmail\.com"
    "@outlook\.com"
    "@yahoo\.com"
    "@foodie.*\.com"
    "admin.*@.*\.com"
    "founder.*@.*\.com"
)

# Known safe email patterns (placeholders, examples)
SAFE_EMAILS=(
    "example\.com"
    "admin@example\.com"
    "user[0-9]@example\.com"
    "YOUR_EMAIL"
    "PLACEHOLDER"
)

for file in $STAGED_FILES; do
    if [ -f "$file" ]; then
        for pattern in "${EMAIL_PATTERNS[@]}"; do
            if git diff --cached "$file" | grep -qiE "$pattern"; then
                # Check if it's a safe email (placeholder)
                IS_SAFE=0
                for safe in "${SAFE_EMAILS[@]}"; do
                    if git diff --cached "$file" | grep -qiE "$pattern" | grep -qE "$safe"; then
                        IS_SAFE=1
                        break
                    fi
                done
                
                # Skip if it's process.env
                if git diff --cached "$file" | grep -qiE "$pattern" | grep -qE "process\.env"; then
                    IS_SAFE=1
                fi
                
                if [ $IS_SAFE -eq 0 ]; then
                    echo -e "${RED}❌ ERROR: Found hardcoded email in $file${NC}"
                    echo -e "${YELLOW}   Pattern: $pattern${NC}"
                    FOUND_ISSUES=1
                fi
            fi
        done
    fi
done

# Check for .env files
echo "🔍 Checking for .env files..."
for file in $STAGED_FILES; do
    if [[ "$file" == *.env* ]] && [[ "$file" != *.env.example* ]]; then
        echo -e "${RED}❌ ERROR: Found .env file in staging: $file${NC}"
        echo -e "${YELLOW}   .env files should NEVER be committed to Git!${NC}"
        FOUND_ISSUES=1
    fi
done

# Summary
if [ $FOUND_ISSUES -eq 1 ]; then
    echo ""
    echo -e "${RED}❌ SECURITY CHECK FAILED!${NC}"
    echo -e "${YELLOW}Please remove all hardcoded secrets, API keys, passwords, and emails before committing.${NC}"
    echo ""
    echo "Recommended actions:"
    echo "1. Replace hardcoded values with environment variables (process.env.REACT_APP_*)"
    echo "2. Use placeholders (YOUR_API_KEY_HERE, YOUR_EMAIL_HERE) in test files"
    echo "3. Ensure .env files are in .gitignore"
    echo "4. Review files before committing"
    exit 1
else
    echo -e "${GREEN}✅ Security check passed!${NC}"
    exit 0
fi

