// ============================================================
// QXK24 Constitutional Backend — PM2 Ecosystem Config
// Kernel  : v1.7.0 | ERA_1 — The Teaching Era
// Production: api.alamtologi.com:5000 (Qwen) — single stack after consolidation
// Lab PM2 removed; keep .env.lab + qxk24_lab DB only for import/backup.
// ============================================================

const path = require('path');

/** PM2 cwd: /var/www/alamtologi/alm-backend — logs in ./logs */
const logsDir = path.join(__dirname, 'logs');

module.exports = {
  apps: [
    {
      name: 'alm-backend',
      script: './start.sh',
      interpreter: 'bash',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '2560M',
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
      name: 'student-post-session-sync',
      script: './dist/jobs/student-post-session-sync.job.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: false,
      cron_restart: '*/30 * * * *',
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: path.join(logsDir, 'post-session-sync-err.log'),
      out_file: path.join(logsDir, 'post-session-sync-out.log'),
      time: true,
    },
  ],
};
