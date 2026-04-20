import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, LogOut, Cloud, Loader } from 'lucide-react';
import { useNotes } from '../context/NotesContext';

const Settings = () => {
  const { user, signInGoogle, signOut, syncing } = useNotes();
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.photoURL]);

  return (
    <div className="settings-container">
      <h1 className="note-list-title" style={{ marginBottom: 24 }}>Settings</h1>

      <div className="settings-section">
        <div className="settings-section-title">Account</div>
        
        {user ? (
          <div className="settings-row">
            <div className="user-info">
              <div className="user-avatar">
                {user.photoURL && !avatarError ? (
                  <img 
                    src={user.photoURL} 
                    alt="" 
                    style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  user.email?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div>
                <div className="settings-label">{user.displayName || 'User'}</div>
                <div className="user-email">{user.email || 'Anonymous'}</div>
              </div>
            </div>
            <button className="btn btn-ghost" onClick={signOut}>
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="settings-row">
            <div className="settings-label">Sign in with Google</div>
            <button className="btn btn-primary" onClick={signInGoogle}>
              <User size={18} />
              Sign In
            </button>
          </div>
        )}
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Sync</div>
        
        <div className="settings-row">
          <div className="sync-status">
            <div className={`sync-dot ${syncing ? 'syncing' : 'online'}`}></div>
            <span>{syncing ? 'Syncing...' : 'Connected'}</span>
          </div>
          <Cloud size={20} color="var(--text-muted)" />
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">About</div>
        
        <div className="settings-row">
          <span className="settings-label">Version</span>
          <span className="settings-value">1.0.0</span>
        </div>
        
        <div className="settings-row">
          <span className="settings-label">App Name</span>
          <span className="settings-value">BitNote</span>
        </div>
      </div>

      <div className="settings-footer">
        BitNote is a product provided by Wildbits Industries
      </div>
    </div>
  );
};

export default Settings;