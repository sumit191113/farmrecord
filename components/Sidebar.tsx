
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate }) => {
  const menuItems = [
    { icon: 'fa-house', label: 'Dashboard', view: 'dashboard' as AppView },
    { icon: 'fa-seedling', label: 'My Crops', view: 'my-crops' as AppView },
    { icon: 'fa-wallet', label: 'Expenses', view: 'manage-expenses' as AppView },
    { icon: 'fa-cart-shopping', label: 'Sales', view: 'manage-sales' as AppView },
    { icon: 'fa-camera', label: 'Track', view: 'track' as AppView },
    { icon: 'fa-money-bill-trend-up', label: 'Earnings', view: 'earnings' as AppView },
    { icon: 'fa-chart-line', label: 'Reports', view: 'reports' as AppView },
    { icon: 'fa-book', label: 'Crop Records', view: 'crop-records' as AppView },
    { icon: 'fa-note-sticky', label: 'Notepad', view: 'notepad' as AppView },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[101] shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black text-[#11AB2F] tracking-tighter italic">FARM BOOK</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full active:scale-90">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Smart Farming Assistant</p>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  onNavigate(item.view);
                  onClose();
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-600 hover:bg-green-50 hover:text-[#11AB2F] transition-all active:scale-[0.98] group"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                  <i className={`fa-solid ${item.icon} text-lg`}></i>
                </div>
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Footer / Settings */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={() => {
                onNavigate('settings');
                onClose();
              }}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl">
                <i className="fa-solid fa-gear text-lg"></i>
              </div>
              <span className="font-bold text-sm">Settings</span>
            </button>
            <div className="mt-4 text-center">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
