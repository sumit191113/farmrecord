
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child, update, remove, onValue, off } from "firebase/database";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { Crop, Earning, Note, TrackEntry } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyASGqIsLTBNm5G6_dQg4SUFwduSq08jiBA",
  authDomain: "farm-book-6bf74.firebaseapp.com",
  databaseURL: "https://farm-book-6bf74-default-rtdb.firebaseio.com",
  projectId: "farm-book-6bf74",
  storageBucket: "farm-book-6bf74.firebasestorage.app",
  messagingSenderId: "927297176621",
  appId: "1:927297176621:web:0f9c0ddc1ae6ee2d7124a4",
  measurementId: "G-S0HZTKNHEL"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// User-specific paths
const getUserRoot = () => {
  const user = auth.currentUser;
  return user ? `users/${user.uid}` : "farmbook_global_data";
};

const getCropsPath = () => `${getUserRoot()}/crops`;
const getEarningsPath = () => `${getUserRoot()}/earnings`;
const getNotesPath = () => `${getUserRoot()}/notes`;
const getTrackPath = () => `${getUserRoot()}/track`;
const getProfilePath = () => `${getUserRoot()}/profile`;

/**
 * Fetches the user data once for hydration
 */
export const fetchFirebaseData = async (): Promise<{ crops: Crop[], earnings: Earning[], notes: Note[], trackEntries: TrackEntry[] } | null> => {
  if (!navigator.onLine || !auth.currentUser) return null;

  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, getUserRoot()));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        crops: data.crops ? Object.values(data.crops) : [],
        earnings: data.earnings ? Object.values(data.earnings) : [],
        notes: data.notes ? Object.values(data.notes) : [],
        trackEntries: data.track ? Object.values(data.track) : []
      };
    }
    return { crops: [], earnings: [], notes: [], trackEntries: [] };
  } catch (error) {
    console.error("Firebase Fetch Error:", error);
    return null;
  }
};

/**
 * Surgical update for a single crop
 */
export const saveCropToFirebase = async (crop: Crop) => {
  if (!navigator.onLine || !auth.currentUser) return;
  try {
    const cropRef = ref(db, `${getCropsPath()}/${crop.id}`);
    await set(cropRef, crop);
  } catch (error) {
    console.error("Firebase Save Crop Error:", error);
  }
};

/**
 * Surgical delete for a single crop
 */
export const deleteCropFromFirebase = async (cropId: string) => {
  if (!navigator.onLine || !auth.currentUser) return;
  try {
    const cropRef = ref(db, `${getCropsPath()}/${cropId}`);
    await remove(cropRef);
  } catch (error) {
    console.error("Firebase Delete Crop Error:", error);
  }
};

/**
 * Surgical update for a single earning
 */
export const saveEarningToFirebase = async (earning: Earning) => {
  if (!navigator.onLine || !auth.currentUser) return;
  try {
    const earningRef = ref(db, `${getEarningsPath()}/${earning.id}`);
    await set(earningRef, earning);
  } catch (error) {
    console.error("Firebase Save Earning Error:", error);
  }
};

/**
 * Surgical delete for a single earning
 */
export const deleteEarningFromFirebase = async (earningId: string) => {
  if (!navigator.onLine || !auth.currentUser) return;
  try {
    const earningRef = ref(db, `${getEarningsPath()}/${earningId}`);
    await remove(earningRef);
  } catch (error) {
    console.error("Firebase Delete Earning Error:", error);
  }
};

/**
 * Surgical update for a single note
 */
export const saveNoteToFirebase = async (note: Note) => {
  if (!navigator.onLine || !auth.currentUser) return;
  try {
    const noteRef = ref(db, `${getNotesPath()}/${note.id}`);
    await set(noteRef, note);
  } catch (error) {
    console.error("Firebase Save Note Error:", error);
  }
};

/**
 * Surgical delete for a single note
 */
export const deleteNoteFromFirebase = async (noteId: string) => {
  if (!navigator.onLine || !auth.currentUser) return;
  try {
    const noteRef = ref(db, `${getNotesPath()}/${noteId}`);
    await remove(noteRef);
  } catch (error) {
    console.error("Firebase Delete Note Error:", error);
  }
};

/**
 * Uploads an image to Firebase Storage and returns the URL
 */
export const uploadTrackImage = async (file: File, cropId: string): Promise<string> => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  const fileName = `${Date.now()}_${file.name}`;
  const storageReference = sRef(storage, `track_images/${auth.currentUser.uid}/${cropId}/${fileName}`);
  await uploadBytes(storageReference, file);
  return getDownloadURL(storageReference);
};

/**
 * Uploads an image to Cloudinary
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || 'dtb1dmptk';
  const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Cloudinary upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Upload timed out. Please check your connection.');
    }
    throw error;
  }
};

/**
 * Saves a track entry to Firebase
 */
export const saveTrackEntryToFirebase = async (entry: TrackEntry) => {
  if (!navigator.onLine || !auth.currentUser) return;
  try {
    const trackRef = ref(db, `${getTrackPath()}/${entry.id}`);
    await set(trackRef, entry);
  } catch (error) {
    console.error("Firebase Save Track Entry Error:", error);
  }
};

/**
 * Deletes a track entry and its associated image
 */
export const deleteTrackEntryFromFirebase = async (entry: TrackEntry) => {
  if (!navigator.onLine || !auth.currentUser) return;
  try {
    // Delete from DB
    const trackRef = ref(db, `${getTrackPath()}/${entry.id}`);
    await remove(trackRef);

    // Try to delete from Storage if it's a firebase URL
    if (entry.imageUrl.includes('firebasestorage')) {
      const imageRef = sRef(storage, entry.imageUrl);
      await deleteObject(imageRef).catch(e => console.warn("Image delete failed:", e));
    }
  } catch (error) {
    console.error("Firebase Delete Track Entry Error:", error);
  }
};

/**
 * Listens for real-time updates to track entries
 */
export const subscribeToTrackEntries = (callback: (entries: TrackEntry[]) => void) => {
  if (!auth.currentUser) return () => {};
  const trackRef = ref(db, getTrackPath());
  onValue(trackRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback(Object.values(data));
    } else {
      callback([]);
    }
  });

  return () => off(trackRef);
};

/**
 * Saves profile photo URL to Firebase
 */
export const saveProfilePhotoToFirebase = async (photoUrl: string) => {
  if (!navigator.onLine || !auth.currentUser) return;
  try {
    const profileRef = ref(db, getProfilePath());
    await set(profileRef, { photoUrl });
  } catch (error) {
    console.error("Firebase Save Profile Photo Error:", error);
  }
};

/**
 * Fetches profile photo URL from Firebase
 */
export const fetchProfilePhotoFromFirebase = async (): Promise<string | null> => {
  if (!navigator.onLine || !auth.currentUser) return null;
  try {
    const profileRef = ref(db, getProfilePath());
    const snapshot = await get(profileRef);
    if (snapshot.exists()) {
      return snapshot.val().photoUrl;
    }
    return null;
  } catch (error) {
    console.error("Firebase Fetch Profile Photo Error:", error);
    return null;
  }
};

export { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile };
