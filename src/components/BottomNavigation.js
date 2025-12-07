import React from 'react';
import './BottomNavigation.css';

const BottomNavigation = ({ activeTab, onTabChange, isAdmin = false }) => {
  const baseTabs = [
    {
      id: 'discover',
      icon: '🧭',
      label: 'Discover'
    },
    {
      id: 'search',
      icon: '🔍',
      label: 'Search'
    },
    {
      id: 'add',
      icon: '➕',
      label: 'Add',
      isElevated: true
    },
    {
      id: 'favorites',
      icon: '⭐',
      label: 'Favorites'
    },
    {
      id: 'user',
      icon: '👤',
      label: 'User'
    }
  ];

  // Add admin tab only if user is admin
  const adminTab = {
    id: 'admin',
    icon: '📊',
    label: 'Admin'
  };

  const tabs = isAdmin ? [...baseTabs, adminTab] : baseTabs;

  return (
    <div className="bottom-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-tab ${tab.isElevated ? 'elevated' : ''} ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <div className="nav-icon">
            {tab.icon}
          </div>
          {tab.id !== 'add' && (
            <div className="nav-label">
              {tab.label}
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default BottomNavigation;
