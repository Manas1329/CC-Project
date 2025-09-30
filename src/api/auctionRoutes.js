// src/api/auctionRoutes.js (CONVERTED TO ESM)

// 1. Convert CJS 'require' to ESM 'import' syntax
import express from 'express';
import multer from 'multer';
import { uploadMediaFile } from '../utils/s3Service.js';
import { sendNotificationEvent } from '../utils/notificationService.js';
import * as rdsModel from '../models/rdsModel.js'; 

// 2. Initialize the Express application and router
const app = express();
const router = express.Router();

// Middleware Setup
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies
const upload = multer({ dest: 'uploads/' }); 

// --- 1. API Route for Media File Upload (Vendor Submission) ---
router.post('/vendor/upload', upload.single('itemImage'), async (req, res) => {
    // The EC2 API expects the file to be under 'itemImage' field name (from frontend FormData)

    // Check for necessary fields (add more checks as needed)
    const { itemName, description, minBid, vendorId } = req.body; 
    
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    
    // Check required form fields (Basic check)
    if (!itemName || !minBid || !vendorId) {
         return res.status(400).json({ message: 'Missing required item details for submission.' });
    }

    try {
        // Upload the file using the S3 Service module
        const imageUrl = await uploadMediaFile(req.file);
        
        // Save auction details (including the S3 URL) to RDS (auctiondb)
        // NOTE: The initial status for a new auction is 'pending'.
        const newAuctionData = {
            itemName, description, minBid, 
            vendorId, 
            imageUrl,
            // You will need to calculate the actual end_time in your final logic
            endTime: new Date(Date.now() + 72 * 3600 * 1000) 
        };

        // Assume rdsModel has a function to create a new auction
        // const auctionId = await rdsModel.createNewAuction(newAuctionData); 
        
        res.status(200).json({ 
            message: 'Item uploaded and submitted for admin review.',
            url: imageUrl,
            // auctionId: auctionId
        });

    } catch (error) {
        console.error('Auction submission error:', error.message);
        res.status(500).json({ message: error.message });
    }
});


// --- 2. API Route for Placing a Bid (Triggers Lambda) ---
router.post('/customer/bid', async (req, res) => {
    // NOTE: userId should ideally be derived from an authenticated JWT token for security.
    const { auctionId, userId, newBidAmount } = req.body; 
    
    try {
        // 1. Validate Bid and Update RDS (auctiondb)
        // This transaction logic ensures the bid is valid, updates the current_bid, 
        // and returns the previous bidder's ID.
        const bidResult = await rdsModel.createBid(auctionId, userId, newBidAmount); 

        // 2. Trigger Lambda Notification if someone was outbid
        if (bidResult.previousUserId && bidResult.previousUserId !== userId) {
            // TODO: Replace 'outbidEmail' logic with a DB lookup using bidResult.previousUserId
            const outbidUserEmail = 'outbid_user_lookup@example.com'; 

            await sendNotificationEvent({
                auctionId: auctionId,
                outbidEmail: outbidUserEmail,
                currentWinningBid: newBidAmount
            });
        }

        res.status(200).json({ 
            message: 'Bid placed successfully and notification triggered if needed.',
            currentBid: newBidAmount
        });

    } catch (error) {
        console.error('Bid placement error:', error.message);
        // Catch specific errors thrown by rdsModel.createBid (e.g., "Bid amount is too low.")
        res.status(400).json({ message: error.message });
    }
});

// 3. Attach the router paths to the main application paths
app.use('/api', router); 
app.use('/api/auth', router); // Assuming your login logic uses an auth route

// --- Mock/Base Route for PM2 Startup (Required to keep the server running) ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`AuctionHub API running on port ${PORT}`);
    console.log(`RDS Host: ${process.env.RDS_HOST}`);
    console.log(`Lambda: ${process.env.LAMBDA_FUNCTION_NAME}`);
});

// We no longer need 'module.exports' since we are using ESM style.
// This file serves as both the router definition and the server entry point.