const root = __dirname;
const logsPath = `${root}/logs/pm2`;
const futureProcess = `${root}/scripts/pm2-future-process.js`;

module.exports = {
  apps: [
    {
      name: "cfcb-backend",
      cwd: `${root}/backend`,
      script: "dist/main.js",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "768M",
      merge_logs: true,
      out_file: `${logsPath}/backend-out.log`,
      error_file: `${logsPath}/backend-error.log`,
      time: true,
      env: {
        NODE_ENV: "production",
        BACKEND_PORT: process.env.BACKEND_PORT || "4000"
      }
    },
    {
      name: "cfcb-frontend",
      cwd: `${root}/frontend`,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      merge_logs: true,
      out_file: `${logsPath}/frontend-out.log`,
      error_file: `${logsPath}/frontend-error.log`,
      time: true,
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.example.com/api/v1"
      }
    },
    {
      name: "cfcb-worker-future",
      cwd: root,
      script: futureProcess,
      args: "worker",
      instances: 1,
      exec_mode: "fork",
      autorestart: false,
      merge_logs: true,
      out_file: `${logsPath}/worker-out.log`,
      error_file: `${logsPath}/worker-error.log`,
      time: true,
      env: {
        NODE_ENV: "production",
        CFCB_PROCESS_ROLE: "worker"
      }
    },
    {
      name: "cfcb-scheduler-future",
      cwd: root,
      script: futureProcess,
      args: "scheduler",
      instances: 1,
      exec_mode: "fork",
      autorestart: false,
      merge_logs: true,
      out_file: `${logsPath}/scheduler-out.log`,
      error_file: `${logsPath}/scheduler-error.log`,
      time: true,
      env: {
        NODE_ENV: "production",
        CFCB_PROCESS_ROLE: "scheduler"
      }
    }
  ]
};
