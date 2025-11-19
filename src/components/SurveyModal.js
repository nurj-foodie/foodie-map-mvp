import React, { useState, useEffect } from 'react';
import { surveyService } from '../services/surveyService';
import './SurveyModal.css';

/**
 * Survey Modal Component
 * 
 * Displays survey form for beta phase users.
 * Captures: Device (iOS/Android), Drive frequency, Corridor
 * Awards +50 K-Coins on completion.
 */
const SurveyModal = ({ isOpen, onClose, waitlistId, userEmail, userName }) => {
  const [device, setDevice] = useState('');
  const [driveFrequency, setDriveFrequency] = useState('');
  const [corridor, setCorridor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [surveyStatus, setSurveyStatus] = useState(null);

  useEffect(() => {
    if (isOpen && waitlistId) {
      loadSurveyStatus();
    }
  }, [isOpen, waitlistId]);

  /**
   * Load survey status
   */
  const loadSurveyStatus = async () => {
    try {
      const status = await surveyService.getSurveyStatus(waitlistId);
      setSurveyStatus(status);

      if (status.success && status.completed && status.surveyData) {
        // Pre-fill form if already completed
        setDevice(status.surveyData.device || '');
        setDriveFrequency(status.surveyData.driveFrequency || '');
        setCorridor(status.surveyData.corridor || '');
        setSuccess(true);
      }
    } catch (error) {
      console.error('Error loading survey status:', error);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!device || !driveFrequency || !corridor.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const result = await surveyService.submitSurvey(waitlistId, {
        device,
        driveFrequency,
        corridor: corridor.trim()
      });

      if (result.success) {
        setSuccess(true);
        // Reload survey status
        await loadSurveyStatus();
        
        // Notify parent component that survey was completed
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('surveyCompleted'));
        }
        
        // Trigger K-Coins refresh with a small delay to ensure transaction is committed
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('kcoinsRefresh'));
        }, 500);
        
        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(result.error || 'Failed to submit survey');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      setError(error.message || 'Failed to submit survey');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="survey-modal-overlay" onClick={onClose}>
      <div className="survey-modal" onClick={(e) => e.stopPropagation()}>
        <div className="survey-modal-header">
          <h2>📋 Quick Survey</h2>
          <button className="survey-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="survey-modal-content">
          {success ? (
            <div className="survey-success">
              <div className="success-icon">✅</div>
              <h3>Survey Completed!</h3>
              <p>Thank you for your feedback! <strong>+50 K-Coins</strong> have been added to your account.</p>
              <p className="success-note">This helps us prioritize features and routes that matter most to you.</p>
            </div>
          ) : (
            <>
              <p className="survey-intro">
                Help us understand your travel habits and earn <strong>50 K-Coins</strong>! 
                This survey takes less than 30 seconds.
              </p>

              <form onSubmit={handleSubmit} className="survey-form">
                {/* Device Selector */}
                <div className="survey-field">
                  <label>What device will you use? *</label>
                  <div className="survey-options">
                    <button
                      type="button"
                      className={`survey-option ${device === 'iOS' ? 'selected' : ''}`}
                      onClick={() => setDevice('iOS')}
                    >
                      📱 iOS
                    </button>
                    <button
                      type="button"
                      className={`survey-option ${device === 'Android' ? 'selected' : ''}`}
                      onClick={() => setDevice('Android')}
                    >
                      🤖 Android
                    </button>
                  </div>
                </div>

                {/* Drive Frequency Selector */}
                <div className="survey-field">
                  <label>How often do you drive? *</label>
                  <div className="survey-options">
                    <button
                      type="button"
                      className={`survey-option ${driveFrequency === 'weekly' ? 'selected' : ''}`}
                      onClick={() => setDriveFrequency('weekly')}
                    >
                      🚗 Weekly
                    </button>
                    <button
                      type="button"
                      className={`survey-option ${driveFrequency === 'monthly' ? 'selected' : ''}`}
                      onClick={() => setDriveFrequency('monthly')}
                    >
                      🛣️ Monthly
                    </button>
                    <button
                      type="button"
                      className={`survey-option ${driveFrequency === 'occasional' ? 'selected' : ''}`}
                      onClick={() => setDriveFrequency('occasional')}
                    >
                      🎯 Occasional
                    </button>
                  </div>
                </div>

                {/* Corridor Input */}
                <div className="survey-field">
                  <label htmlFor="corridor">Your usual corridor? *</label>
                  <p className="field-hint">e.g., KL ↔ Penang, Kluang ↔ JB, etc.</p>
                  <input
                    id="corridor"
                    type="text"
                    value={corridor}
                    onChange={(e) => setCorridor(e.target.value)}
                    placeholder="Enter your most common route"
                    className="survey-input"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="survey-error">
                    {error}
                  </div>
                )}

                <div className="survey-actions">
                  <button
                    type="button"
                    onClick={onClose}
                    className="survey-btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="survey-btn-primary"
                    disabled={loading || !device || !driveFrequency || !corridor.trim()}
                  >
                    {loading ? 'Submitting...' : 'Submit & Get +50 K-Coins'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyModal;

