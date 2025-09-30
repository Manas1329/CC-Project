import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Clock, DollarSign } from 'lucide-react';

// NOTE: Removed 'faker' import.
// Assuming this utility file is available in src/utils/apiClient.js
import { apiClient } from '../utils/apiClient'; 

const HomePage = () => {
    // New state to hold fetched statistics
    const [statsData, setStatsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching Logic ---
    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Hitting the EC2 Backend API endpoint for stats
            const response = await apiClient('stats');
            
            // Assuming the backend returns an array of objects structured for display:
            // e.g., [{ key: 'total_completed', value: 1500 }, ...]
            setStatsData(response.stats || []); 
            
        } catch (err) {
            console.error('Error fetching homepage stats:', err);
            setError('Failed to load platform statistics.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Function to map the fetched data into the component's required format
    const getDisplayStats = () => {
        // Helper to find a value by its key (assuming backend uses simple keys)
        const findStatValue = (key) => {
            const stat = statsData.find(s => s.key === key);
            return stat ? stat.value : null;
        };

        return [
            {
                icon: TrendingUp,
                label: 'Total Auctions Completed',
                value: findStatValue('total_completed')?.toLocaleString() || 'N/A',
                color: 'text-blue-600',
                bg: 'bg-blue-100'
            },
            {
                icon: DollarSign,
                label: 'Total Money Exchanged',
                value: `$${findStatValue('total_revenue')?.toLocaleString() || 'N/A'}`,
                color: 'text-green-600',
                bg: 'bg-green-100'
            },
            {
                icon: Clock,
                label: 'Active Auctions',
                value: findStatValue('active_count')?.toString() || 'N/A',
                color: 'text-yellow-600',
                bg: 'bg-yellow-100'
            },
            {
                icon: Users,
                label: 'Current Bids',
                value: findStatValue('current_bids')?.toLocaleString() || 'N/A',
                color: 'text-purple-600',
                bg: 'bg-purple-100'
            }
        ];
    };

    const stats = getDisplayStats();

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-6xl font-bold mb-6"
                    >
                        Welcome to AuctionHub
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
                    >
                        The premier online auction platform where buyers and sellers meet to discover unique items and great deals.
                    </motion.p>
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="space-x-4"
                    >
                        <Link 
                            to="/login" 
                            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
                        >
                            Get Started
                        </Link>
                        <Link 
                            to="/customer" 
                            className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block"
                        >
                            Browse Auctions
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <motion.h2 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl font-bold text-center mb-12 text-gray-900"
                    >
                        Platform Statistics
                    </motion.h2>
                    {error && (
                        <div className="text-center text-red-600 mb-4">{error}</div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loading ? (
                            // Loading state placeholder
                            <div className="md:col-span-4 text-center text-gray-500">Loading statistics...</div>
                        ) : (
                            stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow"
                                >
                                    <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                                    <p className="text-gray-600">{stat.label}</p>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <motion.h2 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl font-bold text-center mb-12 text-gray-900"
                    >
                        How It Works
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-center"
                        >
                            <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                                1
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Vendors Submit Items</h3>
                            <p className="text-gray-600">Vendors upload item details, images, and set minimum bids for auction approval.</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-center"
                        >
                            <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                                2
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Admin Approval</h3>
                            <p className="text-gray-600">Admins review and approve auctions, managing the entire auction lifecycle.</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="text-center"
                        >
                            <div className="bg-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                                3
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Customers Bid</h3>
                            <p className="text-gray-600">Customers place bids on approved items with real-time notifications and leaderboards.</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-blue-600 text-white">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <motion.h2 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl font-bold mb-6"
                    >
                        Ready to Start Auctioning?
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-xl mb-8 max-w-2xl mx-auto"
                    >
                        Join thousands of users buying and selling unique items through our secure auction platform.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <Link 
                            to="/login" 
                            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
                        >
                            Join AuctionHub Today
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;