import React, { useState } from 'react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import './FavoriteButton.css';

const FavoriteButton = ({ restaurant, size = 'medium', showText = false, className = '' }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Check if restaurant data is valid
  if (!restaurant || (!restaurant.name && !restaurant.eateryName && !restaurant.displayName)) {
    console.error('❌ Invalid restaurant data passed to FavoriteButton:', restaurant);
    return null; // Don't render the button if data is invalid
  }

  // Generate a unique ID for restaurants that don't have one
  // Handle different ID field names and structures
  const restaurantName = restaurant.name || restaurant.eateryName || restaurant.displayName;
  const restaurantId = restaurant.place_id || restaurant.id || 
    (restaurantName ? `temp_${restaurantName.replace(/\s+/g, '_').toLowerCase()}` : null);
  
  // Ensure we have a valid restaurant ID
  if (!restaurantId) {
    console.error('❌ No valid restaurant ID found:', restaurant);
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
      const result = await toggleFavorite(restaurant);
      
      if (result.success) {
        setMessage(result.message);
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage(result.error);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
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
