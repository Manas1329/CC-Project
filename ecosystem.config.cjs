// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "AuctionHubAPI",
      // --- CRITICAL: Ensure this is the correct entry file ---
      script: "src/server.js", 
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        
        // --- RDS CREDENTIALS (REPLACE PLACEHOLDERS) ---
        RDS_HOST: "auctiondb.cf644cayskez.ap-south-1.rds.amazonaws.com", 
        RDS_USER: "admin",
        RDS_PASS: "sakecM123", 
        RDS_DB: "auctiondb",
        RDS_PORT: "3306", 
        
        // --- AWS SERVICES CONFIG ---
        LAMBDA_FUNCTION_NAME: "AuctionNotification",
        JWT_SECRET: "your_strong_and_long_jwt_secret_change_me" 
      }
    }
  ]
};
