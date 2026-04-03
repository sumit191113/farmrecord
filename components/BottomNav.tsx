
import React from 'react';
import { NavItem } from '../types';

interface BottomNavProps {
  activeTab: NavItem;
  setActiveTab: (tab: NavItem) => void;
  onAddClick: () => void;
}

const NavButton: React.FC<{
  tab: NavItem;
  activeTab: NavItem;
  icon: string;
  label: string;
  onClick: (tab: NavItem) => void;
}> = ({ tab, activeTab, icon, label, onClick }) => {
  const isActive = activeTab === tab;
  return (
    <button 
      onClick={() => onClick(tab)}
      className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 relative h-full w-full ${isActive ? 'text-[#11AB2F]' : 'text-slate-400'}`}
    >
      <i className={`${icon} text-lg ${isActive ? 'scale-110' : 'scale-100'} transition-transform`}></i>
      <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
      {isActive && (
        <span className="absolute bottom-1 w-1 h-1 bg-[#11AB2F] rounded-full shadow-[0_0_8px_#11AB2F]"></span>
      )}
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onAddClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] max-w-md mx-auto px-4 pb-6 pt-2 pointer-events-none">
      <nav className="bg-white/95 backdrop-blur-xl rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-white/60 h-20 flex items-center justify-between px-2 pointer-events-auto relative overflow-visible">
        
        {/* Section 1: Home */}
        <div className="flex-1 h-full flex items-center justify-center">
          <NavButton 
            tab="home" 
            activeTab={activeTab} 
            icon="fa-solid fa-house" 
            label="Home" 
            onClick={setActiveTab} 
          />
        </div>

        {/* Section 2: Manage */}
        <div className="flex-1 h-full flex items-center justify-center">
          <NavButton 
            tab="manage" 
            activeTab={activeTab} 
            icon="fa-solid fa-layer-group" 
            label="Manage" 
            onClick={setActiveTab} 
          />
        </div>

        {/* Section 3: EXACT CENTER - Add Crop Button */}
        <div className="flex-1 h-full flex items-center justify-center">
          <button 
            onClick={onAddClick}
            className="w-14 h-14 bg-gradient-to-tr from-[#11AB2F] to-[#2ecc71] rounded-2xl shadow-lg shadow-green-100 flex items-center justify-center text-white active:scale-90 transition-all hover:shadow-xl hover:brightness-110"
            aria-label="Add New Crop"
          >
            <i className="fa-solid fa-plus text-2xl"></i>
          </button>
        </div>

        {/* Section 4: Calculator */}
        <div className="flex-1 h-full flex items-center justify-center">
          <NavButton 
            tab="calculator" 
            activeTab={activeTab} 
            icon="fa-solid fa-calculator" 
            label="Calc" 
            onClick={setActiveTab} 
          />
        </div>

        {/* Section 5: Notepad */}
        <div className="flex-1 h-full flex items-center justify-center">
          <NavButton 
            tab="notepad" 
            activeTab={activeTab} 
            icon="fa-solid fa-pen-to-square" 
            label="Notes" 
            onClick={setActiveTab} 
          />
        </div>

      </nav>
    </div>
  );
};

export default BottomNav;
