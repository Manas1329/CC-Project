// src/utils/apiClient.js (MODIFIED for Authorization)

// Access the environment variable set in vite.config.ts
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Utility function to safely get the authentication token from localStorage.
 */
const getAuthToken = () => {
    const storedUser = localStorage.getItem('auctionUser');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            return user.token;
        } catch (e) {
            return null;
        }
    }
    return null;
};

/**
 * Utility function to handle all API calls.
 * @param {string} endpoint - The path (e.g., 'auctions/live').
 * @param {object} options - Fetch API options.
 * @returns {Promise<any>}
 */
export const apiClient = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}/${endpoint}`;
    const token = getAuthToken(); // Retrieve token for authorization

    const headers = {
        // Set Content-Type by default, can be overridden for FormData/file uploads
        'Content-Type': 'application/json', 
        ...options.headers,
    };

    // Attach token to the Authorization header if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Remove Content-Type if uploading files (FormData handles it)
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        // Log unauthorized access
        if (response.status === 401) {
            console.error("Authorization failed. User may need to log in again.");
            // NOTE: In a full app, you would dispatch a global logout action here.
        }
        
        const errorBody = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
        throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
    }

    // Handle 204 No Content responses
    if (response.status === 204) return null;
    
    return response.json();
};

export default API_BASE_URL;