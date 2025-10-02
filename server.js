// src/server.js (Dedicated Server Startup)
const express = require('express');
const app = express();
const router = require('./api/auctionRoutes'); // Assume auctionRoutes exports the router

// Middleware setup (e.g., body parsers)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach all API routes under the /api path
app.use('/api', router); 

// SERVER STARTUP
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`AuctionHub API running on port ${PORT}`);
});