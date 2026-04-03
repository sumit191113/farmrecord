
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
import CalculatorPopup from './components/CalculatorPopup';
import { FarmSummary, NavItem, AppView, Crop, Earning, Note } from './types';
import { fetchFirebaseData, saveCropToFirebase, deleteCropFromFirebase, saveEarningToFirebase, deleteEarningFromFirebase, saveNoteToFirebase, deleteNoteFromFirebase } from './services/firebaseService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavItem>('home');
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // 1. One-time Hydration from Firebase on App Start
  useEffect(() => {
    const hydrate = async () => {
      setIsSyncing(true);
      const remoteData = await fetchFirebaseData();
      if (remoteData) {
        setCrops(remoteData.crops);
        setEarnings(remoteData.earnings);
        setNotes(remoteData.notes);
        localStorage.setItem('farm_crops', JSON.stringify(remoteData.crops));
        localStorage.setItem('farm_earnings', JSON.stringify(remoteData.earnings));
        localStorage.setItem('farm_notes', JSON.stringify(remoteData.notes));
      }
      setIsSyncing(false);
    };
    hydrate();
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

  const activeCrop = safeCrops.find(c => c.id === selectedCropId);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 max-w-md mx-auto relative overflow-x-hidden shadow-2xl">
      {currentView === 'dashboard' && <Header syncStatus={isOnline ? (isSyncing ? 'syncing' : 'synced') : 'offline'} />}

      <main className="flex-1 pb-24 overflow-y-auto no-scrollbar">
        {currentView === 'dashboard' && (
          <div className="px-5 pt-4 space-y-8 animate-in fade-in duration-500">
            <SummaryBox data={summaryData} />
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
