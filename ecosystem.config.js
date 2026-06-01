// ============================================================
// QXK24 Constitutional Backend — PM2 Ecosystem Config
// Kernel  : v1.7.0 | ERA_1 — The Teaching Era
// Production: api.qxk24.com:5000 (Qwen)
// Lab       : api.qxk24.com/lab → :5002 (Qwen; separate brain DB)
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
      name: 'qxk24-backend-lab',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '768M',
      env_file: '.env.lab',
      env: {
        NODE_ENV: 'production',
        PORT: 5002,
        QXK24_STACK: 'lab',
        LLM_PROVIDER: 'qwen',
      },
      error_file: path.join(logsDir, 'lab-err.log'),
      out_file: path.join(logsDir, 'lab-out.log'),
      log_file: path.join(logsDir, 'lab-combined.log'),
      time: true,
      restart_delay: 3000,
      max_restarts: 10,
      autorestart: true,
    },
  ],
};
