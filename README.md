# Nexus Platform — Social Media & Video Downloader

A full-stack social platform with a built-in X/Twitter video downloader, built for **Android (Termux)** and optimized for **Realme 11 5G**.

## Features

- **Social Feed** — Post, follow users, timeline
- **X/Twitter Video Downloader** — Queue downloads with 1-worker thermal safety
- **Mobile Terminal** — Hacker-style system monitor
- **18+ Content Area** — Age-gated section
- **Admin Dashboard** — Platform stats
- **PWA Support** — Install to homescreen

## Tech Stack

| Component | Tech |
|-----------|------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Express.js + TypeScript |
| Database | SQLite (Prisma ORM) |
| Auth | Session cookies + bcryptjs |
| Runtime | Node.js on Termux |

---

## 📱 Termux 1-Click Setup (Realme 11 5G)

### Step 1: Install Termux
Download **Termux** from [F-Droid](https://f-droid.org/en/packages/com.termux/) (NOT from Play Store).

### Step 2: Copy-paste this ONE command into Termux

```bash
pkg install -y git && git clone https://github.com/Sami12901/twiter-video-dwonloder-for-mobile-only-my.git ~/nexus-platform && bash ~/nexus-platform/setup.sh
```

**That's it!** This single command will:
- Install Node.js, Git, Python, and build tools
- Clone the repository
- Install all NPM dependencies
- Create and setup the SQLite database
- Create a launcher script

### Step 3: Start the platform (anytime)

```bash
bash ~/nexus-start.sh
```

Then open **Chrome** and go to: `http://127.0.0.1:5173`

---

## 💻 Desktop Development

```bash
# Install dependencies
npm install && cd backend && npm install && cd ../frontend && npm install && cd ..

# Setup database
cd backend && echo 'DATABASE_URL="file:./dev.db"' > .env && npx prisma generate && cd ..

# Start both servers
npm start
```

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express server entry
│   │   ├── middleware/auth.ts # Session auth middleware
│   │   ├── routes/
│   │   │   ├── auth.ts       # Register/Login/Logout
│   │   │   ├── posts.ts      # Create/Feed posts
│   │   │   ├── users.ts      # Profile/Follow
│   │   │   └── downloader.ts # Download jobs + Terminal
│   │   └── utils/
│   │       └── downloader.ts # 1-worker download engine
│   └── prisma/
│       └── schema.prisma     # SQLite database schema
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main app with routing
│   │   ├── pages/            # All page components
│   │   ├── store/            # Zustand auth store
│   │   └── services/api.ts   # Axios API client
│   └── public/
│       └── manifest.json     # PWA manifest
├── setup.sh                  # Termux 1-click installer
└── package.json              # Root workspace scripts
```

## License

ISC
