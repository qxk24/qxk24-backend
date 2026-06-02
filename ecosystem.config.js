// ============================================================
// QXK24 Constitutional Backend — PM2 Ecosystem Config
// Kernel  : v1.7.0 | ERA_1 — The Teaching Era
// Production: api.qxk24.com:5000 (Qwen) — single stack after consolidation
// Lab PM2 removed; keep .env.lab + qxk24_lab DB only for import/backup.
// ============================================================

const fs = require('fs');
const path = require('path');

/** VPS runs PM2 from backend/; monorepo logs live in sibling qxk24-backend/logs. */
const logsDir = fs.existsSync(path.join(__dirname, '..', 'qxk24-backend'))
  ? path.resolve(__dirname, '..', 'qxk24-backend', 'logs')
  : path.join(__dirname, 'logs');

module.exports = {
  apps: [
    {
      name: 'qxk24-backend',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '768M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        QXK24_STACK: 'production',
        LLM_PROVIDER: 'qwen',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        QXK24_STACK: 'production',
        LLM_PROVIDER: 'qwen',
      },
      error_file: path.join(logsDir, 'err.log'),
      out_file: path.join(logsDir, 'out.log'),
      log_file: path.join(logsDir, 'combined.log'),
      time: true,
      restart_delay: 3000,
      max_restarts: 10,
      autorestart: true,
    },
    {
      name: 'student-digest-sync',
      script: './dist/jobs/student-digest-sync.job.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: false,
      cron_restart: '*/30 * * * *',
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: path.join(logsDir, 'digest-sync-err.log'),
      out_file: path.join(logsDir, 'digest-sync-out.log'),
      time: true,
    },
  ],
};
