import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Allow the existing Vercel variable names to be exposed to the browser.
  envPrefix: ['VITE_', 'SUPABASE_', 'Pub_'],
});
