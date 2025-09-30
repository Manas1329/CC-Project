// src/server.js
const express = require('express');
const auctionRoutes = require('./api/auctionRoutes'); // import router

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', auctionRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AuctionHub API running on port ${PORT}`);
  console.log(`RDS Host: ${process.env.RDS_HOST}`);
  console.log(`Lambda Function: ${process.env.LAMBDA_FUNCTION_NAME}`);
});
