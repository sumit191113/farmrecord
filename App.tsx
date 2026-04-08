
import React, { useState, useEffect, useCallback } from 'react';
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
import LockScreen from './components/LockScreen';
import { FarmSummary, NavItem, AppView, Crop, Earning, Note, TrackEntry } from './types';
import { fetchFirebaseData, saveCropToFirebase, deleteCropFromFirebase, saveEarningToFirebase, deleteEarningFromFirebase, saveNoteToFirebase, deleteNoteFromFirebase, saveTrackEntryToFirebase, deleteTrackEntryFromFirebase, subscribeToTrackEntries, fetchProfilePhotoFromFirebase, saveProfilePhotoToFirebase } from './services/firebaseService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavItem>('home');
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => localStorage.getItem('farm_profile_photo'));

  // Password Lock State
  const getInitialLockState = () => {
    const saved = localStorage.getItem('farm_lock_enabled');
    return saved === null ? true : saved === 'true';
  };

  const [isPasswordEnabled, setIsPasswordEnabled] = useState(getInitialLockState);
  const [savedPassword, setSavedPassword] = useState(() => {
    return localStorage.getItem('farm_lock_password') || '1911';
  });
  const [isAppLocked, setIsAppLocked] = useState(getInitialLockState);
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');

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
  }, []);

  // 1.1 Real-time Subscription for Track Entries
  useEffect(() => {
    const unsubscribe = subscribeToTrackEntries((entries) => {
      // Ensure unique entries by ID to prevent React key errors
      const uniqueEntries = Array.from(new Map(entries.map(item => [item.id, item])).values());
      setTrackEntries(uniqueEntries);
      localStorage.setItem('farm_track', JSON.stringify(uniqueEntries));
    });
    return () => unsubscribe();
  }, []);

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
    window.scrollTo(0, 0);
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

  if (isAppLocked) {
    return <LockScreen savedPassword={savedPassword} onUnlock={() => setIsAppLocked(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 max-w-md mx-auto relative overflow-x-hidden shadow-2xl">
      {currentView === 'dashboard' && (
        <Header 
          syncStatus={isOnline ? (isSyncing ? 'syncing' : 'synced') : 'offline'} 
          onMenuClick={() => setIsSidebarOpen(true)}
          profilePhoto={profilePhoto}
          onProfilePhotoUpdate={handleProfilePhotoUpdate}
        />
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={(view) => handleNavigate(view)}
      />

      <main className="flex-1 pb-24 overflow-y-auto no-scrollbar">
        {currentView === 'dashboard' && (
          <div className="px-5 pt-4 space-y-8 animate-in fade-in duration-500">
            <SummaryBox data={summaryData} onExportData={handleExportData} />
            <QuickActions onAction={(action) => {
              if (action === 'Expense') handleNavigate('manage-expenses');
              if (action === 'Sale') handleNavigate('manage-sales');
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

            {/* App Lock Section */}
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-[#11AB2F]">
                    <i className="fa-solid fa-shield-halved text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">App Lock</h3>
                    <p className="text-xs text-slate-400">Secure your data with a PIN</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const newState = !isPasswordEnabled;
                    setIsPasswordEnabled(newState);
                    localStorage.setItem('farm_lock_enabled', String(newState));
                  }}
                  className={`w-14 h-8 rounded-full p-1 transition-all duration-300 flex items-center ${isPasswordEnabled ? 'bg-[#11AB2F]' : 'bg-slate-200'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 transform ${isPasswordEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {isPasswordEnabled && (
                <div className="pt-4 border-t border-slate-50 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600">Current PIN</span>
                    <span className="text-sm font-mono font-bold bg-slate-50 px-3 py-1 rounded-lg text-slate-400">****</span>
                  </div>
                  <button 
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full py-4 bg-slate-50 text-slate-800 rounded-2xl font-bold text-sm hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-key text-xs"></i>
                    Change Password
                  </button>
                </div>
              )}
            </div>

            {/* Coming Soon Placeholder */}
            <div className="bg-slate-100/50 rounded-[28px] p-8 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">More Features</p>
              <p className="text-slate-400 text-sm">Cloud Backup, Multi-language, and Export options coming soon!</p>
            </div>

            {/* Change Password Modal */}
            {isChangingPassword && (
              <div className="fixed inset-0 z-[200] flex flex-col items-center justify-end animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={() => setIsChangingPassword(false)}></div>
                <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-10 shadow-2xl relative animate-in slide-in-from-bottom duration-500 pointer-events-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-900">Change PIN</h3>
                    <button onClick={() => setIsChangingPassword(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-90"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New 4-Digit PIN</label>
                      <input 
                        type="password" 
                        maxLength={4}
                        pattern="\d*"
                        inputMode="numeric"
                        value={newPasswordInput} 
                        onChange={e => setNewPasswordInput(e.target.value.replace(/\D/g, ''))} 
                        placeholder="Enter new PIN" 
                        className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all font-mono text-center text-2xl tracking-[1em]" 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (newPasswordInput.length === 4) {
                        setSavedPassword(newPasswordInput);
                        localStorage.setItem('farm_lock_password', newPasswordInput);
                        setIsChangingPassword(false);
                        setNewPasswordInput('');
                      }
                    }}
                    disabled={newPasswordInput.length !== 4}
                    className={`w-full py-5 rounded-[20px] font-bold text-lg shadow-lg active:scale-95 transition-all mt-8 ${newPasswordInput.length === 4 ? 'bg-[#11AB2F] text-white shadow-green-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    Update PIN
                  </button>
                </div>
              </div>
            )}
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
          setActiveTab(tab);
          if (tab === 'home') setCurrentView('dashboard');
          if (tab === 'manage') setCurrentView('my-crops');
          if (tab === 'notepad') setCurrentView('notepad');
        }} 
        onAddClick={() => setIsAddModalOpen(true)}
      />
    </div>
  );
};

export default App;
