import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, Users, TrendingUp, Package, Plus, Eye, CheckCircle, XCircle } from 'lucide-react';

// NOTE: Removed 'faker' import.
// Assuming this utility file is available in src/utils/apiClient.js
import { apiClient } from '../utils/apiClient';
// NOTE: Assuming you can get the authenticated user's token/ID from your AuthContext

const VendorDashboard = () => {
    // State for the modal (submitting new auction)
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State for fetching data
    const [vendorAuctions, setVendorAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the New Auction Form
    const [formData, setFormData] = useState({
        itemName: '',
        description: '',
        category: '',
        minBid: '',
        auctionDuration: '',
        pickupAddress: '',
        contactInfo: '',
        images: [], // Stores File objects
    });

    // --- Data Fetching Logic ---
    const fetchVendorAuctions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // NOTE: You must send the user's ID/Token to the backend so it knows 
            // which vendor's items to fetch.
            // const token = getUserToken(); 

            // GET request to EC2 Backend for vendor's listings
            const response = await apiClient('vendor/auctions', {
                // Add Authorization header here
            }); 
            
            setVendorAuctions(response.auctions || []);
        } catch (err) {
            console.error('Error fetching vendor auctions:', err);
            setError('Failed to load your auction listings from the API.');
            setVendorAuctions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVendorAuctions();
    }, [fetchVendorAuctions]);


    // --- Form Handlers ---

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData(prev => ({ ...prev, images: files }));
    };

    // This is the CRITICAL function involving S3 via EC2
    const handleSubmission = async (e) => {
        e.preventDefault();
        setError(null);
        
        const submissionData = new FormData();
        
        // 1. Append all text fields
        Object.keys(formData).forEach(key => {
            if (key !== 'images') {
                submissionData.append(key, formData[key]);
            }
        });

        // 2. Append all image files (This data will be routed to S3 by EC2)
        formData.images.forEach((file) => {
            submissionData.append('itemImages', file); // 'itemImages' matches the field name expected by Multer on EC2
        });

        try {
            // POST request to EC2 Backend for auction submission and file upload
            const response = await apiClient('vendor/upload', {
                method: 'POST',
                // Important: Do NOT set Content-Type header; FormData handles multipart boundary automatically
                // 'Authorization': `Bearer ${user.token}`, 
                body: submissionData,
            });

            if (response) {
                alert("Auction submitted successfully! Awaiting Admin approval.");
                
                // Reset form and UI
                setFormData({
                    itemName: '', description: '', category: '', minBid: '',
                    auctionDuration: '', pickupAddress: '', contactInfo: '', images: []
                });
                setIsModalOpen(false);
                
                // Refresh the vendor's auction list
                fetchVendorAuctions();
            }

        } catch (err) {
            console.error('Submission failed:', err);
            setError(`Submission failed: ${err.message}. Check EC2 logs.`);
        }
    };
    
    // Helper to render status pills
    const renderStatusPill = (status) => {
        const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize space-x-1';
        switch (status) {
            case 'pending': return <span className={`${base} bg-yellow-100 text-yellow-800`}><Clock className="h-4 w-4" /> <span>Pending</span></span>;
            case 'approved': 
            case 'active': return <span className={`${base} bg-green-100 text-green-800`}><TrendingUp className="h-4 w-4" /> <span>Active</span></span>;
            case 'rejected': return <span className={`${base} bg-red-100 text-red-800`}><XCircle className="h-4 w-4" /> <span>Rejected</span></span>;
            case 'completed': return <span className={`${base} bg-gray-100 text-gray-800`}><CheckCircle className="h-4 w-4" /> <span>Completed</span></span>;
            default: return <span className={`${base} bg-gray-100 text-gray-500`}>{status}</span>;
        }
    };

    const stats = [
        { icon: TrendingUp, label: 'Total Auctions', value: vendorAuctions.length, color: 'text-blue-600', bg: 'bg-blue-100' },
        { icon: DollarSign, label: 'Active Auctions', value: vendorAuctions.filter(a => a.status === 'active').length, color: 'text-green-600', bg: 'bg-green-100' },
        { icon: Package, label: 'Pending Approval', value: vendorAuctions.filter(a => a.status === 'pending').length, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { icon: Users, label: 'Total Revenue', value: `$${(vendorAuctions.reduce((sum, a) => sum + (a.currentBid || 0), 0)).toLocaleString()}`, color: 'text-purple-600', bg: 'bg-purple-100' }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <motion.h1 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-3xl font-bold text-gray-900"
                >
                    Vendor Dashboard
                </motion.h1>
                <motion.button
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    <span>Submit New Auction</span>
                </motion.button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    <p className="font-bold">Error:</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
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

            {/* Auction Listings Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Your Auction Listings</h2>
                </div>
                {loading ? (
                    <p className="text-center py-8 text-gray-500">Loading your auctions...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Bid</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Bid</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bids</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vendorAuctions.map(auction => (
                                    <tr key={auction.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{auction.itemName}</div>
                                            <div className="text-sm text-gray-500">ID: {auction.id.slice(0, 8)}...</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {renderStatusPill(auction.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${auction.minBid}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${auction.currentBid || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{auction.bidCount || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {auction.status === 'active' ? new Date(auction.endTime).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => alert(`Viewing details for ${auction.itemName}`)}
                                                className="text-blue-600 hover:text-blue-900"
                                                disabled={auction.status !== 'active' && auction.status !== 'pending'}
                                            >
                                                <Eye className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Submit New Auction Modal */}
            {isModalOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6">Submit New Auction</h2>
                            
                            <form onSubmit={handleSubmission} className="space-y-6">
                                {/* Item Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                                    <input type="text" name="itemName" value={formData.itemName} onChange={handleFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                
                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleFormChange} rows={4} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                
                                {/* Category & Min Bid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                        <select name="category" value={formData.category} onChange={handleFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">Select Category</option>
                                            <option value="electronics">Electronics</option>
                                            <option value="furniture">Furniture</option>
                                            <option value="clothing">Clothing</option>
                                            <option value="collectibles">Collectibles</option>
                                            <option value="art">Art</option>
                                            <option value="books">Books</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Bid ($)</label>
                                        <input type="number" name="minBid" value={formData.minBid} onChange={handleFormChange} min="1" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                </div>
                                
                                {/* Duration & Contact */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Auction Duration (hours)</label>
                                        <select name="auctionDuration" value={formData.auctionDuration} onChange={handleFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">Select Duration</option>
                                            <option value="24">24 Hours</option>
                                            <option value="48">48 Hours</option>
                                            <option value="72">72 Hours</option>
                                            <option value="168">1 Week</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
                                        <input type="text" name="contactInfo" value={formData.contactInfo} onChange={handleFormChange} placeholder="Phone number or email" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                </div>

                                {/* Pickup Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address</label>
                                    <textarea name="pickupAddress" value={formData.pickupAddress} onChange={handleFormChange} rows={3} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                
                                {/* Item Images (S3 via EC2) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Images</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept="image/*" 
                                            onChange={handleFileChange} 
                                            className="hidden" 
                                            id="images" 
                                            name="images"
                                            required 
                                        />
                                        <label htmlFor="images" className="cursor-pointer text-blue-600 hover:text-blue-500">
                                            Click to upload images
                                        </label>
                                        {formData.images.length > 0 && (
                                            <p className="text-sm text-gray-600 mt-2">Selected: {formData.images.length} files</p>
                                        )}
                                        <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB each</p>
                                    </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Submit for Approval
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default VendorDashboard;