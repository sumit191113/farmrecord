
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child, update, remove } from "firebase/database";
import { Crop, Earning, Note } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyALCuAEfJjgmxeip41Dji6HUEKIosi0Aik",
  authDomain: "milkrecordapp.firebaseapp.com",
  databaseURL: "https://milkrecordapp-default-rtdb.firebaseio.com",
  projectId: "milkrecordapp",
  storageBucket: "milkrecordapp.firebasestorage.app",
  messagingSenderId: "797212369388",
  appId: "1:797212369388:web:5e082b93ad9e23bbf3a0c9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Global shared path
const SHARED_ROOT = "farmbook_global_data";
const CROPS_PATH = `${SHARED_ROOT}/crops`;
const EARNINGS_PATH = `${SHARED_ROOT}/earnings`;
const NOTES_PATH = `${SHARED_ROOT}/notes`;

/**
 * Fetches the entire global state once for hydration
 */
export const fetchFirebaseData = async (): Promise<{ crops: Crop[], earnings: Earning[], notes: Note[] } | null> => {
  if (!navigator.onLine) return null;

  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, SHARED_ROOT));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        crops: data.crops ? Object.values(data.crops) : [],
        earnings: data.earnings ? Object.values(data.earnings) : [],
        notes: data.notes ? Object.values(data.notes) : []
      };
    }
    return { crops: [], earnings: [], notes: [] };
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
