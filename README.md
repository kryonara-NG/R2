# Reelhouse v8 — React/Vercel

This is the v8 Reelhouse UI packaged as a Vite + React application.

The HTML/CSS/JS pages live under `public/legacy/` and are rendered through a minimal React shell. The TMDB setup form has been removed; configure the API key through the build environment instead.

## Run

```bash
npm install
```

Set the TMDB API key in a local `.env.local` file before starting the app:

```dotenv
VITE_TMDB_API_KEY=your_tmdb_api_key
```

Then run:

```bash
npm run dev
```

For Vercel, add `VITE_TMDB_API_KEY` as a project environment variable and redeploy. The app no longer asks users to enter a key. Vite exposes this value in the client bundle, so use a TMDB key intended for public client-side use and configure its restrictions in TMDB where available.

## Build

```bash
npm run build
```
