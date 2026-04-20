import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import VaultSelector from './VaultSelector';

const NoteList = ({ onSelectNote, onNewNote }) => {
  const { notes, loading, vaults, activeVault } = useNotes();
  const [search, setSearch] = useState('');

  const filteredNotes = notes.filter(note => {
    const searchLower = search.toLowerCase();
    return (
      (note.title || '').toLowerCase().includes(searchLower) ||
      (note.content || '').toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getPreview = (content) => {
    if (!content) return 'Empty note';
    return content.replace(/[#*`_~\[\]()]/g, '').slice(0, 100) || 'Empty note';
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Loading...</div>
      </div>
    );
  }

  return (
    <div className="note-list-view">
      <VaultSelector />
      
      <div className="note-list-header">
        <h1 className="note-list-title">
          {activeVault === 'default' ? 'All Notes' : vaults.find(v => v.id === activeVault)?.name || 'Vault'}
        </h1>
      </div>

      <div className="search-bar">
        <FileText size={20} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredNotes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h2 className="empty-state-title">No notes yet</h2>
          <p className="empty-state-text">Create your first note to get started</p>
          <button className="btn btn-primary" onClick={onNewNote}>
            <Plus size={20} />
            Create Note
          </button>
        </div>
      ) : (
        <div className="note-list">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className="note-item"
              onClick={() => onSelectNote(note)}
            >
              <div className="note-item-title">{note.title || 'Untitled'}</div>
              <div className="note-item-preview">{getPreview(note.content)}</div>
              <div className="note-item-date">{formatDate(note.updatedAt)}</div>
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={onNewNote}>
        <Plus size={24} />
      </button>
    </div>
  );
};

export default NoteList;