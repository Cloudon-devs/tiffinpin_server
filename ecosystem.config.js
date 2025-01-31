module.exports = {
  apps: [
    {
      name: 'dev-app',
      script: './src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      log_file: '~/.pm2/logs/dev-app-combined.log',
      out_file: '~/.pm2/logs/dev-app-out.log',
      error_file: '~/.pm2/logs/dev-app-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      time: true,
    },
  ],
};
