# Quick Setup Guide - Security Fixes

## ⚡ 5-Minute Setup

### Step 1: Add JWT Secret to .env.local

**Add this line to your `.env.local` file:**

```bash
JWT_SECRET=y1lA39Hm7KyJCwpOZTKyV/AZhEQt1pnvRzqtnzupFJA=
```

⚠️ **IMPORTANT:** Use a different secret in production! Generate with:
```bash
openssl rand -base64 32
```

### Step 2: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

This will secure your database by blocking direct client access.

### Step 3: Recreate Admin User

**Your existing admin user won't work** (password hash changed from SHA-256 to bcrypt).

Edit `create-admin-user.js` and update the password logic:

```javascript
// OLD (remove this):
const passwordHash = await hashPassword(password);

// NEW (already using bcrypt on server):
// Just store a temporary marker, then use the app to create users
```

Or **better:** Use the app's admin panel to create new users after logging in with a bootstrapped account.

**Bootstrap First Admin (temporary):**

Add this to your Firestore `users` collection manually via Firebase Console:

```json
{
  "email": "admin@example.com",
  "name": "Admin",
  "role": "admin",
  "passwordHash": "$2a$10$placeholder-login-and-change-password",
  "createdAt": "2026-02-25T09:00:00.000Z",
  "lastLogin": null
}
```

Then:
1. Try to log in (will fail with "Invalid password")
2. Use Firebase Console to set a bcrypt hash temporarily
3. Or modify the password API to allow admin bootstrap

**Easiest way:** Create admin user via Firebase Console with a simple password, then change it immediately through the app.

### Step 4: Test Locally

```bash
npm run dev
```

Visit: http://localhost:3002/login

Try logging in with your admin credentials.

### Step 5: Verify Security

Open browser console and try:
```javascript
// This should FAIL with permission denied:
import { collection, getDocs } from 'firebase/firestore';
const users = await getDocs(collection(db, 'users'));
// Expected: FirebaseError: Missing or insufficient permissions
```

---

## 🎯 What Changed

### Before:
- Database: Open to anyone
- Passwords: Weak SHA-256 hashing
- Sessions: Plain user IDs in cookies
- Security: Client-side only

### After:
- Database: Locked down with strict rules
- Passwords: Strong bcrypt hashing
- Sessions: Signed JWT tokens
- Security: Server-side API validation

---

## 🐛 Troubleshooting

### "Unauthorized" errors
- Check that JWT_SECRET is set in .env.local
- Make sure you're logged in
- Try logging out and back in

### "Permission denied" in Firestore
- ✅ This is **expected** - it means security is working!
- All database access must go through API routes now

### Login not working
- Existing users need new passwords (bcrypt hashes)
- Create fresh admin user via Firebase Console
- Or use the user management page to create new users

### Build warnings about Admin SDK
- Warning: "Missing service account credentials"
- This is OK for local development
- For production, add FIREBASE_PRIVATE_KEY to .env.local

---

## 📚 Full Documentation

See `SECURITY_FIXES.md` for complete details on:
- Architecture changes
- File structure
- Testing procedures
- Deployment checklist
- Rollback instructions

---

## ✅ Checklist

- [ ] Add `JWT_SECRET` to `.env.local`
- [ ] Run `firebase deploy --only firestore:rules`
- [ ] Create new admin user in Firebase Console
- [ ] Test login at http://localhost:3002/login
- [ ] Test creating a quote
- [ ] Test user management page
- [ ] Deploy to production with environment variables

---

## 🚀 Deploy to Production

### Vercel:

```bash
vercel
```

**Add environment variables in Vercel dashboard:**

Required:
- `JWT_SECRET` - Your secret key

Optional (for Firebase Admin SDK):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

---

## 🆘 Need Help?

Check the full documentation:
- `SECURITY_FIXES.md` - Detailed security changes
- `STATUS.md` - Overall system status
- `TESTING.md` - Testing procedures

**Backup location:**
`/Users/diego.sucharczuk/Documents/workspace/tahavura-backup-20260225-093649.tar.gz`

To restore: `tar -xzf tahavura-backup-*.tar.gz`
