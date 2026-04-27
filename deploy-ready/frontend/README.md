# Intervuo — Frontend

AI-powered mock interview platform frontend built with **Next.js 14**, **Tailwind CSS**, and **React 18**.

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS 3.4
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Proctoring:** face-api.js (face detection)
- **Fonts:** Outfit + Bebas Neue (Google Fonts)

## 📁 Project Structure

```
app/
├── layout.jsx                    # Root layout + metadata + fonts
├── page.jsx                      # Landing page (/)
├── globals.css                   # Global styles + design tokens
├── auth/
│   ├── login/page.jsx            # Login page
│   ├── register/page.jsx         # Registration + OTP verification
│   └── verify/page.jsx           # Email verification
├── dashboard/
│   └── page.jsx                  # User dashboard + interview history
├── interview/
│   ├── page.jsx                  # Role selection
│   ├── device-check/page.jsx     # Camera & microphone permission check
│   ├── [sessionId]/page.jsx      # Live interview session
│   └── results/
│       └── [sessionId]/page.jsx  # Interview results & feedback
├── privacy/
│   └── page.jsx                  # Privacy policy
└── system-check/
    └── page.jsx                  # System requirements check
lib/
├── auth.js                       # JWT auth helpers (getToken, requireAuth, clearAuth)
└── faceDetection.js              # Face detection with face-api.js
public/
└── models/                       # face-api.js model weights
```

## 🚀 Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New → Project**
3. Import the GitHub repo
4. Vercel auto-detects Next.js — no custom config needed
5. Set environment variable:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://intervuo-api.onrender.com` |

6. Click **Deploy** → done in ~1 minute

### After Deploying

Go to your **backend's Render dashboard** and update these env vars with your Vercel URL:
- `CORS_ORIGINS` = `https://intervuo.vercel.app`
- `FRONTEND_URL` = `https://intervuo.vercel.app`

Then manually redeploy the Render service.

## 💻 Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Make sure the backend is running on `http://localhost:8000` for local development.

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#06070a` | Page background |
| `surface` | `#0e1017` | Card backgrounds |
| `s2` | `#161922` | Hover states |
| `accent` | `#c8f04d` | Primary accent (lime green) |
| `text` | `#f2f2f0` | Primary text |
| `muted` | `#5a6175` | Secondary text |
| `muted2` | `#8892a4` | Tertiary text |
| `red` | `#ff4d6d` | Error states |
| `green` | `#3dffc0` | Success states |

## 📄 License

Private project — All rights reserved.
