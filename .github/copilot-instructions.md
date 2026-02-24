# Garage Quote Approval System - Development Guide

## Project Overview

A mobile-first Next.js web application for garages to create, send, and approve quotes via WhatsApp with digital signatures and PDF generation.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (mobile-first)
- **Database**: Firebase Firestore
- **Storage**: Firebase Cloud Storage
- **Components**: react-signature-canvas, lucide-react
- **PDF**: jsPDF, html2canvas
- **Deployment**: Vercel

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project account

### Installation

1. **Environment Configuration**
   - Update `.env.local` with Firebase credentials
   - Required keys: API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID

2. **Firebase Setup**
   - Enable Firestore Database
   - Enable Cloud Storage
   - Apply security rules (see README.md)
   - Set up collection: `quotes`

3. **Development Server**
   ```bash
   npm install
   npm run dev
   ```
   Access at http://localhost:3000

## Project Structure

```
tahavura/
├── app/
│   ├── page.tsx                    # Main dashboard
│   ├── approve/[id]/page.tsx       # Customer approval page
│   ├── summary/[id]/page.tsx       # Quote summary & PDF
│   └── layout.tsx                  # Root layout
├── components/
│   ├── CameraInput.tsx             # Camera capture component
│   └── SignaturePad.tsx            # Digital signature component
├── lib/
│   ├── firebase.ts                 # Firebase initialization
│   ├── firestore.ts                # Database operations
│   ├── types.ts                    # TypeScript types
│   └── pdf.ts                      # PDF generation
├── public/                         # Static assets
└── package.json
```

## Key Features

### 1. Dashboard (Worker Interface)
- **File**: [app/page.tsx](app/page.tsx)
- Create quotes with customer details
- Camera integration for quote photos (iOS/Android)
- Generate unique approval links
- Redirect to summary after submission

### 2. Approval Page (Customer Interface)
- **File**: [app/approve/[id]/page.tsx](app/approve/[id]/page.tsx)
- Display quote image with pinch-to-zoom
- Sign using touch-friendly signature pad
- Update status to "approved" in Firestore
- Display signed quote confirmation

### 3. Summary Page (View & Share)
- **File**: [app/summary/[id]/page.tsx](app/summary/[id]/page.tsx)
- View full quote details
- Share link via WhatsApp button
- Generate and download PDF
- View signature if approved

### 4. Components

#### CameraInput
- **File**: [components/CameraInput.tsx](components/CameraInput.tsx)
- Device camera API integration
- Controls: Capture, Discard, Confirm
- Fallback file upload option
- Devices: iOS Safari, Android Chrome

#### SignaturePad
- **File**: [components/SignaturePad.tsx](components/SignaturePad.tsx)
- react-signature-canvas library
- Touch gesture support
- Clear and Save buttons
- Async save handling

### 5. Utilities

#### Firebase Configuration
- **File**: [lib/firebase.ts](lib/firebase.ts)
- Initialize Firebase app
- Export db, storage, auth instances

#### Firestore Operations
- **File**: [lib/firestore.ts](lib/firestore.ts)
- `createQuote()` - Add new quote document
- `getQuote()` - Fetch quote by ID
- `updateQuoteWithSignature()` - Update status and signature
- `uploadImage()` - Store files in Cloud Storage

#### PDF Generation
- **File**: [lib/pdf.ts](lib/pdf.ts)
- `generateQuotePDF()` - Create professional A4 PDF
- Includes: Quote details, images, signature, timestamps
- Client-side generation

#### Types
- **File**: [lib/types.ts](lib/types.ts)
- `Quote` interface for Firestore documents
- `QuoteFormData` for form submissions

## Database Schema

### Firestore Collection: `quotes`

```typescript
{
  id: string;              // Document ID (auto-generated)
  customerName: string;    // Customer name
  carPlate: string;        // License plate
  phoneNumber: string;     // WhatsApp number
  quoteImageUrl: string;   // Image URL in Storage
  notes: string;           // Additional notes
  status: "pending" | "approved";
  signatureImageUrl: string | null;
  createdAt: Timestamp;
  approvedAt: Timestamp | null;
}
```

## Development Workflow

### Adding Features

1. **New Page**: Create in `app/` directory
   - Use naming convention: `[dynamic-param]` for routes
   - Export default component
   - Use `'use client'` for interactivity

2. **New Component**: Create in `components/` directory
   - TypeScript interfaces for props
   - Client-side components: add `'use client'`
   - Export named React components

3. **New Utilities**: Create in `lib/` directory
   - Organize by feature or functionality
   - Export named functions
   - Add TypeScript types

### Testing

- **Local Testing**: `npm run dev` on iOS device or Android
- **Mobile Testing**: Use ngrok or ngrok for tunneling
- **Camera**: Test on actual device (simulator limitations)
- **Signature**: Test touch interactions on mobile

### Building

```bash
npm run build      # Check for errors
npm run lint       # Run ESLint
npm run dev        # Start development server
```

## Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Deployment to Vercel

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel settings
4. Deploy!

```bash
vercel deploy
```

## Performance Optimization

- **Image Compression**: jsPDF handles compression
- **Code Splitting**: Next.js automatic route splitting
- **Lazy Loading**: Dynamic imports for components
- **Mobile**: Tailwind's responsive classes

## Security Considerations

- Firebase rules must be configured
- No authentication currently (add as needed)
- Images stored securely in Cloud Storage
- All operations on client-side (no server API)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera not working | Check permissions, use HTTPS in production |
| Firebase errors | Verify .env.local has correct credentials |
| Build errors | Run `npm install` and check TypeScript types |
| Signature not saving | Verify Cloud Storage rules allow write access |
| PDF blank | Check images are accessible and CORS enabled |

## Future Enhancements

- [ ] Worker authentication
- [ ] Quote templates  
- [ ] Multi-language support
- [ ] Admin dashboard
- [ ] Quote history
- [ ] Email notifications
- [ ] Dark mode
- [ ] Offline mode

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

## Contact & Support

For issues, refer to the README.md or create an issue in the repository.
