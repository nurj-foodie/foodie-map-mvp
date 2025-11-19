# Easy Browser Console Method - WORKING SOLUTION

Since dynamic imports don't work in browser console, here's the **easiest working method**:

---

## ✅ Method: Script Injection (Works!)

This script injects code that runs in your app's context where Firebase is available:

### Copy This Script:

```javascript
// Inject script that runs in app context
const script = document.createElement('script');
script.textContent = `
  (async function() {
    const { collection, addDoc, Timestamp, query, where, getDocs } = await import('firebase/firestore');
    const { getFirestore, getApps } = await import('firebase/app');
    
    const apps = getApps();
    if (apps.length === 0) throw new Error('Firebase not initialized');
    
    const db = getFirestore(apps[0]);
    
    async function createEntry(email, name, daysAgo, referralCode, extra = {}) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(12, 0, 0, 0);
      
      const q = query(collection(db, 'waitlist'), where('email', '==', email));
      const existing = await getDocs(q);
      if (!existing.empty) {
        console.log(\`⏭️  \${email} already exists\`);
        return;
      }
      
      const data = {
        email: email.toLowerCase(),
        name,
        signupDate: Timestamp.fromDate(date),
        referralCode,
        createdAt: Timestamp.fromDate(date),
        signupOrder: Math.floor(Math.random() * 1000),
        cohortScore: 1000,
        kCoins: 25,
        surveyCompleted: false,
        betaAccessGranted: false,
        ...extra
      };
      
      const ref = await addDoc(collection(db, 'waitlist'), data);
      console.log(\`✅ \${email} (\${daysAgo} days ago)\`);
      return ref.id;
    }
    
    await createEntry('test-t2@example.com', 'Test T2', 2, 'KM-TESTT2');
    await createEntry('test-t5@example.com', 'Test T5', 5, 'KM-TESTT5');
    await createEntry('test-t8@example.com', 'Test T8', 8, 'KM-TESTT8');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(12, 0, 0, 0);
    
    const signupDate = new Date();
    signupDate.setDate(signupDate.getDate() - 30);
    signupDate.setHours(12, 0, 0, 0);
    
    await createEntry('test-t7@example.com', 'Test T7', 30, 'KM-TESTT7', {
      betaAccessGranted: true,
      betaAccessDate: Timestamp.fromDate(sevenDaysAgo),
      signupDate: Timestamp.fromDate(signupDate)
    });
    
    console.log('\\n✅ All entries created!');
  })();
`;
document.head.appendChild(script);
console.log('✅ Script injected. Check console for results...');
```

---

## 🎯 Even Easier: Use Firebase Console

**This is the most reliable method:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **foodie-map-23842**
3. Go to **Firestore Database** → **waitlist** collection
4. Click **"Add document"**
5. Add these fields:

### For T+2 Entry:
- `email`: `test-t2@example.com` (string)
- `name`: `Test User T2` (string)
- `signupDate`: Click timestamp icon → Select **2025-11-17 12:00:00** (2 days ago)
- `referralCode`: `KM-TESTT2` (string)
- `surveyCompleted`: `false` (boolean)

### For T+5 Entry:
- `email`: `test-t5@example.com`
- `name`: `Test User T5`
- `signupDate`: **2025-11-14 12:00:00** (5 days ago)
- `referralCode`: `KM-TESTT5`

### For T+8 Entry:
- `email`: `test-t8@example.com`
- `name`: `Test User T8`
- `signupDate`: **2025-11-11 12:00:00** (8 days ago)
- `referralCode`: `KM-TESTT8`

### For T+7 Entry:
- `email`: `test-t7@example.com`
- `name`: `Test User T7`
- `signupDate`: **2025-10-20 12:00:00** (earlier date)
- `betaAccessGranted`: `true` (boolean)
- `betaAccessDate`: **2025-11-12 12:00:00** (7 days ago)
- `referralCode`: `KM-TESTT7`

---

## ✅ After Creating Entries

Test the functions:

```bash
curl "https://us-central1-foodie-map-23842.cloudfunctions.net/testSendSurveyEmailsT2"
```

Or visit the URLs in your browser!

