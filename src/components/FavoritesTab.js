import React, { useState } from 'react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import FavoriteButton from './FavoriteButton';
import RestaurantModal from './RestaurantModal';
import './FavoritesTab.css';

const FavoritesTab = ({ 
  savedRoutes = [], 
  onLoadRoute, 
  onDeleteRoute 
}) => {
  const { 
    favorites, 
    loading, 
    removeFromFavorites, 
    restoreFavorite,
    getFavoriteRestaurants, 
    getRecentlyRemovedRestaurants 
  } = useFavorites();
  const { user } = useAuth();
  
  // State for restaurant detail modal
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('favorites');

  const favoriteRestaurants = getFavoriteRestaurants();
  const recentlyRemovedRestaurants = getRecentlyRemovedRestaurants();

  if (!user) {
    return (
      <div className="favorites-tab">
        <div className="favorites-signin">
          <div className="signin-icon">⭐</div>
          <h3>Sign in to save favorites</h3>
          <p>Create an account or sign in to save your favorite restaurants and access them from anywhere!</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="favorites-tab">
        <div className="favorites-loading">
          <div className="loading-spinner"></div>
          <p>Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-tab">
      <div className="favorites-header">
        <h2>⭐ Your Favorites</h2>
        <p>
          {activeTab === 'favorites' 
            ? `${favoriteRestaurants.length} saved restaurants`
            : `${savedRoutes.length} saved routes`
          }
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="favorites-tabs">
        <button
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          ⭐ Favorites ({favoriteRestaurants.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          📚 Saved Routes ({savedRoutes.length})
        </button>
      </div>

      {/* Favorites Tab Content */}
      {activeTab === 'favorites' && (
        <>
          {favoriteRestaurants.length === 0 ? (
        <div className="favorites-empty">
          <div className="empty-icon">⭐</div>
          <h3>No favorites yet</h3>
          <p>Start exploring restaurants and add them to your favorites!</p>
          <div className="empty-tips">
            <p>💡 Tips:</p>
            <ul>
              <li>Tap the star icon on any restaurant</li>
              <li>Use the Discover tab to find new places</li>
              <li>Search for specific cuisines or locations</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="favorites-list">
          {favoriteRestaurants.map((restaurant, index) => {
            // Create a unique key that combines ID and index to avoid duplicates
            const uniqueKey = restaurant.id || restaurant.place_id || `favorite-${index}`;
            return (
            <div key={`${uniqueKey}-${index}`} className="favorite-item">
              <div className="favorite-info">
                <h4>{restaurant.name}</h4>
                <p>{restaurant.vicinity}</p>
                <div className="favorite-rating">
                  ⭐ {restaurant.rating || 'N/A'}
                </div>
              </div>
              <div className="favorite-actions">
                <button
                  className="detail-btn"
                  onClick={() => {
                    setSelectedRestaurant(restaurant);
                    setShowRestaurantModal(true);
                  }}
                >
                  📋 Details
                </button>
                <FavoriteButton
                  restaurant={restaurant}
                  size="small"
                  showText={false}
                />
              </div>
            </div>
            );
          })}
        </div>
          )}

          {/* Recently Removed Section - Only in Favorites tab */}
          {recentlyRemovedRestaurants.length > 0 && (
        <div className="recently-removed-section">
          <div className="recently-removed-header">
            <h3>🗑️ Recently Removed</h3>
            <p>{recentlyRemovedRestaurants.length} removed restaurants</p>
          </div>
          
          <div className="recently-removed-list">
            {recentlyRemovedRestaurants.map((restaurant, index) => {
              const uniqueKey = restaurant.id || restaurant.place_id || `removed-${index}`;
              const removedTime = restaurant.removedAt?.toDate ? restaurant.removedAt.toDate() : new Date(restaurant.removedAt);
              const timeAgo = getTimeAgo(removedTime);
              
              return (
                <div key={`${uniqueKey}-${index}`} className="removed-item">
                  <div className="removed-info">
                    <h4>{restaurant.name}</h4>
                    <p>{restaurant.vicinity}</p>
                    <div className="removed-details">
                      <span>⭐ {restaurant.rating || 'N/A'}</span>
                      <span className="removed-time">Removed {timeAgo}</span>
                    </div>
                  </div>
                  <div className="removed-actions">
                    <button
                      className="detail-btn"
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        setShowRestaurantModal(true);
                      }}
                    >
                      📋 Details
                    </button>
                    <button
                      className="restore-btn"
                      onClick={async () => {
                        const result = await restoreFavorite(restaurant.favoriteId);
                        if (result.success) {
                          console.log('✅ Restaurant restored');
                        } else {
                          console.error('❌ Failed to restore:', result.error);
                        }
                      }}
                    >
                      🔄 Restore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          )}
        </>
      )}

      {/* Saved Routes Tab Content */}
      {activeTab === 'routes' && (
        <>
          {savedRoutes.length === 0 ? (
            <div className="favorites-empty">
              <div className="empty-icon">📚</div>
              <h3>No saved routes yet</h3>
              <p>Create a route with selected restaurants and save it for future reference!</p>
              <div className="empty-tips">
                <p>💡 Tips:</p>
                <ul>
                  <li>Go to Discover tab and search for a route</li>
                  <li>Select restaurants along your route</li>
                  <li>Click "Save This Route" to save it</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="favorites-list">
              {savedRoutes.map((route) => {
                const routeDate = route.createdAt?.toDate 
                  ? route.createdAt.toDate() 
                  : (route.createdAt ? new Date(route.createdAt) : new Date());
                
                return (
                  <div key={route.id} className="favorite-item route-item">
                    <div className="favorite-info">
                      <h4>{route.name}</h4>
                      <div className="route-details">
                        <div className="route-detail-row">
                          <span>🚀 <strong>Start:</strong> {route.startLocation?.name || 'Unknown'}</span>
                        </div>
                        <div className="route-detail-row">
                          <span>🏁 <strong>End:</strong> {route.endLocation?.name || 'Unknown'}</span>
                        </div>
                        <div className="route-detail-row">
                          <span>🍽️ <strong>Stops:</strong> {route.totalStops || 0} restaurant{route.totalStops !== 1 ? 's' : ''}</span>
                        </div>
                        {route.totalDistance && (
                          <div className="route-detail-row">
                            <span>📏 <strong>Distance:</strong> {route.totalDistance}</span>
                          </div>
                        )}
                        {route.totalDuration && (
                          <div className="route-detail-row">
                            <span>⏱️ <strong>Duration:</strong> {route.totalDuration}</span>
                          </div>
                        )}
                        <div className="route-detail-row route-date">
                          <span>📅 Saved: {routeDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="favorite-actions">
                      <button
                        className="load-route-btn"
                        onClick={() => {
                          if (onLoadRoute) {
                            onLoadRoute(route);
                            // Switch to Discover tab after loading (if available)
                            // This would need to be handled by parent component
                          }
                        }}
                      >
                        🔄 Load Route
                      </button>
                      <button
                        className="delete-route-btn"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${route.name}"?`)) {
                            if (onDeleteRoute) {
                              onDeleteRoute(route.id, route.name);
                            }
                          }
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Restaurant Detail Modal */}
      {showRestaurantModal && selectedRestaurant && (
        <RestaurantModal 
          isOpen={true} 
          restaurant={selectedRestaurant} 
          onClose={() => setShowRestaurantModal(false)} 
        />
      )}
    </div>
  );
};

// Helper function to get time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInMs = now - date;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
};

export default FavoritesTab;
