import React from 'react';
import './BottomNavigation.css';

const BottomNavigation = ({ activeTab, onTabChange, isAdmin = false }) => {
  const baseTabs = [
    {
      id: 'discover',
      icon: '🧭',
      label: 'Discover',
      color: '#CC0001'
    },
    {
      id: 'search',
      icon: '🔍',
      label: 'Search',
      color: '#9E9E9E'
    },
    {
      id: 'add',
      icon: '➕',
      label: 'Add',
      color: '#CC0001',
      isElevated: true
    },
    {
      id: 'favorites',
      icon: '⭐',
      label: 'Favorites',
      color: '#9E9E9E'
    },
    {
      id: 'user',
      icon: '👤',
      label: 'User',
      color: '#9E9E9E'
    }
  ];

  // Add admin tab only if user is admin
  const adminTab = {
    id: 'admin',
    icon: '📊',
    label: 'Admin',
    color: '#9E9E9E'
  };

  const tabs = isAdmin ? [...baseTabs, adminTab] : baseTabs;

  return (
    <div className="bottom-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-tab ${tab.isElevated ? 'elevated' : ''} ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          style={{
            color: activeTab === tab.id ? tab.color : '#9E9E9E'
          }}
        >
          <div className="nav-icon">
            {tab.icon}
          </div>
          <div className="nav-label">
            {tab.label}
          </div>
        </button>
      ))}
    </div>
  );
};

export default BottomNavigation;
