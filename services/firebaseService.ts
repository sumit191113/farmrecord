
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child, update, remove, onValue, off } from "firebase/database";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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
const db = getDatabase(app);
const storage = getStorage(app);

// Global shared path
const SHARED_ROOT = "farmbook_global_data";
const CROPS_PATH = `${SHARED_ROOT}/crops`;
const EARNINGS_PATH = `${SHARED_ROOT}/earnings`;
const NOTES_PATH = `${SHARED_ROOT}/notes`;
const TRACK_PATH = `${SHARED_ROOT}/track`;
const PROFILE_PATH = `${SHARED_ROOT}/profile`;

/**
 * Fetches the entire global state once for hydration
 */
export const fetchFirebaseData = async (): Promise<{ crops: Crop[], earnings: Earning[], notes: Note[], trackEntries: TrackEntry[] } | null> => {
  if (!navigator.onLine) return null;

  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, SHARED_ROOT));
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
  if (!navigator.onLine) return;
  try {
    const cropRef = ref(db, `${CROPS_PATH}/${crop.id}`);
    await set(cropRef, crop);
  } catch (error) {
    console.error("Firebase Save Crop Error:", error);
  }
};

/**
 * Surgical delete for a single crop
 */
export const deleteCropFromFirebase = async (cropId: string) => {
  if (!navigator.onLine) return;
  try {
    const cropRef = ref(db, `${CROPS_PATH}/${cropId}`);
    await remove(cropRef);
  } catch (error) {
    console.error("Firebase Delete Crop Error:", error);
  }
};

/**
 * Surgical update for a single earning
 */
export const saveEarningToFirebase = async (earning: Earning) => {
  if (!navigator.onLine) return;
  try {
    const earningRef = ref(db, `${EARNINGS_PATH}/${earning.id}`);
    await set(earningRef, earning);
  } catch (error) {
    console.error("Firebase Save Earning Error:", error);
  }
};

/**
 * Surgical delete for a single earning
 */
export const deleteEarningFromFirebase = async (earningId: string) => {
  if (!navigator.onLine) return;
  try {
    const earningRef = ref(db, `${EARNINGS_PATH}/${earningId}`);
    await remove(earningRef);
  } catch (error) {
    console.error("Firebase Delete Earning Error:", error);
  }
};

/**
 * Surgical update for a single note
 */
export const saveNoteToFirebase = async (note: Note) => {
  if (!navigator.onLine) return;
  try {
    const noteRef = ref(db, `${NOTES_PATH}/${note.id}`);
    await set(noteRef, note);
  } catch (error) {
    console.error("Firebase Save Note Error:", error);
  }
};

/**
 * Surgical delete for a single note
 */
export const deleteNoteFromFirebase = async (noteId: string) => {
  if (!navigator.onLine) return;
  try {
    const noteRef = ref(db, `${NOTES_PATH}/${noteId}`);
    await remove(noteRef);
  } catch (error) {
    console.error("Firebase Delete Note Error:", error);
  }
};

/**
 * Uploads an image to Firebase Storage and returns the URL
 */
export const uploadTrackImage = async (file: File, cropId: string): Promise<string> => {
  const fileName = `${Date.now()}_${file.name}`;
  const storageReference = sRef(storage, `track_images/${cropId}/${fileName}`);
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
  if (!navigator.onLine) return;
  try {
    const trackRef = ref(db, `${TRACK_PATH}/${entry.id}`);
    await set(trackRef, entry);
  } catch (error) {
    console.error("Firebase Save Track Entry Error:", error);
  }
};

/**
 * Deletes a track entry and its associated image
 */
export const deleteTrackEntryFromFirebase = async (entry: TrackEntry) => {
  if (!navigator.onLine) return;
  try {
    // Delete from DB
    const trackRef = ref(db, `${TRACK_PATH}/${entry.id}`);
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
  const trackRef = ref(db, TRACK_PATH);
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
  if (!navigator.onLine) return;
  try {
    const profileRef = ref(db, PROFILE_PATH);
    await set(profileRef, { photoUrl });
  } catch (error) {
    console.error("Firebase Save Profile Photo Error:", error);
  }
};

/**
 * Fetches profile photo URL from Firebase
 */
export const fetchProfilePhotoFromFirebase = async (): Promise<string | null> => {
  if (!navigator.onLine) return null;
  try {
    const profileRef = ref(db, PROFILE_PATH);
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
