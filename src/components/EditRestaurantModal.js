import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { restaurantEditService } from '../services/restaurantEditService';
import './EditRestaurantModal.css';

const EditRestaurantModal = ({ isOpen, onClose, restaurant, onEditSubmitted }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('photos'); // photos, hours, name, closed, other
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit form state
  const [newPhotos, setNewPhotos] = useState([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedHours, setEditedHours] = useState(null);
  const [markAsClosed, setMarkAsClosed] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    // Only initialize when modal opens, not on every restaurant prop change
    if (isOpen && restaurant) {
      try {
        console.log('✏️ EditRestaurantModal opened for:', restaurant.name || restaurant.displayName);
        
        // Initialize form with current restaurant data
        const restaurantName = restaurant.name || restaurant.displayName || '';
        const isClosed = restaurant.businessStatus === 'CLOSED_PERMANENTLY' || restaurant.isActive === false;
        
        setEditedName(restaurantName);
        setMarkAsClosed(isClosed);
      
        // Initialize operating hours if exists
        if (restaurant.operatingHours && restaurant.operatingHours.periods) {
          // Convert Firestore format to edit format
          const dayMap = {
            0: 'Sunday',
            1: 'Monday',
            2: 'Tuesday',
            3: 'Wednesday',
            4: 'Thursday',
            5: 'Friday',
            6: 'Saturday'
          };

          const convertTimeFromFirestore = (timeStr) => {
            // Convert "0800" to "08:00" or "2200" to "22:00"
            if (!timeStr || timeStr.length !== 4) return '09:00';
            return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
          };

          const periods = [];
          for (let day = 0; day < 7; day++) {
            const period = restaurant.operatingHours.periods.find(p => p.day === day);
            periods.push({
              day: dayMap[day],
              open: period ? convertTimeFromFirestore(period.openTime) : '09:00',
              close: period ? convertTimeFromFirestore(period.closeTime) : '22:00',
              isClosed: !period
            });
          }
          setEditedHours({
            isOpen24Hours: restaurant.operatingHours.isOpen24Hours || false,
            periods
          });
        } else {
          // Default hours if not set
          setEditedHours({
            isOpen24Hours: false,
            periods: [
              { day: 'Monday', open: '09:00', close: '22:00', isClosed: false },
              { day: 'Tuesday', open: '09:00', close: '22:00', isClosed: false },
              { day: 'Wednesday', open: '09:00', close: '22:00', isClosed: false },
              { day: 'Thursday', open: '09:00', close: '22:00', isClosed: false },
              { day: 'Friday', open: '09:00', close: '22:00', isClosed: false },
              { day: 'Saturday', open: '09:00', close: '22:00', isClosed: false },
              { day: 'Sunday', open: '09:00', close: '22:00', isClosed: false }
            ]
          });
        }
        
        // Reset form state
        setNewPhotos([]);
        setReason('');
        setError('');
        setSuccess('');
      } catch (error) {
        console.error('❌ Error initializing EditRestaurantModal:', error);
        setError('Failed to load restaurant data. Please try again.');
      }
    } else if (!isOpen) {
      // Reset state when modal closes
      setNewPhotos([]);
      setEditedName('');
      setEditedHours(null);
      setMarkAsClosed(false);
      setReason('');
      setError('');
      setSuccess('');
    }
    // Only depend on isOpen and restaurant.id to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, restaurant?.id || restaurant?.place_id || restaurant?.placeId]);

  if (!isOpen || !restaurant) {
    return null;
  }

  // Handle photo upload
  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const MAX_PHOTOS = 10;
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB for base64

    if (newPhotos.length + files.length > MAX_PHOTOS) {
      alert(`Maximum ${MAX_PHOTOS} photos allowed. You currently have ${newPhotos.length} photos.`);
      return;
    }

    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      alert('Some files are too large. Maximum file size is 2MB. Please compress or resize your photos.');
      return;
    }

    setIsUploadingPhotos(true);

    try {
      const newPhotoObjects = [];

      for (const file of files) {
        // Compress image
        const compressedFile = await compressImage(file);

        // Convert to base64
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = (e) => {
            newPhotoObjects.push({
              id: Date.now() + Math.random(),
              name: file.name,
              size: compressedFile.size,
              type: compressedFile.type,
              data: e.target.result, // Base64 string
              uploadedAt: new Date()
            });
            resolve();
          };
          reader.readAsDataURL(compressedFile);
        });
      }

      setNewPhotos(prev => [...prev, ...newPhotoObjects]);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Error uploading photos. Please try again.');
    } finally {
      setIsUploadingPhotos(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Compress image
  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(resolve, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Remove photo
  const removePhoto = (photoId) => {
    setNewPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  // Handle operating hours change
  const handleHoursChange = (dayIndex, field, value) => {
    setEditedHours(prev => ({
      ...prev,
      periods: prev.periods.map((period, index) =>
        index === dayIndex ? { ...period, [field]: value } : period
      )
    }));
  };

  // Submit edit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError('Please sign in to submit edits');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Determine edit type and build proposed changes
      const proposedChanges = {};
      let editType = 'general';

      // Photos
      if (activeTab === 'photos' && newPhotos.length > 0) {
        proposedChanges.photos = newPhotos;
        editType = 'photos';
      }

      // Operating Hours
      if (activeTab === 'hours' && editedHours) {
        // Convert to Firestore format
        const dayMap = {
          'Monday': 1,
          'Tuesday': 2,
          'Wednesday': 3,
          'Thursday': 4,
          'Friday': 5,
          'Saturday': 6,
          'Sunday': 0
        };

        const convertTimeToFirestore = (timeStr) => {
          if (!timeStr) return null;
          return timeStr.replace(':', '').padStart(4, '0');
        };

        const firestorePeriods = editedHours.periods
          .filter(period => !period.isClosed)
          .map(period => ({
            day: dayMap[period.day] !== undefined ? dayMap[period.day] : 0,
            openTime: convertTimeToFirestore(period.open) || '0800',
            closeTime: convertTimeToFirestore(period.close) || '2200'
          }));

        proposedChanges.operatingHours = {
          isOpen24Hours: editedHours.isOpen24Hours,
          periods: firestorePeriods,
          timezone: 'Asia/Kuala_Lumpur'
        };
        editType = 'hours';
      }

      // Name
      const currentName = restaurant.name || restaurant.displayName || '';
      if (activeTab === 'name' && editedName.trim() && editedName.trim() !== currentName) {
        proposedChanges.name = editedName.trim();
        editType = 'name';
      }

      // Closed status
      if (activeTab === 'closed') {
        proposedChanges.businessStatus = markAsClosed ? 'CLOSED_PERMANENTLY' : 'OPERATIONAL';
        proposedChanges.isActive = !markAsClosed;
        editType = 'closed';
      }

      // Check if there are any changes
      if (Object.keys(proposedChanges).length === 0) {
        setError('No changes detected. Please make some edits before submitting.');
        setIsSubmitting(false);
        return;
      }

      // Submit edit
      const result = await restaurantEditService.submitEdit(user.uid, restaurant, {
        ...proposedChanges,
        editType,
        reason: reason.trim() || 'User submitted edit',
        userName: user.displayName || user.email || 'Anonymous'
      });

      if (result.success) {
        setSuccess('✅ Edit submitted successfully! It will be reviewed by an admin before changes are applied.');
        
        // Reset form
        setNewPhotos([]);
        setEditedName(restaurant.name || restaurant.displayName || '');
        setReason('');
        
        // Notify parent
        if (onEditSubmitted) {
          onEditSubmitted(result.edit);
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit edit. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting edit:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'photos':
        return (
          <div className="edit-tab-content">
            <h4>Add New Photos</h4>
            <p className="edit-hint">Add photos to help others discover this restaurant. Photos will be reviewed by admin.</p>
            
            <div className="photo-upload-section">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                disabled={isUploadingPhotos || isSubmitting}
                style={{ display: 'none' }}
                id="photo-upload-input"
              />
              <label htmlFor="photo-upload-input" className="photo-upload-button">
                {isUploadingPhotos ? '📤 Uploading...' : '📷 Add Photos'}
              </label>
              <p className="photo-hint">Max 10 photos • 2MB per photo • JPG, PNG, GIF</p>
            </div>

            {newPhotos.length > 0 && (
              <div className="uploaded-photos-preview">
                {newPhotos.map((photo) => (
                  <div key={photo.id} className="photo-preview-item">
                    <img src={photo.data} alt="Preview" />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="remove-photo-btn"
                      disabled={isSubmitting}
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'hours':
        return (
          <div className="edit-tab-content">
            <h4>Edit Operating Hours</h4>
            <p className="edit-hint">Update the restaurant's operating hours. Changes will be reviewed by admin.</p>

            {editedHours && (
              <>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={editedHours.isOpen24Hours}
                      onChange={(e) => setEditedHours(prev => ({ ...prev, isOpen24Hours: e.target.checked }))}
                      disabled={isSubmitting}
                    />
                    Open 24 Hours
                  </label>
                </div>

                {!editedHours.isOpen24Hours && (
                  <div className="operating-hours-edit">
                    {editedHours.periods.map((period, index) => (
                      <div key={index} className="day-hours-row">
                        <div className="day-name">{period.day}</div>
                        <div className="hours-controls">
                          <label>
                            <input
                              type="checkbox"
                              checked={period.isClosed}
                              onChange={(e) => handleHoursChange(index, 'isClosed', e.target.checked)}
                              disabled={isSubmitting}
                            />
                            Closed
                          </label>
                          {!period.isClosed && (
                            <>
                              <input
                                type="time"
                                value={period.open}
                                onChange={(e) => handleHoursChange(index, 'open', e.target.value)}
                                disabled={isSubmitting}
                              />
                              <span>to</span>
                              <input
                                type="time"
                                value={period.close}
                                onChange={(e) => handleHoursChange(index, 'close', e.target.value)}
                                disabled={isSubmitting}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'name':
        return (
          <div className="edit-tab-content">
            <h4>Edit Restaurant Name</h4>
            <p className="edit-hint">Current name: <strong>{restaurant.name || restaurant.displayName || 'Unknown'}</strong></p>
            
            <div className="form-group">
              <label htmlFor="edited-name">New Name</label>
              <input
                id="edited-name"
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter new restaurant name"
                disabled={isSubmitting}
                maxLength={100}
              />
            </div>
          </div>
        );

      case 'closed':
        return (
          <div className="edit-tab-content">
            <h4>Mark as Closed</h4>
            <p className="edit-hint">Mark this restaurant as permanently closed if it no longer exists.</p>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={markAsClosed}
                  onChange={(e) => setMarkAsClosed(e.target.checked)}
                  disabled={isSubmitting}
                />
                This restaurant is permanently closed
              </label>
            </div>

            {markAsClosed && (
              <div className="form-group">
                <label htmlFor="close-reason">Reason (Optional)</label>
                <textarea
                  id="close-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this restaurant closed? (e.g., 'Closed down', 'Moved location', etc.)"
                  rows={3}
                  disabled={isSubmitting}
                  maxLength={500}
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="edit-restaurant-modal-overlay" onClick={onClose}>
      <div className="edit-restaurant-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-restaurant-modal-header">
          <h2>✏️ Edit Restaurant Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="edit-restaurant-info">
          <h3>{restaurant.name}</h3>
          <p>{restaurant.address || 'Address not available'}</p>
        </div>

        {/* Tabs */}
        <div className="edit-tabs">
          <button
            className={`edit-tab ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
            disabled={isSubmitting}
          >
            📷 Photos
          </button>
          <button
            className={`edit-tab ${activeTab === 'hours' ? 'active' : ''}`}
            onClick={() => setActiveTab('hours')}
            disabled={isSubmitting}
          >
            🕒 Hours
          </button>
          <button
            className={`edit-tab ${activeTab === 'name' ? 'active' : ''}`}
            onClick={() => setActiveTab('name')}
            disabled={isSubmitting}
          >
            📝 Name
          </button>
          <button
            className={`edit-tab ${activeTab === 'closed' ? 'active' : ''}`}
            onClick={() => setActiveTab('closed')}
            disabled={isSubmitting}
          >
            🚫 Closed
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-restaurant-form">
          {error && (
            <div className="edit-error">
              {error}
            </div>
          )}

          {success && (
            <div className="edit-success">
              {success}
            </div>
          )}

          {renderTabContent()}

          {/* Reason field (for all edits) */}
          {activeTab !== 'closed' && (
            <div className="form-group">
              <label htmlFor="edit-reason">Reason for Edit (Optional)</label>
              <textarea
                id="edit-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you making this edit? (e.g., 'Hours changed', 'New photos available', etc.)"
                rows={2}
                disabled={isSubmitting}
                maxLength={500}
              />
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Edit'}
            </button>
          </div>

          <p className="admin-note">
            ℹ️ All edits require admin verification before changes are applied. You'll receive +5 XP for submitting edits.
          </p>
        </form>
      </div>
    </div>
  );
};

export default EditRestaurantModal;

