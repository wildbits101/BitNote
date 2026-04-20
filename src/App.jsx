import { useState, useCallback } from 'react';
import { NotesProvider, useNotes } from './context/NotesContext';
import NoteList from './components/NoteList';
import Editor from './components/Editor';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import { LogIn } from 'lucide-react';
import './styles/global.css';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

function SignInScreen() {
  const { signInGoogle } = useNotes();

  return (
    <div className="signin-screen">
      <div className="signin-content">
        <img src="/images/logo.png" alt="BitNote" className="signin-logo" />
        <h1>BitNote</h1>
        <p>Your notes, secured</p>
        <button className="btn btn-primary signin-btn" onClick={signInGoogle}>
          <LogIn size={20} />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { saveNote, user, loading } = useNotes();
  const [activeTab, setActiveTab] = useState('notes');
  const [selectedNote, setSelectedNote] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleNewNote = useCallback(async () => {
    const newNote = {
      id: generateId(),
      title: 'Untitled',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSelectedNote(newNote);
    setIsCreating(true);
    
    if (user) {
      await saveNote(newNote);
    }
  }, [user, saveNote]);

  const handleSelectNote = useCallback((note) => {
    setSelectedNote(note);
    setIsCreating(false);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedNote(null);
    setIsCreating(false);
    setActiveTab('notes');
  }, []);

  const handleTabChange = useCallback((tab) => {
    if (tab === 'new') {
      handleNewNote();
    } else {
      setActiveTab(tab);
      if (tab === 'notes') {
        setSelectedNote(null);
        setIsCreating(false);
      }
    }
  }, [handleNewNote]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-screen">
          <img src="/images/logo.png" alt="BitNote" className="loading-logo" />
          <p>Loading...</p>
        </div>
      );
    }

    if (!user) {
      return <SignInScreen />;
    }

    if (selectedNote) {
      return (
        <Editor
          note={selectedNote}
          onBack={handleBack}
          isNew={isCreating}
        />
      );
    }

    switch (activeTab) {
      case 'notes':
        return (
          <NoteList
            onSelectNote={handleSelectNote}
            onNewNote={handleNewNote}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return (
          <NoteList
            onSelectNote={handleSelectNote}
            onNewNote={handleNewNote}
          />
        );
    }
  };

  return (
    <div className="app">
      <main className="main-content">
        {renderContent()}
      </main>
      {!selectedNote && user && !loading && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <NotesProvider>
      <AppContent />
    </NotesProvider>
  );
}

export default App;