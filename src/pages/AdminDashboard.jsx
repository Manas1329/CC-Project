import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Edit, Eye, Users, Package, TrendingUp, DollarSign } from 'lucide-react';

// NOTE: Removed 'faker' import as data will come from the backend.
// We assume you have created this utility file in src/utils/apiClient.js
import { apiClient } from '../utils/apiClient'; 
// NOTE: Assuming AuthContext is available via useAuth if needed for tokens

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('pending');
    // New states for real data
    const [pendingAuctions, setPendingAuctions] = useState([]);
    const [activeAuctions, setActiveAuctions] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching Logic ---
    
    // 1. Fetch dashboard statistics
    const fetchStats = useCallback(async () => {
        try {
            // Hitting the EC2 Backend API endpoint for general stats
            const response = await apiClient('admin/stats');
            setStats(response); 
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError('Failed to load dashboard statistics.');
        }
    }, []);

    // 2. Fetch auction lists (pending or active)
    const fetchAuctions = useCallback(async (status) => {
        setLoading(true);
        setError(null);

        try {
            // Hitting the EC2 Backend API endpoint 
            const endpoint = `admin/auctions?status=${status}`;
            const response = await apiClient(endpoint);

            if (status === 'pending') {
                setPendingAuctions(response.auctions);
            } else {
                setActiveAuctions(response.auctions);
            }
        } catch (err) {
            console.error(`Error fetching ${status} auctions:`, err);
            setError(`Failed to load ${status} auctions from API.`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load data on initial mount
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Load data when the activeTab changes
    useEffect(() => {
        fetchAuctions(activeTab);
    }, [activeTab, fetchAuctions]);


    // --- Action Handlers (Approve/Reject/End) ---
    
    // 1. Approve Auction (PATCH: /admin/auctions/:id/approve)
    const handleApprove = async (auctionId) => {
        if (!confirm('Are you sure you want to approve this auction? This action is irreversible.')) return;
        
        try {
            await apiClient(`admin/auctions/${auctionId}/approve`, {
                method: 'PATCH',
                // Add headers for authentication/JWT here if necessary
            });
            
            alert(`Auction ${auctionId} approved and is now active.`);
            // Refresh pending list and stats
            fetchAuctions('pending'); 
            fetchAuctions('active');
            fetchStats(); 

        } catch (err) {
            alert(`Failed to approve auction: ${err.message}`);
        }
    };

    // 2. Reject Auction (PATCH: /admin/auctions/:id/reject)
    const handleReject = async (auctionId) => {
        const reason = prompt('Please enter the reason for rejection:');
        if (!reason) return; // Cancelled or empty reason

        try {
            await apiClient(`admin/auctions/${auctionId}/reject`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });
            
            alert(`Auction ${auctionId} rejected.`);
            // Refresh pending list
            fetchAuctions('pending');
            fetchStats();
        } catch (err) {
            alert(`Failed to reject auction: ${err.message}`);
        }
    };

    // 3. End Active Auction (PATCH: /admin/auctions/:id/end)
    const handleEndAuction = async (auctionId) => {
        if (!confirm('Are you sure you want to manually end this auction?')) return;
        
        try {
            await apiClient(`admin/auctions/${auctionId}/end`, {
                method: 'PATCH',
            });
            
            alert(`Auction ${auctionId} ended successfully.`);
            // Refresh active list
            fetchAuctions('active');
            fetchStats();
        } catch (err) {
            alert(`Failed to end auction: ${err.message}`);
        }
    };

    // Replace mock data with the fetched data arrays
    const pendingData = pendingAuctions;
    const activeData = activeAuctions;

    // Map fetched stats to display format (assuming backend returns an array of objects)
    const displayStats = [
        {
            icon: Package,
            label: 'Pending Approvals',
            value: stats.find(s => s.label === 'pending_count')?.value || 0,
            color: 'text-yellow-600',
            bg: 'bg-yellow-100'
        },
        {
            icon: TrendingUp,
            label: 'Active Auctions',
            value: stats.find(s => s.label === 'active_count')?.value || 0,
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
        {
            icon: Users,
            label: 'Total Users',
            value: stats.find(s => s.label === 'total_users')?.value?.toLocaleString() || 'N/A',
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            icon: DollarSign,
            label: 'Platform Revenue',
            value: `$${stats.find(s => s.label === 'total_revenue')?.value?.toLocaleString() || '0'}`,
            color: 'text-purple-600',
            bg: 'bg-purple-100'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <motion.h1 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 mb-8"
            >
                Admin Dashboard
            </motion.h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    <p className="font-bold">Error:</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {displayStats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-lg shadow p-6"
                    >
                        <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                        <p className="text-gray-600">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`py-4 px-6 border-b-2 font-medium text-sm ${
                                activeTab === 'pending'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Pending Approvals ({pendingData.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`py-4 px-6 border-b-2 font-medium text-sm ${
                                activeTab === 'active'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Active Auctions ({activeData.length})
                        </button>
                    </nav>
                </div>

                {/* Pending Auctions Tab */}
                {activeTab === 'pending' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-6"
                    >
                        <h2 className="text-xl font-semibold mb-4">Pending Auction Approvals</h2>
                        {loading ? (
                            <p className="text-center py-8 text-gray-500">Loading pending auctions...</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Item Details
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vendor
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Auction Info
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Submitted
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pendingData.map((auction) => (
                                            <tr key={auction.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{auction.itemName}</div>
                                                        <div className="text-sm text-gray-500 capitalize">{auction.category}</div>
                                                        <div className="text-sm text-gray-500">{auction.images} images</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{auction.vendorName}</div>
                                                        <div className="text-sm text-gray-500">{auction.vendorEmail}</div>
                                                        <div className="text-sm text-gray-500">{auction.vendorContact}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm text-gray-900">Min Bid: ${auction.minBid}</div>
                                                        <div className="text-sm text-gray-500">Duration: {auction.duration}h</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(auction.submittedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => alert(`Viewing details for ${auction.itemName}`)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprove(auction.id)}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            <CheckCircle className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(auction.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <XCircle className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Active Auctions Tab */}
                {activeTab === 'active' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-6"
                    >
                        <h2 className="text-xl font-semibold mb-4">Active Auctions Management</h2>
                        {loading ? (
                            <p className="text-center py-8 text-gray-500">Loading active auctions...</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Item
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vendor
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Current Bid
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Bids
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                End Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {activeData.map((auction) => (
                                            <tr key={auction.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{auction.itemName}</div>
                                                    <div className="text-sm text-gray-500">ID: {auction.id.slice(0, 8)}...</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {auction.vendorName}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    ${auction.currentBid}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {auction.bidCount}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(auction.endTime).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                          auction.status === 'ending_soon' 
                                                            ? 'bg-red-100 text-red-800' 
                                                            : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {auction.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => alert(`Viewing auction ${auction.id}`)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => alert(`Editing auction ${auction.id}`)}
                                                            className="text-yellow-600 hover:text-yellow-900"
                                                        >
                                                            <Edit className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEndAuction(auction.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <XCircle className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;