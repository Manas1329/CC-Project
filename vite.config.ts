import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // 1. Inject API URL via environment variables
  define: {
    // !!! IMPORTANT: Replace '<EC2_PUBLIC_IP_OR_DOMAIN>' with the actual public 
    // endpoint of your EC2 backend API.
    'process.env.VITE_API_URL': JSON.stringify('http://<EC2_PUBLIC_IP_OR_DOMAIN>/api'),
  },

  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});