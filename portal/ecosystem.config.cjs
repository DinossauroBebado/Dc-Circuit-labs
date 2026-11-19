// pm2: mantém o portal no ar e o reinicia sozinho (inclusive depois de reiniciar o VPS: `pm2 startup` + `pm2 save`).
module.exports = {
  apps: [
    {
      name: 'portal',
      cwd: '/srv/apps/portal/app/portal',
      script: 'dist/server/entry.mjs',
      node_args: '--env-file=/srv/apps/portal/.env',
      env: { HOST: '127.0.0.1', PORT: '3100', NODE_ENV: 'production' },
      instances: 1, // SQLite: um processo só
      max_memory_restart: '400M',
      out_file: '/srv/apps/portal/logs/saida.log',
      error_file: '/srv/apps/portal/logs/erros.log',
      time: true,
    },
  ],
};
