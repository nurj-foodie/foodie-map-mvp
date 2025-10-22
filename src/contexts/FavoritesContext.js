import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { favoritesService } from '../services/favoritesService';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const authContext = useAuth();
  const user = authContext?.user;
  const authLoading = authContext?.loading;
  const [favorites, setFavorites] = useState([]);
  const [removedFavorites, setRemovedFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const loadFavorites = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load both active favorites and recently removed
      const [activeResult, removedResult] = await Promise.all([
        favoritesService.getUserFavorites(user.uid),
        favoritesService.getRecentlyRemovedFavorites(user.uid)
      ]);
      
      if (activeResult.success) {
        setFavorites(activeResult.favorites);
        // Create a Set of favorite restaurant IDs for quick lookup
        // Handle both old and new field naming conventions
        const ids = new Set(activeResult.favorites.map(fav => fav.restaurantId || fav.eateryId));
        setFavoriteIds(ids);
        console.log(`✅ Loaded ${activeResult.favorites.length} active favorites`);
      }
      
      if (removedResult.success) {
        setRemovedFavorites(removedResult.removedFavorites);
        console.log(`✅ Loaded ${removedResult.removedFavorites.length} recently removed favorites`);
      }
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load user's favorites when user changes
  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading
    
    if (user) {
      const loadData = async () => {
        await loadFavorites();
        // Run cleanup for expired removals after loading
        try {
          const result = await favoritesService.cleanupExpiredRemovals(user.uid);
          if (result.success && result.cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${result.cleanedCount} expired removed favorites`);
            // Reload favorites to reflect the cleanup
            await loadFavorites();
          }
        } catch (error) {
          console.error('❌ Error during cleanup:', error);
        }
      };
      
      loadData();
    } else {
      setFavorites([]);
      setRemovedFavorites([]);
      setFavoriteIds(new Set());
    }
  }, [user, loadFavorites, authLoading]);

  const addToFavorites = async (restaurant) => {
    if (!user) {
      return { success: false, error: 'Please sign in to add favorites' };
    }

    try {
      const result = await favoritesService.addToFavorites(user.uid, restaurant);
      if (result.success) {
        // Reload favorites to get the latest data
        await loadFavorites();
      }
      return result;
    } catch (error) {
      console.error('❌ Error adding to favorites:', error);
      return { success: false, error: error.message };
    }
  };

  const removeFromFavorites = async (restaurantId) => {
    if (!user) {
      return { success: false, error: 'Please sign in to manage favorites' };
    }

    try {
      const result = await favoritesService.removeFromFavorites(user.uid, restaurantId);
      
      if (result.success) {
        // Reload favorites to get the latest data
        await loadFavorites();
      }
      return result;
    } catch (error) {
      console.error('❌ Error removing from favorites:', error);
      return { success: false, error: error.message };
    }
  };

  const toggleFavorite = async (restaurant) => {
    if (!user) {
      return { success: false, error: 'Please sign in to manage favorites' };
    }

    try {
      const result = await favoritesService.toggleFavorite(user.uid, restaurant);
      if (result.success) {
        // Reload favorites to get the latest data
        await loadFavorites();
      }
      return result;
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      return { success: false, error: error.message };
    }
  };

  const restoreFavorite = async (favoriteId) => {
    if (!user) {
      return { success: false, error: 'Please sign in to restore favorites' };
    }

    try {
      const result = await favoritesService.restoreFavorite(user.uid, favoriteId);
      
      if (result.success) {
        // Reload favorites to get the latest data
        await loadFavorites();
      }
      return result;
    } catch (error) {
      console.error('❌ Error restoring favorite:', error);
      return { success: false, error: error.message };
    }
  };

  const isFavorite = (restaurantId) => {
    if (!restaurantId) return false;
    return favoriteIds.has(restaurantId);
  };

  const getFavoriteRestaurants = () => {
    console.log('🔍 Raw favorites data:', favorites);
    
    // Check for duplicate IDs
    const ids = favorites.map(fav => fav.restaurantId || fav.eateryId);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      console.warn('⚠️ Found duplicate restaurant IDs:', duplicateIds);
    }
    
    // Remove duplicates based on restaurant ID
    const uniqueFavorites = favorites.filter((fav, index, self) => {
      const id = fav.restaurantId || fav.eateryId;
      return index === self.findIndex(f => (f.restaurantId || f.eateryId) === id);
    });
    
    if (uniqueFavorites.length !== favorites.length) {
      console.log(`🔧 Removed ${favorites.length - uniqueFavorites.length} duplicate favorites`);
    }
    
    return uniqueFavorites.map(fav => {
      console.log('🔍 Processing favorite:', fav);
      
      // If we have the full restaurant data, use it
      if (fav.restaurantData && fav.restaurantData.name) {
        console.log('✅ Using restaurantData:', fav.restaurantData);
        return fav.restaurantData;
      }
      
      // Otherwise, reconstruct from stored fields
      // Handle both old and new field naming conventions
      const restaurantId = fav.restaurantId || fav.eateryId;
      const restaurantName = fav.restaurantName || fav.eateryName;
      const restaurantAddress = fav.restaurantAddress || fav.eateryAddress;
      const restaurantRating = fav.restaurantRating || fav.eateryRating;
      const restaurantLocation = fav.restaurantLocation || fav.eateryLocation;
      const restaurantTypes = fav.restaurantTypes || fav.eateryTypes;
      
      const reconstructed = {
        id: restaurantId,
        place_id: restaurantId, // Add place_id for compatibility
        name: restaurantName || 'Unknown Restaurant',
        vicinity: restaurantAddress || 'Address not available',
        rating: restaurantRating || 0,
        price_level: fav.restaurantPriceLevel || null,
        types: restaurantTypes || [],
        geometry: {
          location: restaurantLocation || { lat: 0, lng: 0 }
        },
        photos: fav.restaurantPhoto ? [{ photo_reference: fav.restaurantPhoto }] : []
      };
      
      console.log('🔧 Reconstructed restaurant:', reconstructed);
      return reconstructed;
    });
  };

  const getRecentlyRemovedRestaurants = () => {
    console.log('🔍 Raw removed favorites data:', removedFavorites);
    
    return removedFavorites.map(fav => {
      // If we have the full restaurant data, use it
      if (fav.restaurantData && fav.restaurantData.name) {
        return {
          ...fav.restaurantData,
          favoriteId: fav.id,
          removedAt: fav.removedAt
        };
      }
      
      // Otherwise, reconstruct from stored fields
      const restaurantId = fav.restaurantId || fav.eateryId;
      const restaurantName = fav.restaurantName || fav.eateryName;
      const restaurantAddress = fav.restaurantAddress || fav.eateryAddress;
      const restaurantRating = fav.restaurantRating || fav.eateryRating;
      const restaurantLocation = fav.restaurantLocation || fav.eateryLocation;
      const restaurantTypes = fav.restaurantTypes || fav.eateryTypes;
      
      return {
        id: restaurantId,
        place_id: restaurantId,
        name: restaurantName || 'Unknown Restaurant',
        vicinity: restaurantAddress || 'Address not available',
        rating: restaurantRating || 0,
        price_level: fav.restaurantPriceLevel || null,
        types: restaurantTypes || [],
        geometry: {
          location: restaurantLocation || { lat: 0, lng: 0 }
        },
        photos: fav.restaurantPhoto ? [{ photo_reference: fav.restaurantPhoto }] : [],
        favoriteId: fav.id,
        removedAt: fav.removedAt
      };
    });
  };

  const value = {
    favorites,
    removedFavorites,
    favoriteIds,
    loading: loading || authLoading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    restoreFavorite,
    isFavorite,
    getFavoriteRestaurants,
    getRecentlyRemovedRestaurants,
    loadFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
