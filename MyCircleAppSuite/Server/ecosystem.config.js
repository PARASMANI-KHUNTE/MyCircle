// PM2 process configuration.
//
// The API server intentionally runs as a single fork-mode instance:
// - Socket.io sessions live in this process (no Redis adapter is configured),
//   so cluster mode would break real-time delivery across instances.
// - In-process cron jobs (post expiry, chat cleanup, archival) must run
//   exactly once; multiple instances would duplicate notifications.
//
// To scale horizontally later: add @socket.io/redis-adapter, set
// ENABLE_CRON=false on all but one server instance, then switch back
// to cluster mode.
module.exports = {
  apps: [
    {
      name: 'mycircle-server',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 8000,
      // Must exceed the 10s graceful-shutdown budget inside server.js,
      // otherwise PM2 SIGKILLs mid-shutdown.
      kill_timeout: 15000,
    },
    {
      name: 'mycircle-worker',
      script: 'src/workers/index.js',
      // One instance is enough: each worker process already runs all four
      // BullMQ workers with their own concurrency settings. Scale by raising
      // `instances` — Redis distributes jobs safely across worker processes.
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '512M',
      autorestart: true,
      // Must exceed the 10s worker shutdown budget inside src/workers/index.js.
      kill_timeout: 12000,
    },
  ],
};
