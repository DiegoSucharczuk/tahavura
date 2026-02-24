# Tahavura Quote System - Setup Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project account
- Vercel account (for deployment)

## Installation

### 1. Clone and Install

```bash
git clone https://github.com/DiegoSucharczuk/tahavura.git
cd tahavura
npm install
```

### 2. Firebase Configuration

Create `.env.local` with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Create Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Click **Create Database**
5. Choose **Start in test mode** (we'll add rules next)
6. Select your region (e.g., us-central1)

### 4. Apply Security Rules

1. Go to **Firestore Database** → **Rules**
2. Replace all content with the content from `firestore.rules`
3. Click **Publish**

**Rules protect:**
- ✅ Users collection - Only authenticated users can access their own data
- ✅ Quotes collection - Only authenticated workers can read/write
- ✅ Signatures collection - Only authenticated users can access
- ❌ All other collections - Denied by default

### 5. Create Initial Admin User

**Option A: Manual Creation (Easy)**

1. Go to **Firestore Database** → **Collections**
2. Click **Start Collection**
3. Collection ID: `users`
4. Document ID: (auto-generate)
5. Add these fields:

| Field | Type | Value |
|-------|------|-------|
| `email` | string | `admin@example.com` |
| `name` | string | `Admin` |
| `passwordHash` | string | See option B below |
| `role` | string | `admin` |
| `createdAt` | timestamp | (current time) |
| `lastLogin` | null | null |

**Option B: Using Browser Console**

1. Go to http://localhost:3000/login
2. Open browser console (F12)
3. Run this code to generate password hash:

```javascript
const hashPassword = async (password) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const encoder = new TextEncoder();
  const data = encoder.encode(password + saltHex);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}$${hashHex}`;
};

// Generate hash for password "admin123"
hashPassword('admin123').then(hash => {
  console.log('Password hash:');
  console.log(hash);
  console.log('Copy this and paste into Firestore');
});
```

4. Copy the hash and paste into Firestore for `passwordHash` field

### 6. Test Locally

```bash
npm run dev
```

Visit http://localhost:3000

**Test Flow:**
1. Root URL redirects to `/login`
2. Login with `admin@example.com` / `admin123`
3. Creates session cookie `__session`
4. Redirected to `/internal-dashboard`
5. Can create quotes, manage users, etc.

## Architecture

### Routes

- **Public/Unauthenticated:**
  - `/login` - Worker login page
  - `/v/[quoteID]` - Customer approval page (requires 4-digit verification)

- **Worker (Authenticated):**
  - `/internal-dashboard` - Main dashboard (create quotes)
  - `/internal-dashboard/quotes` - View all quotes
  - `/internal-dashboard/users` - Manage workers

- **Redirect:**
  - `/` - Redirects based on auth status
  - `/approve/[id]` - Deprecated (redirected to `/v/[id]`)

### Security

**Authentication:**
- Email/password stored in Firestore (not Firebase Auth)
- Passwords hashed using SHA-256 + random salt
- Session stored as HTTP cookie (`__session`)
- Middleware protects `/internal-dashboard/*` routes

**Authorization:**
- Workers can only create quotes, view all quotes, manage users
- Customers verify identity with 4 digits from license plate
- Firestore rules enforce access control

**Data Privacy:**
- Users collection: Own data only (admin can see all)
- Quotes collection: Workers only
- Signatures collection: Workers only
- No public access to sensitive data

## User Management

### Create New Worker

1. Go to `/internal-dashboard/users`
2. Click "משתמש חדש" (New User)
3. Fill form:
   - Name
   - Email
   - Password (min 6 chars)
   - Role (admin/worker)
4. Submit

Workers are created in Firestore with hashed passwords.

### Change Password

1. Go to `/internal-dashboard/users`
2. Click lock icon on user
3. Enter current password (verification)
4. Enter new password twice
5. Submit

## Customer Approval Flow

1. Worker creates quote with customer details
2. System generates link: `https://site.com/v/[quoteID]`
3. Link sent via WhatsApp
4. Customer opens link → Asked for 4 last digits of car plate
5. System verifies against stored `carPlate`
6. Customer sees quote + signature pad
7. Customer enters ID number + signs
8. Quote marked as "approved" in Firestore

## Firestore Collections

### users
```typescript
{
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'worker';
  createdAt: Timestamp;
  lastLogin: Timestamp | null;
}
```

### quotes
```typescript
{
  id: string;
  customerName: string;
  idNumber?: string;
  carPlate: string;
  phoneNumber: string;
  quoteImageUrl: string;
  notes: string;
  status: 'pending' | 'approved';
  signatureImageUrl: string | null;
  createdAt: Timestamp;
  approvedAt: Timestamp | null;
}
```

## Deployment to Vercel

1. Push to GitHub:
```bash
git push origin main
```

2. Connect repo to Vercel:
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repo
   - Add `.env.local` variables
   - Click "Deploy"

3. Vercel auto-deploys on every Git push

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "User not found" on login | Create admin user in Firestore (step 5) |
| Firebase errors | Check `.env.local` has correct credentials |
| Permission denied in Firestore | Apply security rules from `firestore.rules` |
| Quotes not loading | Check worker is authenticated with `__session` cookie |
| Customer can't verify | Ensure 4 digits match last 4 of `carPlate` |

## Future Features

- [ ] Firebase Authentication (email/password)
- [ ] Invoice templates
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Offline mode
- [ ] Audit logging
- [ ] Email notifications
- [ ] SMS integration

## Support

For issues or questions, open an issue on GitHub or contact the team.

---

**Last Updated:** February 24, 2026  
**Status:** Ready for Production (with security rules applied)
