# TAMP Technical Campus

React/Vite conversion of the supplied TAMP campus application.

## Stack
- React + Vite
- React Router
- Responsive/mobile-first CSS
- LocalStorage prototype state for accounts, enrollment and progress

## Run
```bash
npm install
npm run dev
```

Production build:
```bash
npm run build
```

The original multi-page HTML shell has been replaced with a React SPA. Course curriculum data is kept under `src/data/`. Authentication/progress are still prototype client-side behavior; production credentials, payments, enrollment, assessments and certificates should move to a backend.
