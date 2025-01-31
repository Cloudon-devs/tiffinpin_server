module.exports = {
  apps: [
    {
      name: 'tiffinpin',
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
      log_file: '~/.pm2/logs/tiffinpin-combined.log',
      out_file: '~/.pm2/logs/tiffinpin-out.log',
      error_file: '~/.pm2/logs/tiffinpin-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      time: true,
    },
  ],
};
