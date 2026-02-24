# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### ✅ Before You Start
Make sure you have:
- Node.js 18+ installed (`node --version`)
- npm installed (`npm --version`)
- Firebase project created
- `.env.local` configured with Firebase credentials

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```
Visit http://localhost:3000 and verify it redirects to `/login`

### Step 3: Create Admin User in Firestore

**Quick Method (60 seconds):**

1. Open http://localhost:3000/login
2. Open browser console: **F12** → **Console** tab
3. Copy this code and paste it:

```javascript
(async () => {
  const password = 'admin123';
  const hashPassword = async (password) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const encoder = new TextEncoder();
    const data = encoder.encode(password + saltHex);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return saltHex + '$' + hashHex;
  };
  const hash = await hashPassword(password);
  console.log('✅ Copy this passwordHash:');
  console.log(hash);
})();
```

4. Copy the long string output
5. Go to [Firebase Console](https://console.firebase.google.com) → Your Project → **Firestore**
6. **Collections** → **users** (create if not exists) → **+ Add Document**
7. Create a new document with these fields:

| Field | Type | Value |
|-------|------|-------|
| `email` | String | `admin@example.com` |
| `name` | String | `Admin` |
| `passwordHash` | String | (paste from step 4) |
| `role` | String | `admin` |
| `createdAt` | Timestamp | (current time) |
| `lastLogin` | (null/empty) | |

8. Click **Save**

### Step 4: Deploy Firestore Rules

1. In Firebase Console → **Firestore** → **Rules** tab
2. Copy all content from `firestore.rules` file in your project
3. Paste into rules editor
4. Click **Publish**

### Step 5: Test Login

1. Go to http://localhost:3000/login
2. Enter:
   - Email: `admin@example.com`
   - Password: `admin123`
3. Should redirect to `/internal-dashboard` ✅

## ✅ What Should Work Now

- [x] Login with admin account
- [x] See dashboard
- [x] Create new quote with photo
- [x] Create new worker user
- [x] Change password
- [x] Delete users
- [x] View quotes list
- [x] Generate approval link

## 📱 Customer Approval Flow

1. Create quote from dashboard
2. Copy link: `https://yourdomain.com/v/[quote-id]`
3. Send to customer via WhatsApp
4. Customer:
   - Opens link
   - Enters last 4 digits of car plate
   - Signs with finger/stylus
   - Clicks submit
5. You see signature on summary page

## 🐛 If Something Doesn't Work

**Issue: "User not found" on login**
→ Check Firestore console that admin@example.com exists in `users` collection

**Issue: Can't create quote/users** 
→ Make sure you're logged in (see dashboard with greeting)

**Issue: Firestore permission error**
→ Check Firestore Rules tab - should show your custom rules, not "Start in Test Mode"

**Issue: Password hashing fails in console**
→ Make sure you're on localhost (SubtleCrypto requires HTTPS in production)

## 📚 Full Documentation

- [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md) - Detailed Firestore setup
- [TESTING.md](./TESTING.md) - Complete testing checklist
- [SETUP.md](./SETUP.md) - Development environment setup
- [README.md](./README.md) - Project overview

## 🚢 Ready to Deploy?

Once all tests pass locally:

1. Push to GitHub
2. Login to [Vercel](https://vercel.com)
3. Connect your repository
4. Add `.env.local` variables in Vercel Settings
5. Deploy!

---

**Time to Production:** ~15 minutes (with Firebase setup included)
