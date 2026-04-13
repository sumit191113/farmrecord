
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import SummaryBox from './components/SummaryBox';
import QuickActions from './components/QuickActions';
import MainCards from './components/MainCards';
import BottomNav from './components/BottomNav';
import CropManagement from './components/CropManagement';
import EarningsView from './components/EarningsView';
import ReportsView from './components/ReportsView';
import CropRecordsView from './components/CropRecordsView';
import NotepadView from './components/NotepadView';
import TrackView from './components/TrackView';
import CalculatorPopup from './components/CalculatorPopup';
import Sidebar from './components/Sidebar';
import AuthScreen from './components/Auth/AuthScreen';
import { FarmSummary, NavItem, AppView, Crop, Earning, Note, TrackEntry } from './types';
import { 
  auth, 
  onAuthStateChanged, 
  signOut, 
  fetchFirebaseData, 
  saveCropToFirebase, 
  deleteCropFromFirebase, 
  saveEarningToFirebase, 
  deleteEarningFromFirebase, 
  saveNoteToFirebase, 
  deleteNoteFromFirebase, 
  saveTrackEntryToFirebase, 
  deleteTrackEntryFromFirebase, 
  subscribeToTrackEntries, 
  fetchProfilePhotoFromFirebase, 
  saveProfilePhotoToFirebase 
} from './services/firebaseService';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavItem>('home');
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => localStorage.getItem('farm_profile_photo'));

  // 0. Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      if (currentUser) {
        // Clear local storage if user changed? 
        // For now just let hydration handle it
      } else {
        // Clear state on logout
        setCrops([]);
        setEarnings([]);
        setNotes([]);
        setTrackEntries([]);
        setProfilePhoto(null);
        localStorage.removeItem('farm_crops');
        localStorage.removeItem('farm_earnings');
        localStorage.removeItem('farm_notes');
        localStorage.removeItem('farm_track');
        localStorage.removeItem('farm_profile_photo');
      }
    });
    return () => unsubscribe();
  }, []);

  // Back Button & History Management
  const [lastBackPress, setLastBackPress] = useState(0);
  const [showExitToast, setShowExitToast] = useState(false);

  useEffect(() => {
    // Initialize history state if not present
    if (!window.history.state) {
      window.history.replaceState({ view: 'dashboard', id: null }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        // Navigating within the app via browser back/forward
        const { view, id } = event.state;
        setCurrentView(view);
        setSelectedCropId(id || null);
        
        // Sync active tab
        if (view === 'dashboard') setActiveTab('home');
        else if (view === 'my-crops') setActiveTab('manage');
        else if (view === 'notepad') setActiveTab('notepad');
      } else {
        // Reached the start of history
        if (currentView === 'dashboard') {
          const now = Date.now();
          if (now - lastBackPress < 2000) {
            // Double tap! We can't close the tab, but we can go back to previous site
            window.history.back();
          } else {
            setLastBackPress(now);
            setShowExitToast(true);
            setTimeout(() => setShowExitToast(false), 2000);
            // Push state back to stay in app and intercept next back press
            window.history.pushState({ view: 'dashboard', id: null }, '');
          }
        } else {
          // Fallback to dashboard
          handleNavigate('dashboard');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView, lastBackPress]);

  // Initialize state from LocalStorage for immediate UI response
  const [crops, setCrops] = useState<Crop[]>(() => {
    try {
      const saved = localStorage.getItem('farm_crops');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [earnings, setEarnings] = useState<Earning[]>(() => {
    try {
      const saved = localStorage.getItem('farm_earnings');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('farm_notes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [trackEntries, setTrackEntries] = useState<TrackEntry[]>(() => {
    try {
      const saved = localStorage.getItem('farm_track');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 1. One-time Hydration from Firebase on App Start
  useEffect(() => {
    if (!user) return;
    
    const hydrate = async () => {
      setIsSyncing(true);
      const remoteData = await fetchFirebaseData();
      const remoteProfilePhoto = await fetchProfilePhotoFromFirebase();
      
      if (remoteData) {
        setCrops(remoteData.crops);
        setEarnings(remoteData.earnings);
        setNotes(remoteData.notes);
        setTrackEntries(remoteData.trackEntries);
        localStorage.setItem('farm_crops', JSON.stringify(remoteData.crops));
        localStorage.setItem('farm_earnings', JSON.stringify(remoteData.earnings));
        localStorage.setItem('farm_notes', JSON.stringify(remoteData.notes));
        localStorage.setItem('farm_track', JSON.stringify(remoteData.trackEntries));
      }

      if (remoteProfilePhoto) {
        setProfilePhoto(remoteProfilePhoto);
        localStorage.setItem('farm_profile_photo', remoteProfilePhoto);
      }
      setIsSyncing(false);
    };
    hydrate();
  }, [user]);

  // 1.1 Real-time Subscription for Track Entries
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToTrackEntries((entries) => {
      // Ensure unique entries by ID to prevent React key errors
      const uniqueEntries = Array.from(new Map(entries.map(item => [item.id, item])).values());
      setTrackEntries(uniqueEntries);
      localStorage.setItem('farm_track', JSON.stringify(uniqueEntries));
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Monitor Connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 3. Controlled Handlers for Mutations (State + Firebase Sync)
  
  const handleUpdateCrops = useCallback(async (updatedCrops: Crop[] | ((prev: Crop[]) => Crop[])) => {
    setCrops((prev) => {
      const next = typeof updatedCrops === 'function' ? updatedCrops(prev) : updatedCrops;
      localStorage.setItem('farm_crops', JSON.stringify(next));
      return next;
    });
  }, []);

  const addOrUpdateCropSurgical = async (crop: Crop) => {
    setCrops(prev => {
      const exists = prev.find(c => c.id === crop.id);
      const next = exists ? prev.map(c => c.id === crop.id ? crop : c) : [crop, ...prev];
      localStorage.setItem('farm_crops', JSON.stringify(next));
      return next;
    });
    setIsSyncing(true);
    await saveCropToFirebase(crop);
    setIsSyncing(false);
  };

  const deleteCropSurgical = async (id: string) => {
    setCrops(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem('farm_crops', JSON.stringify(next));
      return next;
    });
    setIsSyncing(true);
    await deleteCropFromFirebase(id);
    setIsSyncing(false);
  };

  const addEarningSurgical = async (earning: Earning) => {
    setEarnings(prev => {
      const next = [earning, ...prev];
      localStorage.setItem('farm_earnings', JSON.stringify(next));
      return next;
    });
    setIsSyncing(true);
    await saveEarningToFirebase(earning);
    setIsSyncing(false);
  };

  const deleteEarningSurgical = async (id: string) => {
    setEarnings(prev => {
      const next = prev.filter(e => e.id !== id);
      localStorage.setItem('farm_earnings', JSON.stringify(next));
      return next;
    });
    setIsSyncing(true);
    await deleteEarningFromFirebase(id);
    setIsSyncing(false);
  };

  const addOrUpdateNoteSurgical = async (note: Note) => {
    setNotes(prev => {
      const exists = prev.find(n => n.id === note.id);
      const next = exists ? prev.map(n => n.id === note.id ? note : n) : [note, ...prev];
      localStorage.setItem('farm_notes', JSON.stringify(next));
      return next;
    });
    setIsSyncing(true);
    await saveNoteToFirebase(note);
    setIsSyncing(false);
  };

  const deleteNoteSurgical = async (id: string) => {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      localStorage.setItem('farm_notes', JSON.stringify(next));
      return next;
    });
    setIsSyncing(true);
    await deleteNoteFromFirebase(id);
    setIsSyncing(false);
  };

  const addTrackEntrySurgical = async (entry: TrackEntry) => {
    setTrackEntries(prev => {
      if (prev.some(e => e.id === entry.id)) return prev;
      const next = [entry, ...prev];
      localStorage.setItem('farm_track', JSON.stringify(next));
      return next;
    });
  };

  const deleteTrackEntrySurgical = async (entry: TrackEntry) => {
    setTrackEntries(prev => {
      const next = prev.filter(e => e.id !== entry.id);
      localStorage.setItem('farm_track', JSON.stringify(next));
      return next;
    });
  };

  const handleProfilePhotoUpdate = async (url: string) => {
    setProfilePhoto(url);
    localStorage.setItem('farm_profile_photo', url);
    setIsSyncing(true);
    await saveProfilePhotoToFirebase(url);
    setIsSyncing(false);
  };

  const safeCrops = crops || [];
  const safeEarnings = earnings || [];
  const safeNotes = notes || [];

  const cropExpenses = safeCrops.reduce((sum, c) => sum + (c.expenses || []).reduce((s, e) => s + (e.amount || 0), 0), 0);
  const cropSales = safeCrops.reduce((sum, c) => sum + (c.sales || []).reduce((s, e) => s + (e.amount || 0), 0), 0);

  const summaryData: FarmSummary = {
    totalExpenses: cropExpenses,
    totalSales: cropSales,
    netProfit: cropSales - cropExpenses
  };

  const handleNavigate = (view: AppView, id?: string) => {
    setCurrentView(view);
    if (id) setSelectedCropId(id);
    else setSelectedCropId(null);
    window.scrollTo(0, 0);

    // Sync active tab
    if (view === 'dashboard') setActiveTab('home');
    else if (view === 'my-crops') setActiveTab('manage');
    else if (view === 'notepad') setActiveTab('notepad');

    // Push to browser history if different from current
    const currentState = window.history.state;
    if (!currentState || currentState.view !== view || currentState.id !== (id || null)) {
      window.history.pushState({ view, id: id || null }, '');
    }
  };

  const handleExportData = () => {
    const dataToExport = {
      crops: safeCrops,
      earnings: safeEarnings,
      notes: safeNotes,
      trackEntries: trackEntries,
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farm_book_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeCrop = safeCrops.find(c => c.id === selectedCropId);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-[#11AB2F] rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading FarmBook...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 max-w-md mx-auto relative overflow-x-hidden shadow-2xl">
      {currentView === 'dashboard' && (
        <Header 
          syncStatus={isOnline ? (isSyncing ? 'syncing' : 'synced') : 'offline'} 
          onMenuClick={() => setIsSidebarOpen(true)}
          profilePhoto={profilePhoto || user.photoURL}
          onProfilePhotoUpdate={handleProfilePhotoUpdate}
        />
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={(view) => handleNavigate(view)}
        onLogout={() => signOut(auth)}
        user={user}
      />

      <main className="flex-1 pb-24 overflow-y-auto no-scrollbar">
        {currentView === 'dashboard' && (
          <div className="px-5 pt-4 space-y-8 animate-in fade-in duration-500">
            <SummaryBox data={summaryData} onExportData={handleExportData} />
            <QuickActions onAction={(action) => {
              if (action === 'Settings') handleNavigate('settings');
              if (action === 'Track') handleNavigate('track');
              if (action === 'Earning') handleNavigate('earnings');
              if (action === 'Revenue') handleNavigate('reports');
            }} />
            <MainCards 
              onNavigateToCrops={() => handleNavigate('my-crops')} 
              onNavigateToRecords={() => handleNavigate('crop-records')}
            />
            <div className="h-4" />
          </div>
        )}

        {currentView === 'earnings' && (
          <EarningsView 
            earnings={safeEarnings} 
            onAddEarning={addEarningSurgical}
            onDeleteEarning={deleteEarningSurgical}
            onBack={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'reports' && (
          <ReportsView 
            earnings={safeEarnings}
            onBack={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'crop-records' && (
          <CropRecordsView 
            crops={safeCrops}
            onBack={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'notepad' && (
          <NotepadView 
            notes={safeNotes}
            onSaveNote={addOrUpdateNoteSurgical}
            onDeleteNote={deleteNoteSurgical}
            onBack={() => handleNavigate('dashboard')}
          />
        )}

        {(currentView === 'track' || currentView === 'track-detail') && (
          <TrackView 
            crops={safeCrops}
            trackEntries={trackEntries}
            onAddEntry={addTrackEntrySurgical}
            onDeleteEntry={deleteTrackEntrySurgical}
            onNavigate={handleNavigate}
            initialCropId={selectedCropId}
          />
        )}

        {currentView === 'settings' && (
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => handleNavigate('dashboard')} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 active:scale-90 transition-all">
                <i className="fa-solid fa-arrow-left text-slate-800"></i>
              </button>
              <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
            </div>

            <div className="bg-slate-100/50 rounded-[28px] p-8 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">More Features</p>
              <p className="text-slate-400 text-sm">Cloud Backup, Multi-language, and Export options coming soon!</p>
            </div>
          </div>
        )}

        {/* CropManagement handles specialized views AND global modals */}
        <CropManagement 
          view={currentView}
          crops={safeCrops}
          activeCrop={activeCrop}
          onNavigate={handleNavigate}
          setCrops={handleUpdateCrops}
          onSurgicalSave={addOrUpdateCropSurgical}
          onSurgicalDelete={deleteCropSurgical}
          isAddModalOpen={isAddModalOpen}
          setIsAddModalOpen={setIsAddModalOpen}
        />
      </main>

      {isCalculatorOpen && (
        <CalculatorPopup onClose={() => setIsCalculatorOpen(false)} />
      )}

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          if (tab === 'calculator') {
            setIsCalculatorOpen(true);
            return;
          }
          if (tab === 'home') handleNavigate('dashboard');
          if (tab === 'manage') handleNavigate('my-crops');
          if (tab === 'notepad') handleNavigate('notepad');
        }} 
        onAddClick={() => setIsAddModalOpen(true)}
      />

      {/* Exit Toast */}
      <AnimatePresence>
        {showExitToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[1000] bg-slate-800/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl border border-white/10 whitespace-nowrap"
          >
            Press again to exit
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
