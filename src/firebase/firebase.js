import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const signInAnon = () => signInAnonymously(auth);
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signOutUser = () => signOut(auth);

export const notesCollection = (userId) => collection(db, 'users', userId, 'notes');

export const createNote = async (userId, note) => {
  const noteRef = doc(notesCollection(userId), note.id);
  await setDoc(noteRef, note);
};

export const updateNote = async (userId, note) => {
  const noteRef = doc(notesCollection(userId), note.id);
  await setDoc(noteRef, note, { merge: true });
};

export const deleteNote = async (userId, noteId) => {
  const noteRef = doc(notesCollection(userId), noteId);
  await deleteDoc(noteRef);
};

export const getNotesQuery = (userId) => {
  return query(notesCollection(userId), orderBy('updatedAt', 'desc'));
};