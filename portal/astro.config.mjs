import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Em desenvolvimento, o .env vira process.env (em produção o pm2 roda `node --env-file=…`).
try {
  process.loadEnvFile();
} catch {
  /* sem .env */
}

const site = process.env.PORTAL_URL ?? 'https://portal.dccircuitlabs.com';
const { hostname, protocol } = new URL(site);

export default defineConfig({
  site,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { port: 4400 },
  devToolbar: { enabled: false },
  security: {
    // Bloqueia formulários enviados de outros sites (CSRF). Atrás do Nginx, o app confia no
    // X-Forwarded-Host/Proto só para o domínio do portal.
    checkOrigin: true,
    allowedDomains: [{ hostname, protocol: protocol.replace(':', '') }],
  },
  vite: {
    // O portal usa o mesmo CSS do site (../src/styles/global.css).
    server: { fs: { allow: ['..'] } },
  },
});
