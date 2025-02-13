module.exports = {
    apps : [{
      name   : "btc-webhook-server", // More descriptive name
      script : "./app.js",        // Directly point to app.js
      watch: ["."],          // Watch the current directory
      ignore_watch: ["node_modules"],
      env: {
        "NODE_ENV": "development",
      },
      env_production: {
        "NODE_ENV": "production",
      }
    }]
  }