import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, DollarSign, Users, Eye, Search, Filter } from 'lucide-react';

// NOTE: Removed 'faker' import as data will come from the backend.
// We assume you have created this utility file in src/utils/apiClient.js
import { apiClient } from '../utils/apiClient';
// NOTE: Assuming AuthContext is available via useAuth if needed for tokens

const CustomerDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('ending_soon');
    
    // New states for real data and loading status
    const [liveAuctions, setLiveAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const categories = ['all', 'electronics', 'furniture', 'clothing', 'collectibles', 'art', 'books'];
    
    // --- Data Fetching Logic ---
    const fetchAuctions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Construct query parameters for search, filter, and sort
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (selectedCategory !== 'all') params.append('category', selectedCategory);
            if (sortBy) params.append('sortBy', sortBy);

            // Hitting the EC2 Backend API endpoint for live auctions
            const endpoint = `auctions/live?${params.toString()}`;
            const response = await apiClient(endpoint);

            setLiveAuctions(response.auctions || []); // Assuming backend returns { auctions: [...] }
        } catch (err) {
            console.error('Error fetching live auctions:', err);
            setError('Failed to load live auctions from the API.');
            setLiveAuctions([]); // Clear list on error
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedCategory, sortBy]); // Reruns when filters change

    useEffect(() => {
        // Fetch auctions when the component loads or filters/sort change
        fetchAuctions();
        
        // Optionally, setup a small interval for real-time bid updates
        // In a real system, you'd use WebSockets, but a short poll works for a demo
        const interval = setInterval(fetchAuctions, 15000); 
        return () => clearInterval(interval);
    }, [fetchAuctions]);

    // --- Action Handler: Place Bid ---
    const handleBid = async (auctionId, currentBid) => {
        const bidInput = prompt(`Enter your bid (current: $${currentBid}):`);
        const newBidAmount = parseFloat(bidInput);
        
        if (!bidInput || isNaN(newBidAmount)) return;

        if (newBidAmount <= currentBid) {
            alert('Bid must be strictly higher than the current bid!');
            return;
        }

        try {
            // POST request to EC2 Backend for bid placement
            const response = await apiClient('customer/bid', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // Include authorization header (e.g., JWT from AuthContext)
                    // 'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({
                    auctionId: auctionId,
                    userId: 'current-user-id', // Use real ID from AuthContext
                    newBidAmount: newBidAmount,
                }),
            });
            
            if (response) {
                alert(`Bid of $${newBidAmount} placed successfully! You'll receive notifications.`);
                fetchAuctions(); // Refresh the list to show the updated bid
            }

        } catch (err) {
            alert(`Failed to place bid: ${err.message}.`);
        }
    };

    // Use the fetched list for the grid
    const auctionsToDisplay = liveAuctions; 

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <motion.h1 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 mb-8"
            >
                Live Auctions
            </motion.h1>

            {/* Search and Filter Controls */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search auctions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            // Trigger fetch on input change (handled by dependency array)
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 capitalize"
                        >
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category === 'all' ? 'All Categories' : category}
                                </option>
                            ))}
                        </select>
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="ending_soon">Ending Soon</option>
                        <option value="newest">Newest First</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                        <option value="most_bids">Most Bids</option>
                    </select>
                </div>
            </div>

            {/* Loading/Error States */}
            {error && (
                <div className="text-center py-12 text-red-600 border border-red-300 bg-red-50 rounded-lg">
                    <p className="font-bold">Error Loading Auctions:</p>
                    <p>{error}</p>
                </div>
            )}
            
            {loading && !error && (
                <div className="text-center py-12">
                    <p className="text-xl text-gray-500">Loading live auctions...</p>
                </div>
            )}

            {/* Auctions Grid */}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {auctionsToDisplay.map((auction, index) => (
                        <motion.div
                            key={auction.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                        >
                            {/* Auction Image */}
                            <div className="relative">
                                {/* NOTE: auction.image should be the full URL (e.g., from auction-media-ty4b S3) */}
                                <img 
                                    src={auction.image} 
                                    alt={auction.itemName}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
                                    {auction.timeLeft}
                                </div>
                                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm capitalize">
                                    {auction.category}
                                </div>
                            </div>

                            {/* Auction Details */}
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                                    {auction.itemName}
                                </h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                    {auction.description}
                                </p>

                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <Users className="h-4 w-4 mr-1" />
                                            {auction.bidCount} bids
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {auction.timeLeft}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-gray-500">Current Bid</span>
                                        <span className="text-xl font-bold text-green-600">
                                            ${auction.currentBid}
                                        </span>
                                    </div>

                                    <div className="flex space-x-2">
                                        <Link
                                            to={`/auction/${auction.id}`}
                                            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-center hover:bg-gray-200 transition-colors flex items-center justify-center"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                        </Link>
                                        <button
                                            onClick={() => handleBid(auction.id, auction.currentBid)}
                                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                                        >
                                            <DollarSign className="h-4 w-4 mr-2" />
                                            Place Bid
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            

            {auctionsToDisplay.length === 0 && !loading && !error && (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No auctions found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria or check back later for new auctions.</p>
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;