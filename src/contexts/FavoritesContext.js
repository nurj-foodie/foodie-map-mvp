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

// Helper function: Extract restaurant ID consistently
const extractRestaurantId = (restaurant) => {
  if (!restaurant) return null;
  
  // Prioritize place_id over id to avoid Firestore document ID conflicts
  let restaurantId = restaurant.place_id || restaurant.placeId;
  
  // Only use restaurant.id if it looks like a Google Place ID or temp ID
  if (!restaurantId && restaurant.id) {
    if (restaurant.id.startsWith('ChIJ') || restaurant.id.startsWith('temp_')) {
      restaurantId = restaurant.id;
    }
  }
  
  // If no ID exists, generate a temporary one based on name and location
  if (!restaurantId && restaurant.name) {
    const lat = restaurant.geometry?.location?.lat || restaurant.location?.lat || restaurant.lat || 0;
    const lng = restaurant.geometry?.location?.lng || restaurant.location?.lng || restaurant.lng || 0;
    restaurantId = `temp_${restaurant.name.replace(/\s+/g, '_').toLowerCase()}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
  }
  
  return restaurantId;
};

export const FavoritesProvider = ({ children }) => {
  const authContext = useAuth();
  const user = authContext?.user;
  const authLoading = authContext?.loading;
  const [favorites, setFavorites] = useState([]);
  const [removedFavorites, setRemovedFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [pendingOperations, setPendingOperations] = useState(new Set()); // Prevent double-clicks

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

  // ✨ OPTIMISTIC UI: Toggle favorite with instant feedback
  const toggleFavorite = async (restaurant) => {
    if (!user) {
      return { success: false, error: 'Please sign in to manage favorites' };
    }

    // Extract restaurant ID
    const restaurantId = extractRestaurantId(restaurant);
    
    if (!restaurantId) {
      console.error('❌ No valid restaurant ID found:', restaurant);
      return { success: false, error: 'Invalid restaurant data' };
    }

    // Prevent concurrent operations on same restaurant (double-click protection)
    if (pendingOperations.has(restaurantId)) {
      console.log('⏳ Operation already in progress for:', restaurantId);
      return { success: false, error: 'Operation in progress' };
    }

    // Mark operation as pending
    setPendingOperations(prev => new Set(prev).add(restaurantId));

    // Check current state
    const isCurrentlyLiked = favoriteIds.has(restaurantId);
    
    // Find the favorite data if it exists
    const existingFavorite = favorites.find(
      f => (f.restaurantId || f.eateryId) === restaurantId
    );

    try {
      // ===== OPTIMISTIC UPDATE (INSTANT - 0ms) =====
      if (isCurrentlyLiked) {
        // UNLIKING: Move to recently removed (soft delete)
        console.log('🔽 Optimistically unliking:', restaurant.name || restaurant.displayName);
        
        // Remove from active favorites
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(restaurantId);
          return newSet;
        });
        
        setFavorites(prev => 
          prev.filter(f => (f.restaurantId || f.eateryId) !== restaurantId)
        );
        
        // Add to recently removed (preserve soft delete functionality)
        const favoriteToRemove = existingFavorite || {
          restaurantId: restaurantId,
          restaurantData: restaurant,
          restaurantName: restaurant.name || restaurant.displayName,
          restaurantAddress: restaurant.vicinity || restaurant.formatted_address,
          restaurantRating: restaurant.rating,
          restaurantLocation: {
            lat: restaurant.geometry?.location?.lat || restaurant.location?.lat || restaurant.lat || 0,
            lng: restaurant.geometry?.location?.lng || restaurant.location?.lng || restaurant.lng || 0,
          }
        };
        
        setRemovedFavorites(prev => [...prev, {
          ...favoriteToRemove,
          id: favoriteToRemove.id || `temp-${restaurantId}`,
          removedAt: new Date(), // Optimistic timestamp
        }]);
        
      } else {
        // LIKING: Add to active favorites or restore from recently removed
        console.log('🔼 Optimistically liking:', restaurant.name || restaurant.displayName);
        
        // Check if restoring from recently removed
        const wasRecentlyRemoved = removedFavorites.find(
          f => (f.restaurantId || f.eateryId) === restaurantId
        );
        
        if (wasRecentlyRemoved) {
          // Remove from recently removed
          setRemovedFavorites(prev => 
            prev.filter(f => (f.restaurantId || f.eateryId) !== restaurantId)
          );
        }
        
        // Add to active favorites
        setFavoriteIds(prev => new Set(prev).add(restaurantId));
        
        setFavorites(prev => [...prev, {
          id: `temp-${restaurantId}`, // Temporary until Firebase confirms
          restaurantId: restaurantId,
          restaurantData: restaurant,
          addedAt: wasRecentlyRemoved?.addedAt || new Date(),
          restaurantName: restaurant.name || restaurant.displayName,
          restaurantAddress: restaurant.vicinity || restaurant.formatted_address,
          restaurantRating: restaurant.rating,
          restaurantLocation: {
            lat: restaurant.geometry?.location?.lat || restaurant.location?.lat || restaurant.lat || 0,
            lng: restaurant.geometry?.location?.lng || restaurant.location?.lng || restaurant.lng || 0,
          },
          restaurantTypes: restaurant.types || [],
          restaurantPriceLevel: restaurant.price_level || restaurant.priceLevel || null,
          restaurantPhoto: restaurant.photos?.[0]?.photo_reference || null,
        }]);
      }
      
      // ← AT THIS POINT: USER ALREADY SEES THE CHANGE (instant UI update)
      
      // ===== FIREBASE SYNC (background - user doesn't wait) =====
      console.log('🔄 Syncing to Firebase in background...');
      
      const syncPromise = favoritesService.toggleFavorite(user.uid, restaurant);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase operation timeout')), 10000)
      );
      
      const result = await Promise.race([syncPromise, timeoutPromise]);
      
      if (!result.success) {
        // ===== ROLLBACK ON FAILURE =====
        console.error('❌ Firebase sync failed, reverting optimistic update');
        
        if (isCurrentlyLiked) {
          // Restore to active favorites
          setFavoriteIds(prev => new Set(prev).add(restaurantId));
          setFavorites(prev => [...prev, existingFavorite || {
            restaurantId: restaurantId,
            restaurantData: restaurant,
          }]);
          setRemovedFavorites(prev => 
            prev.filter(f => (f.restaurantId || f.eateryId) !== restaurantId)
          );
        } else {
          // Remove from active favorites
          setFavoriteIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(restaurantId);
            return newSet;
          });
          setFavorites(prev => 
            prev.filter(f => (f.restaurantId || f.eateryId) !== restaurantId)
          );
        }
        
        return { success: false, error: result.error };
      }
      
      // ===== SUCCESS =====
      console.log('✅ Firebase sync successful, local state already updated');
      
      return { 
        success: true, 
        message: isCurrentlyLiked ? 'Removed from favorites' : 'Added to favorites' 
      };
      
    } catch (error) {
      // ===== ERROR HANDLING - Rollback optimistic update =====
      console.error('❌ Error syncing to Firebase:', error);
      
      if (isCurrentlyLiked) {
        // Restore to active favorites
        setFavoriteIds(prev => new Set(prev).add(restaurantId));
        setFavorites(prev => [...prev, existingFavorite || {
          restaurantId: restaurantId,
          restaurantData: restaurant,
        }]);
        setRemovedFavorites(prev => 
          prev.filter(f => (f.restaurantId || f.eateryId) !== restaurantId)
        );
      } else {
        // Remove from active favorites
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(restaurantId);
          return newSet;
        });
        setFavorites(prev => 
          prev.filter(f => (f.restaurantId || f.eateryId) !== restaurantId)
        );
      }
      
      return { 
        success: false, 
        error: error.message === 'Firebase operation timeout' 
          ? 'Operation timeout. Check your connection.' 
          : error.message 
      };
    } finally {
      // Always remove from pending operations
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(restaurantId);
        return newSet;
      });
    }
  };

  // ✨ OPTIMISTIC UI: Restore favorite with instant feedback
  const restoreFavorite = async (favoriteId) => {
    if (!user) {
      return { success: false, error: 'Please sign in to restore favorites' };
    }

    // Find the favorite in removedFavorites
    const favoriteToRestore = removedFavorites.find(f => f.id === favoriteId);
    
    if (!favoriteToRestore) {
      console.error('❌ Favorite not found in recently removed:', favoriteId);
      return { success: false, error: 'Favorite not found' };
    }

    const restaurantId = favoriteToRestore.restaurantId || favoriteToRestore.eateryId;

    // Prevent concurrent operations
    if (pendingOperations.has(restaurantId)) {
      console.log('⏳ Operation already in progress for:', restaurantId);
      return { success: false, error: 'Operation in progress' };
    }

    setPendingOperations(prev => new Set(prev).add(restaurantId));

    try {
      // ===== OPTIMISTIC UPDATE (INSTANT) =====
      console.log('🔼 Optimistically restoring:', favoriteToRestore.restaurantName || 'restaurant');
      
      // Remove from removedFavorites
      setRemovedFavorites(prev => prev.filter(f => f.id !== favoriteId));
      
      // Add to active favorites
      setFavoriteIds(prev => new Set(prev).add(restaurantId));
      setFavorites(prev => [...prev, {
        ...favoriteToRestore,
        removedAt: null, // Remove the removedAt timestamp
      }]);
      
      // ← USER ALREADY SEES THE CHANGE
      
      // ===== FIREBASE SYNC (background) =====
      console.log('🔄 Syncing restore to Firebase in background...');
      
      const result = await favoritesService.restoreFavorite(user.uid, favoriteId);
      
      if (!result.success) {
        // ===== ROLLBACK ON FAILURE =====
        console.error('❌ Firebase restore failed, reverting optimistic update');
        
        setRemovedFavorites(prev => [...prev, favoriteToRestore]);
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(restaurantId);
          return newSet;
        });
        setFavorites(prev => prev.filter(f => (f.restaurantId || f.eateryId) !== restaurantId));
        
        return { success: false, error: result.error };
      }
      
      // ===== SUCCESS =====
      console.log('✅ Firebase restore successful');
      
      return { success: true, message: 'Favorite restored' };
      
    } catch (error) {
      // ===== ERROR HANDLING - Rollback =====
      console.error('❌ Error restoring favorite:', error);
      
      setRemovedFavorites(prev => [...prev, favoriteToRestore]);
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(restaurantId);
        return newSet;
      });
      setFavorites(prev => prev.filter(f => (f.restaurantId || f.eateryId) !== restaurantId));
      
      return { success: false, error: error.message };
    } finally {
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(restaurantId);
        return newSet;
      });
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

