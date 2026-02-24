# Garage Quote Approval System

A mobile-first web application for garages to send price quotes for customer approval via WhatsApp with digital signatures.

## Features

✅ **Garage Worker Dashboard** - Create and submit quotes with photos  
✅ **Camera Integration** - Capture quote photos on iOS Safari and Android Chrome  
✅ **WhatsApp Integration** - Send approval links via WhatsApp with pre-filled messages  
✅ **Digital Signatures** - Touch-friendly signature pad for customer approval  
✅ **PDF Export** - Generate professional PDF documents with quotes and signatures  
✅ **Firebase Backend** - Secure cloud storage for quotes, images, and signatures  
✅ **Mobile-First Design** - Fully responsive with Tailwind CSS  

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS (mobile-first)
- **Database**: Firebase Firestore
- **Storage**: Firebase Cloud Storage
- **PDF Generation**: jsPDF + html2canvas
- **Signature**: react-signature-canvas
- **Icons**: lucide-react
- **Deployment**: Vercel

## Quick Start

### Installation

```bash
npm install
```

### Firebase Configuration

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Firestore Database and Cloud Storage
3. Copy your config to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── page.tsx                 # Dashboard (create quotes)
├── approve/[id]/page.tsx    # Customer approval & sign
├── summary/[id]/page.tsx    # Quote summary & PDF
└── layout.tsx

components/
├── CameraInput.tsx          # Camera capture
└── SignaturePad.tsx         # Digital signature

lib/
├── firebase.ts              # Firebase setup
├── firestore.ts             # Database operations
├── types.ts                 # TypeScript interfaces
└── pdf.ts                   # PDF generation
```

## Usage

**For Garage Workers:**
1. Fill in customer details and capture quote photo
2. Submit to generate approval link
3. Share link via WhatsApp
4. Download PDF when approved

**For Customers:**
1. Receive WhatsApp link
2. View quote and sign digitally
3. Submit signature to approve

## Database Schema

```typescript
quotes {
  id: string
  customerName: string
  carPlate: string
  phoneNumber: string
  quoteImageUrl: string
  notes: string
  status: "pending" | "approved"
  signatureImageUrl: string | null
  createdAt: Timestamp
  approvedAt: Timestamp | null
}
```

## Firebase Rules

**Firestore:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /quotes/{document=**} {
      allow read, write;
    }
  }
}
```

**Storage:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write;
    }
  }
}
```

## Deployment

Deploy to Vercel with one click:

```bash
vercel
```

Add Firebase environment variables in Vercel project settings.

## Browser Support

- iOS Safari 14+
- Android Chrome 90+
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## Mobile Features

- ✅ Camera API for iOS & Android
- ✅ Pinch-to-zoom on images
- ✅ Touch-optimized signature pad
- ✅ Responsive design for all screens

## License

MIT
