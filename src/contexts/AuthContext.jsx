// src/contexts/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Utility function to safely get the token from storage (needed by apiClient)
const getLocalUser = () => {
  const storedUser = localStorage.getItem('auctionUser');
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      // In case of parsing error
      localStorage.removeItem('auctionUser');
      return null;
    }
  }
  return null;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session on initial load
    const storedUser = getLocalUser();
    if (storedUser) {
      // NOTE: In a production app, you would ideally send the storedUser.token 
      // to the EC2 backend here to verify it's still valid/refresh it.
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  // Updated Login function: Now accepts the authenticated user object from LoginPage
  const login = (userData) => {
    if (!userData || !userData.role || !userData.token) {
        throw new Error("Invalid user data provided to AuthContext login.");
    }
    
    // Store the full user object including the token
    const userProfile = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      name: userData.name || userData.email.split('@')[0],
      token: userData.token, 
    };
    
    setUser(userProfile);
    localStorage.setItem('auctionUser', JSON.stringify(userProfile));
    return userProfile;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auctionUser');
    // NOTE: In a real app, also call the EC2 backend to invalidate the session/token if possible.
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children only after checking local storage */}
      {!loading && children}
    </AuthContext.Provider>
  );
};