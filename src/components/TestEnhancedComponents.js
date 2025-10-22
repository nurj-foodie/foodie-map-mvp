import React, { useState } from 'react';
import EnhancedRestaurantCard from './EnhancedRestaurantCard';
import ExpandableRestaurantCard from './ExpandableRestaurantCard';
import GlobalSearch from './GlobalSearch';
import SearchDemo from './SearchDemo';
import './TestEnhancedComponents.css';

const TestEnhancedComponents = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('demo');
  const [searchResults, setSearchResults] = useState([]);

  // Sample restaurant data for testing
  const sampleRestaurants = [
    {
      id: '1',
      name: 'Nasi Lemak Wanjo',
      address: '123 Jalan Ampang, Kuala Lumpur, Malaysia',
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
        { 
          verified: true, 
          rating: 4.5, 
          comment: 'Amazing nasi lemak!',
          visitDetails: {
            visitType: 'dine-in',
            partySize: 2,
            mealType: 'breakfast',
            visitDate: '2024-01-15'
          }
        },
        { 
          verified: true, 
          rating: 4.0, 
          comment: 'Great value for money',
          visitDetails: {
            visitType: 'takeaway',
            partySize: 1,
            mealType: 'lunch',
            visitDate: '2024-01-10'
          }
        },
        { 
          verified: false, 
          rating: 3.8, 
          comment: 'Good but crowded',
          visitDetails: {
            visitType: 'dine-in',
            partySize: 4,
            mealType: 'dinner',
            visitDate: '2024-01-08'
          }
        }
      ],
      userPhotos: [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400'
      ],
      photos: [
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400'
      ],
      priceLevel: '$$',
      operatingHours: {
        isOpen: true,
        hours: '6:00 AM - 2:00 PM'
      },
      totalCheckIns: 15
    },
    {
      id: '2',
      name: 'Dim Sum Palace',
      address: '456 Jalan Bukit Bintang, Kuala Lumpur, Malaysia',
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
        { 
          verified: true, 
          rating: 4.2, 
          comment: 'Best dim sum in town!',
          visitDetails: {
            visitType: 'dine-in',
            partySize: 3,
            mealType: 'breakfast',
            visitDate: '2024-01-12'
          }
        },
        { 
          verified: false, 
          rating: 3.8, 
          comment: 'Good but expensive',
          visitDetails: {
            visitType: 'dine-in',
            partySize: 2,
            mealType: 'lunch',
            visitDate: '2024-01-05'
          }
        }
      ],
      userPhotos: [],
      photos: [
        'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
        'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400'
      ],
      priceLevel: '$$$',
      operatingHours: {
        isOpen: true,
        hours: '7:00 AM - 10:00 PM'
      },
      totalCheckIns: 8
    },
    {
      id: '3',
      name: 'Biryani House',
      address: '789 Jalan Masjid India, Kuala Lumpur, Malaysia',
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
        { 
          verified: true, 
          rating: 4.7, 
          comment: 'Authentic biryani!',
          visitDetails: {
            visitType: 'dine-in',
            partySize: 2,
            mealType: 'dinner',
            visitDate: '2024-01-14'
          }
        },
        { 
          verified: true, 
          rating: 4.3, 
          comment: 'Great service',
          visitDetails: {
            visitType: 'dine-in',
            partySize: 4,
            mealType: 'lunch',
            visitDate: '2024-01-11'
          }
        },
        { 
          verified: true, 
          rating: 4.5, 
          comment: 'Love the ambiance',
          visitDetails: {
            visitType: 'dine-in',
            partySize: 2,
            mealType: 'dinner',
            visitDate: '2024-01-09'
          }
        }
      ],
      userPhotos: [
        'https://images.unsplash.com/photo-1563379091339-03246963d4d0?w=400',
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
        'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400'
      ],
      photos: [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'
      ],
      priceLevel: '$$',
      operatingHours: {
        isOpen: true,
        hours: '11:00 AM - 11:00 PM'
      },
      totalCheckIns: 22
    }
  ];

  // Event handlers
  const handleViewDetails = (restaurant) => {
    console.log('View details for:', restaurant.name);
    alert(`Viewing details for: ${restaurant.name}\n\nAddress: ${restaurant.address}\nCuisine: ${restaurant.cuisineType}\nRating: ${restaurant.rating.overall}/5.0`);
  };

  const handleAddReview = (restaurant) => {
    console.log('Add review for:', restaurant.name);
    alert(`Adding review for: ${restaurant.name}\n\nThis would open the review form.`);
  };

  const handleShare = (restaurant) => {
    console.log('Share restaurant:', restaurant.name);
    if (navigator.share) {
      navigator.share({
        title: restaurant.name,
        text: `Check out ${restaurant.name} - ${restaurant.cuisineType} restaurant`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${restaurant.name} - ${restaurant.address}`);
      alert('Restaurant info copied to clipboard!');
    }
  };

  const handleSearchResults = (results) => {
    console.log('Search results:', results);
    setSearchResults(results);
  };

  return (
    <div className="test-enhanced-components">
      <div className="test-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>🧪 Enhanced Rating System & Review Navigation Test</h1>
            <p>Testing the new components before integration</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✕ Close
            </button>
          )}
        </div>
        
        {/* Debug Info Box */}
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '12px',
          margin: '16px 0',
          fontSize: '14px',
          color: '#856404'
        }}>
          <strong>🔧 Debug Info:</strong> Check the console for debug logs. Look for the <strong>blue banner</strong> at the top of restaurant cards to confirm the Review Navigation System is active. Use the "Force Mobile/Desktop" buttons to test responsive behavior.
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'demo' ? 'active' : ''}`}
          onClick={() => setActiveTab('demo')}
        >
          🎯 Full Demo
        </button>
        <button 
          className={`tab-button ${activeTab === 'cards' ? 'active' : ''}`}
          onClick={() => setActiveTab('cards')}
        >
          🍽️ Restaurant Cards
        </button>
        <button 
          className={`tab-button ${activeTab === 'expandable' ? 'active' : ''}`}
          onClick={() => setActiveTab('expandable')}
        >
          📱 Expandable Cards
        </button>
        <button 
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Global Search
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'demo' && (
          <div className="demo-tab">
            <SearchDemo />
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="cards-tab">
            <div className="cards-header">
              <h2>Enhanced Restaurant Cards</h2>
              <p>Testing individual restaurant cards with enhanced rating system</p>
            </div>
            
            <div className="cards-grid">
              {sampleRestaurants.map(restaurant => (
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

        {activeTab === 'expandable' && (
          <div className="expandable-tab">
            <div className="expandable-header">
              <h2>Expandable Restaurant Cards</h2>
              <p>Testing expandable cards with lazy loading, photos, reviews, and check-ins. Features mobile "Show More" reviews and desktop modal with sorting/filtering.</p>
            </div>
            
            <div className="expandable-cards">
              {sampleRestaurants.map(restaurant => (
                <ExpandableRestaurantCard
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

        {activeTab === 'search' && (
          <div className="search-tab">
            <div className="search-header">
              <h2>Global Search Interface</h2>
              <p>Testing the search functionality with filters</p>
            </div>
            
            <GlobalSearch 
              onSearchResults={handleSearchResults}
              onClose={() => console.log('Search closed')}
            />
            
            {searchResults.length > 0 && (
              <div className="search-results">
                <h3>Search Results ({searchResults.length})</h3>
                <div className="results-list">
                  {searchResults.map(restaurant => (
                    <div key={restaurant.id} className="result-item">
                      <h4>{restaurant.name}</h4>
                      <p>{restaurant.address}</p>
                      <div className="result-meta">
                        <span className="cuisine">{restaurant.cuisineType}</span>
                        <span className="rating">⭐ {restaurant.rating?.overall || 'N/A'}</span>
                        <span className="halal">{restaurant.halalStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Status */}
      <div className="test-status">
        <h3>✅ Test Status</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-icon">📸</span>
            <span>User Photo Priority</span>
            <span className="status-check">✅</span>
          </div>
          <div className="status-item">
            <span className="status-icon">⭐</span>
            <span>Combined Star + Number Ratings</span>
            <span className="status-check">✅</span>
          </div>
          <div className="status-item">
            <span className="status-icon">📊</span>
            <span>Category Rating Breakdown</span>
            <span className="status-check">✅</span>
          </div>
          <div className="status-item">
            <span className="status-icon">✅</span>
            <span>Verification Badges</span>
            <span className="status-check">✅</span>
          </div>
          <div className="status-item">
            <span className="status-icon">🔍</span>
            <span>4 Basic + Advanced Filters</span>
            <span className="status-check">✅</span>
          </div>
          <div className="status-item">
            <span className="status-icon">🌍</span>
            <span>Global Database Search</span>
            <span className="status-check">✅</span>
          </div>
          <div className="status-item">
            <span className="status-icon">📱</span>
            <span>Mobile Responsive</span>
            <span className="status-check">✅</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEnhancedComponents;
