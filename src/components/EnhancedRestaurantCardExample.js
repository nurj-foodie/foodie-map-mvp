import React from 'react';
import EnhancedRestaurantCard from './EnhancedRestaurantCard';

// Example of how to integrate Enhanced Restaurant Card into your existing app
const EnhancedRestaurantCardExample = () => {
  // Sample restaurant data with enhanced rating system
  const sampleRestaurant = {
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
      'https://example.com/user_photo1.jpg',
      'https://example.com/user_photo2.jpg'
    ],
    photos: [
      'https://example.com/google_photo1.jpg'
    ],
    priceLevel: '$$',
    operatingHours: {
      isOpen: true,
      hours: '6:00 AM - 2:00 PM'
    },
    totalCheckIns: 15,
    userPhotos: [
      'https://example.com/user_photo1.jpg',
      'https://example.com/user_photo2.jpg'
    ]
  };

  // Event handlers
  const handleViewDetails = (restaurant) => {
    console.log('View details for:', restaurant.name);
    // Navigate to restaurant details page
    // Example: navigate(`/restaurant/${restaurant.id}`);
  };

  const handleAddReview = (restaurant) => {
    console.log('Add review for:', restaurant.name);
    // Open review form modal
    // Example: setShowReviewForm(true);
  };

  const handleShare = (restaurant) => {
    console.log('Share restaurant:', restaurant.name);
    // Implement sharing functionality
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

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Enhanced Restaurant Card Example</h2>
      <p>This shows how the enhanced restaurant card displays:</p>
      <ul>
        <li>✅ User-uploaded photos first</li>
        <li>✅ Combined star + number ratings</li>
        <li>✅ Category rating breakdown</li>
        <li>✅ Verification badges</li>
        <li>✅ Mobile-responsive design</li>
      </ul>
      
      <EnhancedRestaurantCard
        restaurant={sampleRestaurant}
        onViewDetails={handleViewDetails}
        onAddReview={handleAddReview}
        onShare={handleShare}
      />
    </div>
  );
};

export default EnhancedRestaurantCardExample;
