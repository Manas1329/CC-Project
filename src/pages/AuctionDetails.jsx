import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, User, MapPin, Phone, DollarSign, Users, Award, ArrowLeft } from 'lucide-react';

// NOTE: Removed 'faker' import.
// Assuming this utility file is available in src/utils/apiClient.js
import { apiClient } from '../utils/apiClient'; 
// NOTE: Assuming you can get the authenticated user's ID/token from your AuthContext

const AuctionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bidAmount, setBidAmount] = useState('');
    
    // Initialize state to null to represent loading/no data
    const [auction, setAuction] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [bidHistory, setBidHistory] = useState([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching Logic ---
    const fetchAuctionDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // GET request to EC2 Backend to fetch all auction data
            const data = await apiClient(`auctions/${id}`);
            
            setAuction(data.auction);
            setLeaderboard(data.leaderboard || []);
            setBidHistory(data.bidHistory || []);
            
        } catch (err) {
            console.error('Error fetching auction details:', err);
            setError('Failed to load auction details. It may not exist.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchAuctionDetails();
        // Set up interval to refresh data (e.g., every 10 seconds)
        const interval = setInterval(fetchAuctionDetails, 10000);
        return () => clearInterval(interval);
    }, [fetchAuctionDetails]);

    // --- Action Handler ---
    const handleBid = async (e) => {
        e.preventDefault();
        const amount = parseFloat(bidAmount);
        
        if (amount <= auction.currentBid) {
            alert(`Bid must be higher than current bid of $${auction.currentBid}`);
            return;
        }

        try {
            // NOTE: You must integrate authentication (e.g., a user token) here 
            // if your backend requires it to identify the bidder.
            // const token = getUserToken(); 

            // POST request to EC2 Backend for bid placement
            const response = await apiClient('customer/bid', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    auctionId: id,
                    userId: 'current-user-id', // Replace with real user ID from context
                    newBidAmount: amount,
                }),
            });

            if (response) {
                alert(`Bid of $${amount} placed successfully!`);
                setBidAmount('');
                // Refresh data to show the new bid and updated leaderboard
                fetchAuctionDetails(); 
            }

        } catch (error) {
            alert(`Failed to place bid: ${error.message}. Please try again.`);
        }
    };

    const getPositionIcon = (position) => {
        switch (position) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return position;
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 text-center">
                <p className="text-xl text-gray-600">Loading auction details...</p>
            </div>
        );
    }
    
    if (error || !auction) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 text-center">
                <h1 className="text-3xl font-bold text-red-600">Error</h1>
                <p className="text-xl text-gray-600">{error || 'Auction not found.'}</p>
                <motion.button
                    onClick={() => navigate(-1)}
                    className="mt-6 flex items-center space-x-2 text-blue-600 hover:text-blue-700 mx-auto"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back to Auctions</span>
                </motion.button>
            </div>
        );
    }

    // After loading, 'auction' is guaranteed to be available
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Back Button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6"
            >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Auctions</span>
            </motion.button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Images and Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image Gallery */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow-lg overflow-hidden"
                    >
                        <div className="relative">
                            <img 
                                src={auction.images[selectedImage]} 
                                alt={auction.itemName}
                                className="w-full h-96 object-cover"
                            />
                            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-md font-medium">
                                {auction.timeLeft}
                            </div>
                        </div>
                        
                        <div className="p-4">
                            <div className="flex space-x-2 overflow-x-auto">
                                {auction.images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                                            selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                                        }`}
                                    >
                                        {/* Assuming images are URLs directly accessible from auction-media-ty4b S3 */}
                                        <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Item Details */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-lg shadow-lg p-6"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{auction.itemName}</h1>
                                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
                                    {auction.category}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">${auction.currentBid}</div>
                                <div className="text-sm text-gray-500">{auction.bidCount} bids</div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                {auction.description}
                            </p>
                        </div>

                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Vendor Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-3">
                                    <User className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <div className="text-sm text-gray-500">Vendor</div>
                                        <div className="font-medium">{auction.vendorName}</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <div className="text-sm text-gray-500">Contact</div>
                                        <div className="font-medium">{auction.vendorContact}</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 md:col-span-2">
                                    <MapPin className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <div className="text-sm text-gray-500">Pickup Address</div>
                                        <div className="font-medium">{auction.pickupAddress}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Bid History */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-lg shadow-lg p-6"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bid History</h2>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {bidHistory.map((bid, index) => (
                                <div key={bid.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                            index === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">{bid.bidder}</div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(bid.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-bold ${index === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                        ${bid.amount}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Sidebar - Bidding and Leaderboard */}
                <div className="space-y-6">
                    {/* Bidding Section */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-lg shadow-lg p-6"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Place Your Bid</h2>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Current Bid:</span>
                                <span className="font-bold text-green-600">${auction.currentBid}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Minimum Bid:</span>
                                <span className="font-medium">${auction.minBid}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Time Remaining:</span>
                                <span className="font-medium text-red-600">{auction.timeLeft}</span>
                            </div>
                        </div>

                        <form onSubmit={handleBid} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Bid Amount ($)
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="number"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        min={auction.currentBid + 0.01} // Use 0.01 for minimal step up
                                        step="0.01"
                                        placeholder={`Minimum $${(auction.currentBid + 0.01).toFixed(2)}`}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                            >
                                Place Bid
                            </button>
                        </form>
                    </motion.div>

                    {/* Leaderboard */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-lg shadow-lg p-6"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <Award className="h-5 w-5 mr-2 text-yellow-500" />
                            Top Bidders
                        </h2>
                        
                        <div className="space-y-3">
                            {leaderboard.map((bidder) => (
                                <div key={bidder.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">{getPositionIcon(bidder.position)}</span>
                                        <div>
                                            <div className="font-medium">{bidder.bidder}</div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(bidder.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-green-600">
                                        ${bidder.amount}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                                **Note:** If the winning bidder fails to complete payment, the next highest bidder will be offered the item.
                            </p>
                        </div>
                    </motion.div>

                    {/* Auction Info */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-lg shadow-lg p-6"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Auction Information</h2>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium capitalize">
                                    {auction.status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Total Bids:</span>
                                <span className="font-medium">{auction.bidCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Auction ID:</span>
                                <span className="font-mono text-sm">{auction.id.slice(0, 8)}...</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AuctionDetails;