import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import ExpandableRestaurantCard from './ExpandableRestaurantCard';
import AddReviewModal from './AddReviewModal';
import EditRestaurantModal from './EditRestaurantModal';
import './RestaurantModal.css';

const RestaurantModal = ({ isOpen, onClose, restaurant }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [fullRestaurantData, setFullRestaurantData] = useState(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(false);

  // Function to fetch restaurant data from Firestore
  const fetchRestaurantFromFirestore = useCallback(async () => {
    if (!restaurant) {
      setFullRestaurantData(null);
      return;
    }

    // Get restaurant ID (support both place_id and id)
    const restaurantId = restaurant.place_id || restaurant.placeId || restaurant.id;
    
    if (!restaurantId) {
      console.warn('⚠️ No restaurant ID found, using provided restaurant data');
      setFullRestaurantData(restaurant);
      return;
    }

    setIsLoadingRestaurant(true);
    try {
      console.log('🔍 Fetching full restaurant data from Firestore:', restaurantId);
      
      // Try to fetch from 'eateries' collection
      const restaurantRef = doc(db, 'eateries', restaurantId);
      const restaurantSnap = await getDoc(restaurantRef);
      
      if (restaurantSnap.exists()) {
        const firestoreData = restaurantSnap.data();
        console.log('✅ Fetched restaurant from Firestore:', {
          name: firestoreData.name,
          userPhotosCount: firestoreData.userPhotos?.length || 0,
          photosCount: firestoreData.photos?.length || 0
        });
        
        // Merge Firestore data with provided restaurant data (Firestore takes precedence)
        setFullRestaurantData({
          ...restaurant,
          ...firestoreData,
          id: restaurantSnap.id,
          // Ensure we keep the restaurant ID from the original prop
          place_id: restaurantId,
          placeId: restaurantId
        });
      } else {
        console.log('ℹ️ Restaurant not found in Firestore, using provided data');
        setFullRestaurantData(restaurant);
      }
    } catch (error) {
      console.error('❌ Error fetching restaurant from Firestore:', error);
      // Fallback to provided restaurant data
      setFullRestaurantData(restaurant);
    } finally {
      setIsLoadingRestaurant(false);
    }
  }, [restaurant]);

  // Fetch full restaurant data from Firestore when modal opens
  useEffect(() => {
    if (isOpen && restaurant) {
      fetchRestaurantFromFirestore();
    } else {
      setFullRestaurantData(null);
    }
  }, [isOpen, restaurant, fetchRestaurantFromFirestore]);

  // Use full restaurant data if available, otherwise use provided restaurant
  const displayRestaurant = fullRestaurantData || restaurant;

  if (!isOpen || !restaurant) return null;

  const handleAddReview = () => {
    console.log('📝 Add Review button clicked');
    console.log('📝 Current showReviewModal state:', showReviewModal);
    setShowReviewModal(true);
    console.log('📝 Set showReviewModal to true');
  };

  const handleShare = async () => {
    const shareRestaurant = displayRestaurant || restaurant;
    const shareData = {
      title: shareRestaurant.name || shareRestaurant.displayName || 'Restaurant',
      text: `Check out ${shareRestaurant.name || shareRestaurant.displayName || 'Restaurant'} - ${shareRestaurant.address || ''}`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        const text = `${shareRestaurant.name || shareRestaurant.displayName || 'Restaurant'}\n${shareRestaurant.address || ''}\n${window.location.href}`;
        await navigator.clipboard.writeText(text);
        alert('✅ Restaurant info copied to clipboard!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        // Fallback: Copy to clipboard
        try {
          const text = `${shareRestaurant.name || shareRestaurant.displayName || 'Restaurant'}\n${shareRestaurant.address || ''}\n${window.location.href}`;
          await navigator.clipboard.writeText(text);
          alert('✅ Restaurant info copied to clipboard!');
        } catch (clipboardError) {
          console.error('Failed to copy to clipboard:', clipboardError);
          alert('Failed to share. Please try again.');
        }
      }
    }
  };

  const handleReviewSubmitted = () => {
    // Reload reviews in ExpandableRestaurantCard if needed
    // The component will reload when section is expanded again
    setShowReviewModal(false);
  };

  const handleEdit = () => {
    const editRestaurant = displayRestaurant || restaurant;
    console.log('✏️ Opening edit modal for:', editRestaurant.name || editRestaurant.displayName);
    setShowEditModal(true);
  };

  const handleEditSubmitted = () => {
    // Reload restaurant data after edit is submitted to show new photos/changes
    console.log('🔄 Reloading restaurant data after edit submission');
    fetchRestaurantFromFirestore();
    setShowEditModal(false);
  };

  return (
    <>
      <div className="restaurant-modal-overlay" onClick={onClose}>
        <div className="restaurant-modal-content" onClick={(e) => e.stopPropagation()}>
          {/* Header with back button */}
          <div className="restaurant-modal-header">
            <button className="back-button" onClick={onClose}>
              ← Back
            </button>
            <h2 className="restaurant-modal-title">{displayRestaurant.name || displayRestaurant.displayName || 'Restaurant'}</h2>
          </div>

          {/* Restaurant details */}
          <div className="restaurant-modal-body">
            {isLoadingRestaurant ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="loading-spinner"></div>
                <p>Loading restaurant details...</p>
              </div>
            ) : (
              <ExpandableRestaurantCard
                restaurant={displayRestaurant}
                onViewDetails={(restaurant) => {
                  // Already viewing details, do nothing
                }}
                onAddReview={handleAddReview}
                onShare={handleShare}
                onEdit={handleEdit}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add Review Modal */}
      <AddReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        restaurant={displayRestaurant}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Edit Restaurant Modal */}
      <EditRestaurantModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        restaurant={displayRestaurant}
        onEditSubmitted={handleEditSubmitted}
      />
    </>
  );
};

export default RestaurantModal;
