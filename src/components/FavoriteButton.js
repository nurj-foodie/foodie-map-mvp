import React, { useState, useMemo } from 'react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { firestoreSearchService } from '../services/firestoreSearchService';
import './FavoriteButton.css';

const FavoriteButton = ({ restaurant, size = 'medium', showText = false, className = '' }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Clean restaurant data to remove Google Maps objects before using
  const cleanedRestaurant = useMemo(() => {
    if (!restaurant) return null;
    // Clean the restaurant data to remove any Google Maps objects
    return firestoreSearchService.deepCleanForFirestore(restaurant);
  }, [restaurant]);

  // Check if restaurant data is valid
  if (!cleanedRestaurant || (!cleanedRestaurant.name && !cleanedRestaurant.eateryName && !cleanedRestaurant.displayName)) {
    console.error('❌ Invalid restaurant data passed to FavoriteButton:', restaurant);
    return null; // Don't render the button if data is invalid
  }

  // Generate a unique ID for restaurants that don't have one
  // Handle different ID field names and structures
  // IMPORTANT: Must match the ID generation logic in favoritesService.js
  const restaurantName = cleanedRestaurant.name || cleanedRestaurant.eateryName || cleanedRestaurant.displayName;
  
  // IMPORTANT: Prioritize place_id over id to avoid Firestore document ID conflicts
  // place_id is the Google Place ID (persistent identifier)
  // id might be a Firestore document ID (not reliable for matching)
  let restaurantId = cleanedRestaurant.place_id || cleanedRestaurant.placeId;
  
  // Only use restaurant.id if it looks like a Google Place ID (starts with "ChIJ")
  // or if it's a temp ID (starts with "temp_")
  if (!restaurantId && cleanedRestaurant.id) {
    if (cleanedRestaurant.id.startsWith('ChIJ') || cleanedRestaurant.id.startsWith('temp_')) {
      restaurantId = cleanedRestaurant.id;
    } else {
      // Ignore Firestore document IDs - they're not reliable for matching
      console.warn('⚠️ FavoriteButton: Ignoring Firestore document ID:', cleanedRestaurant.id);
    }
  }
  
  // If no ID exists, generate a temporary one based on name and location (same as favoritesService)
  if (!restaurantId && restaurantName) {
    const lat = cleanedRestaurant.geometry?.location?.lat || cleanedRestaurant.location?.lat || cleanedRestaurant.lat || 0;
    const lng = cleanedRestaurant.geometry?.location?.lng || cleanedRestaurant.location?.lng || cleanedRestaurant.lng || 0;
    restaurantId = `temp_${restaurantName.replace(/\s+/g, '_').toLowerCase()}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
  }
  
  // Ensure we have a valid restaurant ID
  if (!restaurantId) {
    console.error('❌ No valid restaurant ID found:', cleanedRestaurant);
    return null;
  }
  
  const isFavorited = isFavorite(restaurantId);

  // Restaurant data validation complete

  const handleToggle = async (e) => {
    // Prevent event propagation to parent elements
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setMessage('Please sign in to add favorites');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Use cleaned restaurant data
      // Log the restaurant ID being used for debugging
      console.log('🔘 FavoriteButton: Toggling favorite for ID:', restaurantId, 'Restaurant:', restaurantName);
      const result = await toggleFavorite(cleanedRestaurant);
      
      if (result.success) {
        setMessage(result.message || (isFavorited ? 'Removed from favorites' : 'Added to favorites'));
        setTimeout(() => setMessage(''), 2000);
        // Force a small delay to ensure state updates
        setTimeout(() => {
          // The context will reload favorites automatically
        }, 100);
      } else {
        setMessage(result.error);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('❌ Error in FavoriteButton:', error);
      setMessage('Something went wrong');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'favorite-btn--small';
      case 'large': return 'favorite-btn--large';
      default: return 'favorite-btn--medium';
    }
  };

  return (
    <div className={`favorite-button ${className}`}>
      <button
        className={`favorite-btn ${getSizeClass()} ${isFavorited ? 'favorite-btn--active' : ''}`}
        onClick={handleToggle}
        disabled={loading}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        {loading ? (
          <div className="favorite-btn__spinner"></div>
        ) : (
          <span className="favorite-btn__icon">
            {isFavorited ? '❤️' : '🤍'}
          </span>
        )}
        {showText && (
          <span className="favorite-btn__text">
            {isFavorited ? 'Favorited' : 'Add to Favorites'}
          </span>
        )}
      </button>
      
      {message && (
        <div className={`favorite-message ${message.includes('error') || message.includes('wrong') ? 'favorite-message--error' : 'favorite-message--success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default FavoriteButton;
