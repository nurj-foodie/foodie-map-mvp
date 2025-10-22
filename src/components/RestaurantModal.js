import React from 'react';
import ExpandableRestaurantCard from './ExpandableRestaurantCard';
import './RestaurantModal.css';

const RestaurantModal = ({ isOpen, onClose, restaurant }) => {
  if (!isOpen || !restaurant) return null;

  return (
    <div className="restaurant-modal-overlay" onClick={onClose}>
      <div className="restaurant-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header with back button */}
        <div className="restaurant-modal-header">
          <button className="back-button" onClick={onClose}>
            ← Back
          </button>
          <h2 className="restaurant-modal-title">{restaurant.name}</h2>
        </div>

        {/* Restaurant details */}
        <div className="restaurant-modal-body">
          <ExpandableRestaurantCard
            restaurant={restaurant}
            onViewDetails={(restaurant) => {
              console.log('View details for:', restaurant.name);
            }}
            onAddReview={(restaurant) => {
              console.log('Add review for:', restaurant.name);
            }}
            onShare={(restaurant) => {
              console.log('Share restaurant:', restaurant.name);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RestaurantModal;
