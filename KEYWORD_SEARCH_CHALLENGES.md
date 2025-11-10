# 🎯 Keyword Search: Why It's Tricky

**Date:** 9 November 2025  
**Topic:** Understanding the complexity of intelligent keyword search

---

## 🤔 Why Is It Tricky?

Keyword search seems simple, but it's actually **very complex** because:

1. **Ambiguity** - Same word can mean different things
2. **Context** - Need to understand user intent
3. **Edge Cases** - Many unexpected scenarios
4. **API Costs** - Need to balance accuracy with budget
5. **Learning System** - Can learn wrong things if not careful

---

## 🐛 Challenges We Encountered

### **1. Parsing Order Matters** ⚠️

**Problem:**
- "nasi lemak" was parsed as `{location: "nasi", food: null}`
- "nasi" was matched as location BEFORE "nasi lemak" as food

**Why It Happened:**
- Locations were checked before food items
- "nasi" was incorrectly learned as a location

**Solution:**
- ✅ Check food items BEFORE locations
- ✅ Longer matches first (e.g., "nasi lemak" before "nasi")

---

### **2. Geocoding Can Return Wrong Results** ⚠️

**Problem:**
- "nasi " geocoded to Singapore (not Malaysia)
- System learned Singapore coordinates
- Future searches used wrong coordinates

**Why It Happened:**
- Google Maps API returns closest match
- "nasi" matched a street name in Singapore
- No validation for Malaysia-only

**Solution:**
- ✅ Validate geocoded results are in Malaysia
- ✅ Reject Singapore, Indonesia, Thailand results
- ✅ Skip geocoding for food prefixes

---

### **3. Food Prefixes Mistaken for Locations** ⚠️

**Problem:**
- "nasi ", "mee ", "roti " were being geocoded
- Wasted API calls
- Could return wrong results

**Why It Happened:**
- System tried to geocode everything
- No detection for food-related partial queries

**Solution:**
- ✅ Detect food prefixes before geocoding
- ✅ Skip geocoding for short food-related queries
- ✅ Prevent learning food prefixes as locations

---

### **4. Learning System Can Learn Wrong Things** ⚠️

**Problem:**
- "nasi" was learned as location with Singapore coordinates
- Affected future searches
- Had to manually delete from Firestore

**Why It Happened:**
- Learning happened automatically
- No validation before learning
- No protection against food words

**Solution:**
- ✅ Validate before learning
- ✅ Check for food prefixes
- ✅ Only learn Malaysia locations
- ✅ Manual cleanup capability

---

### **5. Compound Queries Are Complex** ⚠️

**Problem:**
- "roti canai petaling jaya" needs to extract:
  - Food: "roti canai"
  - Location: "petaling jaya"
- Order matters (food first or location first?)

**Why It's Tricky:**
- Need to parse multiple keywords
- Need to handle different combinations
- Need to prioritize correctly

**Solution:**
- ✅ Parse food items first (more specific)
- ✅ Then parse locations
- ✅ Handle remaining text correctly

---

### **6. API Budget Protection** ⚠️

**Problem:**
- Every geocoding call costs money
- Can't geocode everything
- Need to be smart about when to geocode

**Why It's Tricky:**
- Balance between accuracy and cost
- Need to skip unnecessary calls
- But still handle edge cases

**Solution:**
- ✅ Skip geocoding for food prefixes
- ✅ Skip geocoding for cuisine types
- ✅ Skip geocoding for very short queries
- ✅ Only geocode when necessary

---

## 🎯 Key Learnings

### **1. Order Matters**
- Check more specific things first (food items before locations)
- Longer matches before shorter matches
- Known patterns before unknown patterns

### **2. Validation Is Critical**
- Always validate geocoded results
- Check for Malaysia-only
- Prevent learning wrong things

### **3. Edge Cases Are Common**
- Food prefixes ("nasi ", "mee ")
- Partial queries ("nasi " vs "nasi lemak")
- Compound queries ("roti canai petaling jaya")
- Unknown locations ("kluang", "tawau")

### **4. Learning Needs Safeguards**
- Don't learn everything automatically
- Validate before learning
- Protect against food words
- Only learn Malaysia locations

### **5. Budget Protection Is Important**
- Skip unnecessary geocoding
- Validate before learning
- Prevent wasted API calls

---

## 🛡️ Safeguards We Built

### **1. Food Prefix Detection**
```javascript
isFoodPrefix(query) {
  // Skip geocoding for "nasi ", "mee ", "roti "
  if (query.length <= 6 && startsWithFoodPrefix) {
    return true; // Skip geocoding
  }
}
```

### **2. Malaysia Validation**
```javascript
const isInMalaysia = address.includes('malaysia') && 
                     !address.includes('singapore') &&
                     !address.includes('indonesia');
```

### **3. Parsing Order**
```javascript
// 1. Check food items FIRST (more specific)
// 2. Then check locations
// 3. Then check cuisines
```

### **4. Learning Protection**
```javascript
// Don't learn food prefixes
// Don't learn non-Malaysia locations
// Validate before learning
```

---

## 📊 Complexity Breakdown

| Aspect | Complexity | Why |
|--------|-----------|-----|
| **Parsing** | High | Multiple keywords, order matters |
| **Geocoding** | Medium | Can return wrong results, needs validation |
| **Learning** | High | Can learn wrong things, needs safeguards |
| **Budget** | Medium | Need to balance accuracy and cost |
| **Edge Cases** | Very High | Many unexpected scenarios |

---

## 💡 Why It's Worth It

Despite the complexity, intelligent keyword search provides:

1. ✅ **Better UX** - Users can search naturally
2. ✅ **Smarter Results** - Understands user intent
3. ✅ **Auto-Improvement** - Learns from usage
4. ✅ **Cost Efficiency** - Protects API budget
5. ✅ **Scalability** - Handles new locations automatically

---

## 🎓 Lessons Learned

### **1. Start Simple, Add Complexity Gradually**
- Basic search first
- Then add parsing
- Then add learning
- Then add safeguards

### **2. Test Edge Cases Early**
- Food prefixes
- Partial queries
- Compound queries
- Unknown locations

### **3. Validate Everything**
- Geocoded results
- Learned keywords
- Parsed queries
- API responses

### **4. Protect the Budget**
- Skip unnecessary calls
- Validate before learning
- Monitor API usage

### **5. Be Ready to Fix**
- Learning can go wrong
- Need manual cleanup capability
- Need validation at every step

---

## ✅ Current Status

**We've built a robust system with:**
- ✅ Smart parsing (food items first)
- ✅ Malaysia-only validation
- ✅ Food prefix protection
- ✅ Learning safeguards
- ✅ Budget protection

**But it's still tricky because:**
- ⚠️ Edge cases keep appearing
- ⚠️ User behavior is unpredictable
- ⚠️ API responses can vary
- ⚠️ Learning needs constant monitoring

---

## 🔮 Future Considerations

### **Potential Improvements:**
1. **Better Food Detection** - More sophisticated food item recognition
2. **Context Awareness** - Use search history to improve parsing
3. **Confidence Scores** - Only learn high-confidence keywords
4. **User Feedback** - Let users correct wrong learning
5. **Regional Variations** - Handle different spellings/names

### **Monitoring Needed:**
- Track geocoding success rate
- Monitor learned keywords quality
- Check API usage patterns
- Review edge case frequency

---

**Conclusion:** Keyword search is tricky, but with proper safeguards and validation, it can work reliably! 🎯

