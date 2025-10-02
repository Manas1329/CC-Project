// src/models/rdsModel.js (CONVERTED TO ESM)

const mysql = require('mysql2/promise');

// 1. Database Connection Configuration (using Environment Variables)
const pool = mysql.createPool({
    host: process.env.RDS_HOST,       
    user: process.env.RDS_USER,        
    password: process.env.RDS_PASS,    
    database: process.env.RDS_DB,      
    port: process.env.RDS_PORT || 3306, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

console.log(`RDS Model initialized: Connecting to MySQL host ${process.env.RDS_HOST}`);


// --- 2. Core Auction Data Retrieval Functions ---

/**
 * Fetches all auctions matching a specific status (e.g., 'pending', 'active').
 * @param {string} status - The status of auctions to fetch.
 * @returns {Promise<Array>} List of auction objects.
 */
async function getAuctionsByStatus(status) {
    const query = `
        SELECT 
            id, item_name, vendor_name, vendor_email, category, min_bid, current_bid, 
            bid_count, end_time, status, images
        FROM auctions
        WHERE status = ?
    `;
    
    try {
        const [rows] = await pool.execute(query, [status]);
        return rows;
    } catch (err) {
        console.error("Error fetching auctions by status:", err);
        throw new Error("Database query failed to retrieve auction list.");
    }
}

/**
 * Fetches detailed information for a single auction.
 * @param {string} id - The ID of the auction.
 * @returns {Promise<object>} Auction details.
 */
async function getAuctionDetails(id) {
    const query = `
        SELECT * FROM auctions WHERE id = ?
    `;
    try {
        const [rows] = await pool.execute(query, [id]);
        return rows[0]; // Return the first matching row
    } catch (err) {
        console.error("Error fetching auction details:", err);
        throw new Error("Database query failed to retrieve auction details.");
    }
}


// --- 3. Update/Action Functions ---

/**
 * Updates the status of an auction (used by AdminDashboard for Approve/Reject/End).
 * @param {string} id - Auction ID.
 * @param {string} newStatus - The new status ('active', 'rejected', 'completed').
 * @returns {Promise<boolean>} True if update was successful.
 */
async function updateAuctionStatus(id, newStatus) {
    const query = `
        UPDATE auctions
        SET status = ?, updated_at = NOW()
        WHERE id = ?
    `;
    try {
        const [result] = await pool.execute(query, [newStatus, id]);
        // MySQL uses affectedRows to indicate success
        return result.affectedRows > 0;
    } catch (err) {
        console.error("Error updating auction status:", err);
        throw new Error("Database transaction failed to update auction status.");
    }
}

/**
 * Handles the creation of a new bid.
 * @param {string} auctionId - The auction being bid on.
 * @param {string} userId - The bidder's ID.
 * @param {number} amount - The new bid amount.
 * @returns {Promise<object>} Result including the previous high bidder's ID.
 */
async function createBid(auctionId, userId, amount) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get current auction details and current high bidder (using FOR UPDATE to lock row)
        const auctionQuery = 'SELECT current_bid, user_id FROM auctions WHERE id = ? FOR UPDATE';
        const [auctionResult] = await connection.execute(auctionQuery, [auctionId]);
        const auction = auctionResult[0];
        
        if (!auction) throw new Error("Auction not found.");
        // Ensure the bid is greater than the current bid
        if (amount <= auction.current_bid) throw new Error("Bid amount is too low.");

        const previousUserId = auction.user_id;

        // 2. Insert new bid record
        await connection.execute(
            'INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)',
            [auctionId, userId, amount]
        );

        // 3. Update the auction's current_bid and current_bidder_id
        await connection.execute(
            'UPDATE auctions SET current_bid = ?, user_id = ?, bid_count = bid_count + 1, updated_at = NOW() WHERE id = ?',
            [amount, userId, auctionId]
        );

        await connection.commit();

        // Return data needed for the notification service (Lambda trigger)
        return { success: true, previousUserId: previousUserId };

    } catch (e) {
        await connection.rollback();
        console.error("Bid transaction failed:", e.message);
        // Throw a specific error that your API route can catch and send back as a 400 response
        throw new Error(`Bid failed: ${e.message}`);
    } finally {
        connection.release();
    }
}

// Export the necessary functions using ESM syntax
// All functions are exported above via 'export async function'
