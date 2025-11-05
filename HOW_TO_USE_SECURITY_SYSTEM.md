# 🔒 HOW TO USE SECURITY SYSTEM - Quick Reference

**Date:** 5 November 2025  
**Purpose:** Simple guide on how to use the security system in daily workflow

---

## 🚀 QUICK START (3 Steps)

### Step 1: Make Your Changes
```bash
# Edit your files normally
# ... make changes ...
```

### Step 2: Stage Your Changes
```bash
git add .
```

### Step 3: Commit (Automatic Check)
```bash
git commit -m "Your commit message"
```

**That's it!** The pre-commit hook will automatically check for secrets.

---

## 📋 NORMAL WORKFLOW

### Daily Workflow (Recommended):

```bash
# 1. Make your changes
# ... edit files ...

# 2. Stage files
git add .

# 3. Commit (automatic security check runs here)
git commit -m "Your commit message"

# ✅ If security check passes → Commit succeeds
# ❌ If security check fails → Commit blocked, fix issues, try again
```

**The pre-commit hook runs automatically - you don't need to do anything extra!**

---

## 🔍 MANUAL CHECK (Optional)

If you want to check before committing:

```bash
# Run security check manually
./scripts/pre-commit-security-check.sh

# If it passes, proceed with commit
git commit -m "Your commit message"
```

**Note:** You don't need to do this - the hook does it automatically. But it's useful if you want to check early.

---

## 🚨 IF SECURITY CHECK FAILS

### What Happens:
```
❌ SECURITY CHECK FAILED!
Please remove all hardcoded secrets, API keys, passwords, and emails before committing.
```

### How to Fix:

1. **Read the error message** - It tells you which file has the issue
2. **Fix the issue:**
   - Replace hardcoded secrets with `process.env.REACT_APP_*`
   - Use placeholders in test files
3. **Run check again:**
   ```bash
   ./scripts/pre-commit-security-check.sh
   ```
4. **Commit again:**
   ```bash
   git commit -m "Your commit message"
   ```

---

## 📚 DOCUMENTATION FILES (Quick Reference)

### When to Use Each File:

| File | When to Use | Purpose |
|------|-------------|---------|
| **HOW_TO_USE_SECURITY_SYSTEM.md** (this file) | **Every time** | Quick reference for daily workflow |
| **SECURITY_PREVENTION_GUIDE.md** | When you need details | Comprehensive prevention guide |
| **SECURITY_CHECKLIST.md** | Before important commits | Pre-commit checklist |
| **SECURITY_VERIFICATION.md** | After fixing issues | Verification results |
| **SECURITY_FIXES_APPLIED.md** | Reference only | What was fixed previously |

---

## 🎯 COMMON SCENARIOS

### Scenario 1: Normal Commit
```bash
# Just commit normally
git add .
git commit -m "Add new feature"
# ✅ Hook checks automatically, commit succeeds
```

### Scenario 2: Security Check Failed
```bash
git add .
git commit -m "Add new feature"
# ❌ Hook blocks commit, shows error

# Fix the issue (remove hardcoded secret)
# ... edit file ...

# Try again
git add .
git commit -m "Add new feature"
# ✅ Hook checks again, commit succeeds
```

### Scenario 3: Want to Check Early
```bash
# Make changes
# ... edit files ...

# Check before staging
./scripts/pre-commit-security-check.sh

# If passes, stage and commit
git add .
git commit -m "Add new feature"
```

### Scenario 4: Need to Bypass (Emergency Only)
```bash
# ⚠️ ONLY IN EMERGENCIES!
git commit --no-verify -m "Emergency commit"
# ⚠️ This bypasses the security check - NOT RECOMMENDED!
```

---

## 🔧 TROUBLESHOOTING

### Issue: "Permission denied" when running script

**Fix:**
```bash
chmod +x scripts/pre-commit-security-check.sh
chmod +x scripts/pre-commit-security-check.js
```

### Issue: Pre-commit hook not running

**Fix:**
```bash
# Reinstall hook
chmod +x .git/hooks/pre-commit
```

### Issue: Need help fixing a security issue

**Solution:**
1. Read `SECURITY_PREVENTION_GUIDE.md` - Section "HOW TO FIX COMMON ISSUES"
2. Check the error message - it tells you which file has the issue
3. Replace hardcoded value with `process.env.REACT_APP_*`

---

## 📝 QUICK REFERENCE COMMANDS

```bash
# Normal commit (automatic check)
git add .
git commit -m "Your message"

# Manual check before committing
./scripts/pre-commit-security-check.sh

# Check if .env is ignored
git check-ignore .env

# Check for secrets in staged files
git diff --cached | grep -i "AIza\|password\|@gmail"

# List all staged files
git diff --cached --name-only
```

---

## 🎓 BEST PRACTICES

### ✅ DO:
- ✅ Commit normally - hook checks automatically
- ✅ Read error messages if commit fails
- ✅ Fix issues before committing again
- ✅ Use `process.env.REACT_APP_*` for secrets
- ✅ Use placeholders in test files

### ❌ DON'T:
- ❌ Use `--no-verify` to bypass checks (unless emergency)
- ❌ Hardcode secrets in files
- ❌ Commit `.env` files
- ❌ Ignore security warnings

---

## 🆘 NEED HELP?

### Quick Help:

1. **Security check failed?**
   - Read the error message
   - Check `SECURITY_PREVENTION_GUIDE.md` - "HOW TO FIX COMMON ISSUES"

2. **Don't know how to fix?**
   - Check `SECURITY_PREVENTION_GUIDE.md` - Examples for each issue type

3. **Want to verify everything is OK?**
   - Run: `./scripts/pre-commit-security-check.sh`
   - Check: `git check-ignore .env` (should show `.env`)

---

## ✅ SUMMARY

**For daily use:**
1. Just commit normally - the hook does everything automatically
2. If commit fails, fix the issue and try again
3. Use `SECURITY_PREVENTION_GUIDE.md` for detailed help

**You don't need to remember anything special - just commit normally!**

---

## 📚 FULL DOCUMENTATION

For detailed information, see:
- **`SECURITY_PREVENTION_GUIDE.md`** - Complete prevention guide
- **`SECURITY_CHECKLIST.md`** - Pre-commit checklist
- **`SECURITY_VERIFICATION.md`** - Verification results
- **`SECURITY_FIXES_APPLIED.md`** - What was fixed previously

---

**Remember: The system works automatically - just commit normally!** 🎉

