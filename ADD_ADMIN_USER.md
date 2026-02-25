# Add Admin User to Firestore

Since we deployed strict security rules, you need to add the first admin user manually through Firebase Console.

## 📋 Copy These Values

**Email:** `admin@example.com`
**Name:** `System Admin`
**Password Hash:** `$2b$10$sOUKBP79khVeyHiDv6wguu9HgADSzzK3aJfKdyiS7Pa5M3rXuK9uq`
**Role:** `admin`
**Password:** `admin123456`

---

## 🔧 Steps to Add Admin User

### 1. Open Firebase Console
Go to: https://console.firebase.google.com/project/tahavura/firestore

### 2. Create Users Collection (if it doesn't exist)
- Click **"Start collection"**
- Collection ID: `users`
- Click **"Next"**

### 3. Add Admin User Document
- Click **"Auto-ID"** (this generates a random document ID)
- Add the following fields:

| Field Name | Type | Value |
|------------|------|-------|
| `email` | string | `admin@example.com` |
| `name` | string | `System Admin` |
| `passwordHash` | string | `$2b$10$sOUKBP79khVeyHiDv6wguu9HgADSzzK3aJfKdyiS7Pa5M3rXuK9uq` |
| `role` | string | `admin` |
| `createdAt` | timestamp | *(Click the clock icon and select "Set to current time")* |
| `lastLogin` | null | *(Leave empty - select "null" type)* |

### 4. Save
- Click **"Save"**
- You should see the new user document appear

---

## ✅ Test Login

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open browser: http://localhost:3002/login

3. Login with:
   - **Email:** `admin@example.com`
   - **Password:** `admin123456`

4. **IMPORTANT:** Change this password immediately after first login!

---

## 🎯 Quick Copy-Paste Values

For easy copy-paste when creating the document:

**email:**
```
admin@example.com
```

**name:**
```
System Admin
```

**passwordHash:**
```
$2b$10$sOUKBP79khVeyHiDv6wguu9HgADSzzK3aJfKdyiS7Pa5M3rXuK9uq
```

**role:**
```
admin
```

---

## 🖼️ Visual Guide

1. **Firebase Console → Firestore Database**
   ![Location](Click "Firestore Database" in left sidebar)

2. **Start Collection (if users doesn't exist)**
   ![Button](Look for "Start collection" button)

3. **Add Document**
   ![Form](Fill in the 6 fields as shown above)

4. **Click Save**
   ![Success](You should see the new user in the list)

---

## ⚠️ Troubleshooting

### "Permission denied" error
- ✅ This is normal! The security rules are working
- You must add users through Firebase Console (not through code)

### Can't find "Start collection" button
- The collection might already exist
- Look for "users" collection in the list
- Click on it and then click "Add document"

### Login not working
- Make sure you copied the **exact** password hash (including `$2b$10$...`)
- Check that role is set to `admin` (lowercase)
- Verify createdAt is a timestamp type (not string)

---

## 🚀 Next Steps

After adding the admin user and logging in:

1. ✅ Change the admin password
2. ✅ Create additional users through the app's admin panel
3. ✅ Test creating quotes
4. ✅ Test customer approval flow

---

Need help? Check the Firebase Console:
https://console.firebase.google.com/project/tahavura/firestore
