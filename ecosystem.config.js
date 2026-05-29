// ============================================================
// QXK24 Constitutional Backend — PM2 Ecosystem Config
// Kernel  : v1.7.0 | ERA_1 — The Teaching Era
// Production: api.qxk24.com:5000 (Claude)
// Lab       : api.qxk24.com/lab → :5002 (Qwen; avoid 5001 — often qiubbx-admin-api)
// ============================================================

module.exports = {
  apps: [
    {
      name: 'qxk24-backend',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        QXK24_STACK: 'production',
        LLM_PROVIDER: 'anthropic',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        QXK24_STACK: 'production',
        LLM_PROVIDER: 'anthropic',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
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
      max_memory_restart: '512M',
      env_file: '.env.lab',
      env: {
        NODE_ENV: 'production',
        PORT: 5002,
        QXK24_STACK: 'lab',
        LLM_PROVIDER: 'qwen',
      },
      error_file: './logs/lab-err.log',
      out_file: './logs/lab-out.log',
      log_file: './logs/lab-combined.log',
      time: true,
      restart_delay: 3000,
      max_restarts: 10,
      autorestart: true,
    },
  ],
};
