import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/firebase';

const NotesContext = createContext();

export const useNotes = () => useContext(NotesContext);

const STORAGE_KEY = 'bitnote_notes';

export const NotesProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [vaults, setVaults] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeVault, setActiveVault] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [notesUnsubscribe, setNotesUnsubscribe] = useState(null);
  const [vaultsUnsubscribe, setVaultsUnsubscribe] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        const vaultsRef = collection(db, 'users', firebaseUser.uid, 'vaults');
        
        const unsubscribeVaults = onSnapshot(query(vaultsRef, orderBy('createdAt', 'desc')), (snapshot) => {
          const vaultsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          const hasDefault = vaultsData.some(v => v.id === 'default');
          if (!hasDefault) {
            vaultsData.unshift({ id: 'default', name: 'Notes', createdAt: null });
          }
          
          setVaults(vaultsData);
          
          if (!activeVault) {
            setActiveVault('default');
          }
        });

        setVaultsUnsubscribe(() => unsubscribeVaults);
        setTimeout(() => setLoading(false), 3000);
      } else {
        setUser(null);
        setVaults([]);
        setNotes([]);
        setActiveVault(null);
        setLoading(false);
        localStorage.removeItem(STORAGE_KEY);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !activeVault) return;

    if (notesUnsubscribe) {
      notesUnsubscribe();
    }

    if (activeVault === 'default') {
      const notesRef = collection(db, 'users', user.uid, 'notes');
      let q;
      try {
        q = query(notesRef, orderBy('updatedAt', 'desc'));
      } catch (e) {
        q = notesRef;
      }

      const unsubscribeNotes = onSnapshot(q, (snapshot) => {
        const notesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(n => !n.vaultId || n.vaultId === 'default');
        setNotes(notesData);
        setSyncing(false);
      }, (error) => {
        console.error('Firestore error:', error);
        setNotes([]);
      });

      setNotesUnsubscribe(() => unsubscribeNotes);
    } else {
      const vaultNotesRef = collection(db, 'users', user.uid, 'vaults', activeVault, 'notes');
      let q;
      try {
        q = query(vaultNotesRef, orderBy('updatedAt', 'desc'));
      } catch (e) {
        q = vaultNotesRef;
      }

      const unsubscribeNotes = onSnapshot(q, (snapshot) => {
        const notesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotes(notesData);
        setSyncing(false);
      }, (error) => {
        console.error('Firestore error:', error);
        setNotes([]);
      });

      setNotesUnsubscribe(() => unsubscribeNotes);
    }

    return () => {
      if (notesUnsubscribe) notesUnsubscribe();
    };
  }, [user, activeVault]);

  useEffect(() => {
    if (!loading && user && notes) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes, vaults: vaults.filter(v => v.id !== 'default') }));
    }
  }, [notes, loading, user, vaults]);

  const signInGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      if (notesUnsubscribe) notesUnsubscribe();
      if (vaultsUnsubscribe) vaultsUnsubscribe();
      localStorage.removeItem(STORAGE_KEY);
      setNotes([]);
      setVaults([]);
      setActiveVault(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [notesUnsubscribe, vaultsUnsubscribe]);

  const createVault = useCallback(async (name) => {
    if (!user) return;
    
    const vaultId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const vaultRef = doc(db, 'users', user.uid, 'vaults', vaultId);
    await setDoc(vaultRef, {
      name,
      createdAt: new Date(),
      createdBy: user.uid
    });
    return vaultId;
  }, [user]);

  const deleteVault = useCallback(async (vaultId) => {
    if (!user || vaultId === 'default') return;
    
    const vaultRef = doc(db, 'users', user.uid, 'vaults', vaultId);
    await deleteDoc(vaultRef);
    
    if (activeVault === vaultId) {
      setActiveVault('default');
    }
  }, [user, activeVault]);

  const setActiveVaultById = useCallback((vaultId) => {
    setActiveVault(vaultId);
  }, []);

  const getNoteRef = useCallback((noteId) => {
    if (!user) return null;
    
    if (activeVault === 'default') {
      return doc(db, 'users', user.uid, 'notes', noteId);
    }
    return doc(db, 'users', user.uid, 'vaults', activeVault, 'notes', noteId);
  }, [user, activeVault]);

  const addNote = useCallback(async (note) => {
    if (!user) return;
    
    const noteRef = getNoteRef(note.id);
    if (!noteRef) return;
    
    const noteWithVault = {
      ...note,
      vaultId: activeVault === 'default' ? null : activeVault
    };
    await setDoc(noteRef, noteWithVault);
  }, [user, activeVault, getNoteRef]);

  const saveNote = useCallback(async (note) => {
    if (!user) return;
    
    setSyncing(true);
    const noteRef = getNoteRef(note.id);
    if (!noteRef) return;
    
    await setDoc(noteRef, { ...note, updatedAt: new Date() }, { merge: true });
    setSyncing(false);
  }, [user, getNoteRef]);

  const removeNote = useCallback(async (noteId) => {
    if (!user) return;
    
    const noteRef = getNoteRef(noteId);
    if (!noteRef) return;
    
    await deleteDoc(noteRef);
  }, [user, getNoteRef]);

  const moveNoteToVault = useCallback(async (noteId, targetVaultId) => {
    if (!user) return;
    
    const noteToMove = notes.find(n => n.id === noteId);
    if (!noteToMove) return;
    
    const deleteRef = getNoteRef(noteId);
    if (deleteRef) {
      await deleteDoc(deleteRef);
    }
    
    const targetRef = targetVaultId === 'default'
      ? doc(db, 'users', user.uid, 'notes', noteId)
      : doc(db, 'users', user.uid, 'vaults', targetVaultId, 'notes', noteId);
    
    await setDoc(targetRef, {
      ...noteToMove,
      vaultId: targetVaultId === 'default' ? null : targetVaultId,
      updatedAt: new Date()
    });
  }, [user, notes, getNoteRef]);

  const value = {
    user,
    vaults,
    notes,
    activeVault,
    loading,
    syncing,
    addNote,
    saveNote,
    removeNote,
    createVault,
    deleteVault,
    setActiveVault: setActiveVaultById,
    moveNoteToVault,
    signInGoogle,
    signOut: signOutUser
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};