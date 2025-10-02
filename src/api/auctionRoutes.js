// src/api/auctionRoutes.js
const express = require('express');
const multer = require('multer');
const { uploadMediaFile } = require('../utils/s3Service');
const { sendNotificationEvent } = require('../utils/notificationService');
const rdsModel = require('../models/rdsModel');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// --- Vendor Upload ---
router.post('/vendor/upload', upload.single('itemImage'), async (req, res) => {
  const { itemName, description, minBid, vendorId } = req.body;

  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  if (!itemName || !minBid || !vendorId) {
    return res.status(400).json({ message: 'Missing required item details.' });
  }

  try {
    const imageUrl = await uploadMediaFile(req.file);
    res.status(200).json({
      message: 'Item uploaded and submitted for admin review.',
      url: imageUrl,
    });
  } catch (error) {
    console.error('Auction submission error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// --- Customer Bid ---
router.post('/customer/bid', async (req, res) => {
  const { auctionId, userId, newBidAmount } = req.body;

  try {
    const bidResult = await rdsModel.createBid(auctionId, userId, newBidAmount);

    if (bidResult.previousUserId && bidResult.previousUserId !== userId) {
      await sendNotificationEvent({
        auctionId,
        outbidEmail: 'outbid_user_lookup@example.com',
        currentWinningBid: newBidAmount,
      });
    }

    res.status(200).json({
      message: 'Bid placed successfully.',
      currentBid: newBidAmount,
    });
  } catch (error) {
    console.error('Bid placement error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
