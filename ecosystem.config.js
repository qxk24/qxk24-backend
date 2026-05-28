// ============================================================
// QXK24 Constitutional Backend — PM2 Ecosystem Config
// Kernel  : v1.7.0 | ERA_1 — The Teaching Era
// Domain  : api.qxk24.com
// Port    : 5000
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
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      restart_delay: 3000,
      max_restarts: 10,
      autorestart: true
    }
  ]
};
