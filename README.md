# Therapist Gallery — Firebase Web App

A secure, private therapist gallery with a luxury black & gold design.

## Pages

| Route | Purpose |
|-------|---------|
| `/admin` | Admin login, manage therapist photos, create gallery links |
| `/gallery?token=…` | Client gallery — token-gated, watermarked, view-limited |

---

## 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → **Create project**.
2. Enable these services:
   - **Authentication → Sign-in method → Email/Password** (enable it)
   - **Firestore Database** → create in **production mode**
   - **Storage** → create bucket
3. Copy your app's config from **Project Settings → Your apps → Web app**.

---

## 2. Environment Variables

```bash
cp .env.example .env
```

Fill in your `.env`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

VITE_ADMIN_EMAIL=admin@admin.com
VITE_ADMIN_PASSWORD=admin123

VITE_ADMIN_WHATSAPP=919999999999   # Your WhatsApp number with country code, no +
```

---

## 3. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173/admin

**First login:** The admin account is created automatically on first sign-in using the
credentials in your `.env`. Make sure Email/Password auth is enabled in Firebase Console.

---

## 4. Firebase Storage — CORS Configuration

For the canvas watermark to work, Firebase Storage needs CORS headers. Run once:

```bash
# Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
gcloud auth login
gsutil cors set cors.json gs://YOUR_PROJECT_ID.appspot.com
```

> Replace `YOUR_PROJECT_ID` with your actual Firebase project ID.

Without this, the watermark canvas falls back to showing the original image URL
(still protected by the overlay watermark and view limits).

---

## 5. Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Update .firebaserc with your project ID
# Edit .firebaserc → replace YOUR_FIREBASE_PROJECT_ID

# Deploy Firestore rules + Storage rules + hosting
npm run deploy
```

Or step by step:

```bash
npm run build
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## 6. Firestore Security Rules

Already configured in `firestore.rules`. Key rules:

- **Therapists**: Anyone can read; only authenticated admin can write.
- **galleryTokens**: Anyone can read (for validation); admin creates/deletes; clients can update `clientName`/`clientPhone`/`used` only.
- **viewCounts**: Public read/write (view tracking).
- **viewLogs**: Public create; admin read.

Deploy rules: `firebase deploy --only firestore:rules`

---

## 7. How the Gallery Link Works

1. Admin creates a link from `/admin → Gallery Links tab`.
2. System generates a unique 40-char token and stores it in Firestore with:
   - `expiresAt` — calculated from the expiry minutes you set
   - `maxViewsPerImage` — max times each photo can be viewed
   - `viewDurationSeconds` — how long the photo stays visible
3. Share the `/gallery?token=…` link with the client.
4. Client enters their name and WhatsApp number (India 10-digit).
5. Client can view each photo up to `maxViewsPerImage` times, each time visible for `viewDurationSeconds` seconds.

---

## 8. Watermark Approach

Images are watermarked with the client's **name, phone number, and timestamp** using:

- **Canvas watermark** — image is drawn to a `<canvas>` element with text burned in diagonally.
- **HTML overlay** — additional text overlay on the rendered card.
- **Page-level overlay** — subtle repeating text across the entire page.

> Note: The watermark is a deterrent, not a 100% technical prevention.
> Determined users can still capture the screen. The watermark ensures
> any leaked image is traceable back to the specific client.

---

## 9. Anti-Screenshot Measures

The gallery implements:
- Right-click disabled
- Drag disabled
- Copy/cut disabled
- Text selection disabled (`user-select: none`)
- Long-press context menu disabled (mobile)
- PrintScreen / Cmd+Shift key detection with warning
- Gallery blurs when the user switches tabs or apps
- Keyboard shortcut interception

---

## 10. Project Structure

```
src/
├── firebase.js                    Firebase init
├── App.jsx                        Router
├── main.jsx
├── styles/global.css              Black & gold theme
├── pages/
│   ├── AdminPage.jsx              Auth state gate
│   └── GalleryPage.jsx           Token validation + steps
└── components/
    ├── admin/
    │   ├── AdminLogin.jsx         Login form
    │   ├── Dashboard.jsx          Tab layout
    │   ├── TherapistManager.jsx   Upload + manage therapists
    │   └── LinkCreator.jsx        Create + list gallery links
    └── gallery/
        ├── ClientInfoForm.jsx     Name + WhatsApp validation
        ├── TherapistGallery.jsx   Fetches available therapists
        └── TherapistCard.jsx      View-limited + watermarked card
```

---

## 11. Admin Credentials

Default (from `.env`): `admin@admin.com` / `admin123`

To change: update `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD` in `.env`,
then create the matching user in Firebase Console → Authentication → Add user.
Delete the old admin user.
