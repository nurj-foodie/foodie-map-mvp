# 🔒 SECURITY QUICK REFERENCE

**TL;DR:** Just commit normally. The hook checks automatically.

---

## 🚀 Daily Workflow

```bash
# 1. Make changes
# 2. Stage files
git add .

# 3. Commit (automatic check)
git commit -m "Your message"
```

**That's it!** The pre-commit hook checks automatically.

---

## 🚨 If Commit Fails

1. Read error message (tells you which file has the issue)
2. Fix the issue (replace hardcoded secret with `process.env.REACT_APP_*`)
3. Commit again

---

## 📚 Need Help?

- **Quick help:** [`HOW_TO_USE_SECURITY_SYSTEM.md`](./HOW_TO_USE_SECURITY_SYSTEM.md)
- **Detailed guide:** [`SECURITY_PREVENTION_GUIDE.md`](./SECURITY_PREVENTION_GUIDE.md)
- **Checklist:** [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md)

---

**The system works automatically - just commit normally!** ✅

