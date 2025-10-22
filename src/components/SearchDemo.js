import React, { useState, useEffect } from 'react';
import EnhancedRestaurantCard from './EnhancedRestaurantCard';
import GlobalSearch from './GlobalSearch';
import searchService from '../services/searchService';
import './SearchDemo.css';

const SearchDemo = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  // Handle search results
  const handleSearchResults = (results) => {
    setSearchResults(results);
    setShowSearch(false);
  };

  // Handle view details
  const handleViewDetails = (restaurant) => {
    console.log('View details for:', restaurant.name);
    // Implement navigation to restaurant details page
  };

  // Handle add review
  const handleAddReview = (restaurant) => {
    console.log('Add review for:', restaurant.name);
    // Implement navigation to review form
  };

  // Handle share
  const handleShare = (restaurant) => {
    if (navigator.share) {
      navigator.share({
        title: restaurant.name,
        text: `Check out ${restaurant.name} - ${restaurant.cuisineType} restaurant`,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${restaurant.name} - ${restaurant.address}`);
      alert('Restaurant info copied to clipboard!');
    }
  };

  // Load sample data for demo
  const loadSampleData = () => {
    setIsLoading(true);
    
    // Simulate loading sample restaurants
    setTimeout(() => {
      const sampleRestaurants = [
        {
          id: '1',
          name: 'Nasi Lemak Wanjo',
          address: '123 Jalan Ampang, Kuala Lumpur',
          cuisineType: 'Malay',
          halalStatus: 'halal',
          rating: {
            overall: 4.2,
            foodQuality: 4.5,
            valueForMoney: 3.8,
            serviceQuality: 4.0,
            ambiance: 4.3
          },
          userReviews: [
            { verified: true, rating: 4.5, comment: 'Amazing nasi lemak!' },
            { verified: true, rating: 4.0, comment: 'Great value for money' },
            { verified: false, rating: 3.8, comment: 'Good but crowded' }
          ],
          userPhotos: ['user_photo1.jpg', 'user_photo2.jpg'],
          photos: ['google_photo1.jpg'],
          priceLevel: '$$',
          operatingHours: {
            isOpen: true,
            hours: '6:00 AM - 2:00 PM'
          }
        },
        {
          id: '2',
          name: 'Dim Sum Palace',
          address: '456 Jalan Bukit Bintang, Kuala Lumpur',
          cuisineType: 'Chinese',
          halalStatus: 'pork-free',
          rating: {
            overall: 4.0,
            foodQuality: 4.2,
            valueForMoney: 3.5,
            serviceQuality: 3.8,
            ambiance: 4.0
          },
          userReviews: [
            { verified: true, rating: 4.2, comment: 'Best dim sum in town!' },
            { verified: false, rating: 3.8, comment: 'Good but expensive' }
          ],
          userPhotos: [],
          photos: ['google_photo2.jpg', 'google_photo3.jpg'],
          priceLevel: '$$$',
          operatingHours: {
            isOpen: true,
            hours: '7:00 AM - 10:00 PM'
          }
        },
        {
          id: '3',
          name: 'Biryani House',
          address: '789 Jalan Masjid India, Kuala Lumpur',
          cuisineType: 'Indian',
          halalStatus: 'halal',
          rating: {
            overall: 4.5,
            foodQuality: 4.7,
            valueForMoney: 4.2,
            serviceQuality: 4.3,
            ambiance: 4.4
          },
          userReviews: [
            { verified: true, rating: 4.7, comment: 'Authentic biryani!' },
            { verified: true, rating: 4.3, comment: 'Great service' },
            { verified: true, rating: 4.5, comment: 'Love the ambiance' }
          ],
          userPhotos: ['user_photo3.jpg', 'user_photo4.jpg', 'user_photo5.jpg'],
          photos: ['google_photo4.jpg'],
          priceLevel: '$$',
          operatingHours: {
            isOpen: true,
            hours: '11:00 AM - 11:00 PM'
          }
        }
      ];
      
      setSearchResults(sampleRestaurants);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="search-demo">
      <div className="demo-header">
        <h1>🍽️ Restaurant Search & Discovery</h1>
        <p>Enhanced rating system with user photos and verification badges</p>
      </div>

      <div className="demo-controls">
        <button 
          className="btn btn-primary"
          onClick={() => setShowSearch(true)}
        >
          🔍 Global Search
        </button>
        <button 
          className="btn btn-secondary"
          onClick={loadSampleData}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : '📊 Load Sample Data'}
        </button>
      </div>

      {/* Global Search Modal */}
      {showSearch && (
        <div className="search-modal">
          <GlobalSearch 
            onSearchResults={handleSearchResults}
            onClose={() => setShowSearch(false)}
          />
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <h2>Search Results ({searchResults.length})</h2>
            <div className="results-info">
              <span>📍 User photos prioritized</span>
              <span>⭐ Combined star + number ratings</span>
              <span>✅ Verification badges</span>
            </div>
          </div>
          
          <div className="results-grid">
            {searchResults.map(restaurant => (
              <EnhancedRestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onViewDetails={handleViewDetails}
                onAddReview={handleAddReview}
                onShare={handleShare}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results State */}
      {searchResults.length === 0 && !isLoading && (
        <div className="no-results-state">
          <div className="no-results-content">
            <h3>🍽️ Discover Amazing Restaurants</h3>
            <p>Use the global search to find restaurants by cuisine, rating, and more!</p>
            <div className="feature-highlights">
              <div className="feature">
                <span className="feature-icon">📸</span>
                <span>User photos prioritized</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⭐</span>
                <span>Category ratings</span>
              </div>
              <div className="feature">
                <span className="feature-icon">✅</span>
                <span>Verified reviews</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🔍</span>
                <span>Advanced filters</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading sample restaurants...</p>
        </div>
      )}
    </div>
  );
};

export default SearchDemo;
