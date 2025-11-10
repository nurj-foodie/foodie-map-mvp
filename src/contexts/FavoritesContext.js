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
        // Check for duplicates before setting state
        const ids = activeResult.favorites.map(fav => fav.restaurantId || fav.eateryId);
        const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
        
        // If duplicates found, clean them up from Firestore
        if (duplicateIds.length > 0) {
          console.warn(`⚠️ Found ${duplicateIds.length} duplicate restaurant IDs, cleaning up...`);
          const cleanupResult = await favoritesService.cleanupDuplicateFavorites(user.uid);
          if (cleanupResult.success && cleanupResult.removedCount > 0) {
            console.log(`✅ Cleaned up ${cleanupResult.removedCount} duplicate favorites from Firestore`);
            // Reload favorites after cleanup
            const reloadResult = await favoritesService.getUserFavorites(user.uid);
            if (reloadResult.success) {
              setFavorites(reloadResult.favorites);
              const uniqueIds = new Set(
                reloadResult.favorites
                  .map(fav => fav.restaurantId || fav.eateryId)
                  .filter(id => id != null)
              );
              setFavoriteIds(uniqueIds);
              console.log(`✅ Reloaded ${reloadResult.favorites.length} active favorites, ${uniqueIds.size} unique IDs`);
            }
          } else {
            // No cleanup needed or cleanup failed, use original results
            setFavorites(activeResult.favorites);
            const uniqueIds = new Set(
              activeResult.favorites
                .map(fav => fav.restaurantId || fav.eateryId)
                .filter(id => id != null)
            );
            setFavoriteIds(uniqueIds);
            console.log(`✅ Loaded ${activeResult.favorites.length} active favorites, ${uniqueIds.size} unique IDs`);
          }
        } else {
          // No duplicates, proceed normally
          setFavorites(activeResult.favorites);
          const uniqueIds = new Set(
            activeResult.favorites
              .map(fav => fav.restaurantId || fav.eateryId)
              .filter(id => id != null)
          );
          setFavoriteIds(uniqueIds);
          console.log(`✅ Loaded ${activeResult.favorites.length} active favorites, ${uniqueIds.size} unique IDs`);
        }
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
    // Duplicates are now cleaned up in Firestore when favorites load
    // This is just a safety net in case any slip through
    const uniqueFavorites = favorites.filter((fav, index, self) => {
      const id = fav.restaurantId || fav.eateryId;
      return index === self.findIndex(f => (f.restaurantId || f.eateryId) === id);
    });
    
    return uniqueFavorites.map(fav => {
      // If we have the full restaurant data, use it (but ensure place_id is set correctly)
      if (fav.restaurantData && fav.restaurantData.name) {
        const restaurantData = { ...fav.restaurantData };
        const storedRestaurantId = fav.restaurantId || fav.eateryId;
        
        // Try to extract valid Google Place ID from restaurantData first
        let validPlaceId = restaurantData.place_id || restaurantData.placeId;
        
        // If restaurantData has a valid ID, use it
        if (restaurantData.id && (restaurantData.id.startsWith('ChIJ') || restaurantData.id.startsWith('temp_'))) {
          validPlaceId = validPlaceId || restaurantData.id;
        }
        
        // Only use storedRestaurantId if it's a valid Google Place ID or temp ID
        if (!validPlaceId && storedRestaurantId) {
          if (storedRestaurantId.startsWith('ChIJ') || storedRestaurantId.startsWith('temp_')) {
            validPlaceId = storedRestaurantId;
          } else {
            // Stored ID is a Firestore document ID, ignore it
            console.warn('⚠️ Ignoring Firestore document ID in favorite reconstruction:', storedRestaurantId, 'for restaurant:', restaurantData.name);
          }
        }
        
        // If still no valid ID, generate temp ID from name and location
        if (!validPlaceId && restaurantData.name) {
          const lat = restaurantData.geometry?.location?.lat || restaurantData.location?.lat || restaurantData.lat || 0;
          const lng = restaurantData.geometry?.location?.lng || restaurantData.location?.lng || restaurantData.lng || 0;
          validPlaceId = `temp_${restaurantData.name.replace(/\s+/g, '_').toLowerCase()}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
        }
        
        // Set place_id and id correctly
        restaurantData.place_id = validPlaceId;
        if (validPlaceId && (validPlaceId.startsWith('ChIJ') || validPlaceId.startsWith('temp_'))) {
          restaurantData.id = validPlaceId;
        } else {
          // Remove invalid id field
          delete restaurantData.id;
        }
        
        return restaurantData;
      }
      
      // Otherwise, reconstruct from stored fields
      // Handle both old and new field naming conventions
      const storedRestaurantId = fav.restaurantId || fav.eateryId;
      const restaurantName = fav.restaurantName || fav.eateryName;
      const restaurantAddress = fav.restaurantAddress || fav.eateryAddress;
      const restaurantRating = fav.restaurantRating || fav.eateryRating;
      const restaurantLocation = fav.restaurantLocation || fav.eateryLocation;
      const restaurantTypes = fav.restaurantTypes || fav.eateryTypes;
      
      // Determine valid place_id
      let validPlaceId = null;
      
      // Only use storedRestaurantId if it's a valid Google Place ID or temp ID
      if (storedRestaurantId) {
        if (storedRestaurantId.startsWith('ChIJ') || storedRestaurantId.startsWith('temp_')) {
          validPlaceId = storedRestaurantId;
        } else {
          // Stored ID is a Firestore document ID, generate temp ID instead
          console.warn('⚠️ Ignoring Firestore document ID in favorite reconstruction:', storedRestaurantId, 'for restaurant:', restaurantName);
        }
      }
      
      // If no valid ID, generate temp ID from name and location
      if (!validPlaceId && restaurantName && restaurantLocation) {
        const lat = restaurantLocation.lat || 0;
        const lng = restaurantLocation.lng || 0;
        validPlaceId = `temp_${restaurantName.replace(/\s+/g, '_').toLowerCase()}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
      }
      
      const reconstructed = {
        // Only set id if it's a valid Google Place ID or temp ID
        ...(validPlaceId ? { id: validPlaceId } : {}),
        place_id: validPlaceId || 'unknown', // Always set place_id
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
      
      return reconstructed;
    });
  };

  const getRecentlyRemovedRestaurants = () => {
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
