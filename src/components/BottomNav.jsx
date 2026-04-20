import { FileText, Plus, Settings } from 'lucide-react';

const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'notes', icon: FileText, label: 'Notes' },
    { id: 'new', icon: Plus, label: 'New' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <tab.icon size={24} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;