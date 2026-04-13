
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppView } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  user: any;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, onLogout, user }) => {
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

  const containerVariants: any = {
    hidden: { x: '-100%' },
    visible: { 
      x: 0,
      transition: { 
        type: 'spring', 
        damping: 25, 
        stiffness: 200,
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    exit: { 
      x: '-100%',
      transition: { ease: 'easeInOut', duration: 0.3 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          
          {/* Sidebar Panel */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 left-0 bottom-0 w-[300px] bg-white z-[101] shadow-[20px_0_60px_-15px_rgba(0,0,0,0.1)] flex flex-col"
          >
            {/* Header with User Info */}
            <div className="relative overflow-hidden">
              {/* Decorative Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#11AB2F] to-[#0d8a25] opacity-[0.03]" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#11AB2F] opacity-[0.05] rounded-full blur-3xl" />
              
              <div className="relative p-8 border-b border-slate-100">
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-[#11AB2F] to-emerald-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                    <div className="relative w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden flex items-center justify-center">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <i className="fa-solid fa-user text-slate-200 text-3xl"></i>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 truncate tracking-tight text-lg leading-tight">{user?.displayName || 'Farmer'}</h3>
                    <p className="text-[10px] text-slate-400 font-bold truncate uppercase tracking-widest mt-1">{user?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-[#11AB2F] tracking-tighter italic leading-none" style={{ fontFamily: "'Cormorant Garamond', serif" }}>FARM BOOK</h2>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Premium Assistant</span>
                  </div>
                  <button 
                    onClick={onClose} 
                    className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-90"
                  >
                    <i className="fa-solid fa-xmark text-lg"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 no-scrollbar">
              {menuItems.map((item) => (
                <motion.button
                  key={item.view}
                  variants={itemVariants}
                  onClick={() => {
                    onNavigate(item.view);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-600 hover:bg-green-50 hover:text-[#11AB2F] transition-all active:scale-[0.98] group relative overflow-hidden"
                >
                  <div className="w-11 h-11 flex items-center justify-center bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-md group-hover:shadow-green-100/50 transition-all duration-300">
                    <i className={`fa-solid ${item.icon} text-lg`}></i>
                  </div>
                  <span className="font-bold text-[15px] tracking-tight">{item.label}</span>
                  
                  {/* Subtle hover indicator */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-[#11AB2F] rounded-r-full group-hover:h-8 transition-all duration-300" />
                </motion.button>
              ))}
            </div>

            {/* Footer / Settings & Logout */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/30 space-y-3">
              <motion.button
                variants={itemVariants}
                onClick={() => {
                  onNavigate('settings');
                  onClose();
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm transition-all active:scale-[0.98] border border-transparent hover:border-slate-100"
              >
                <div className="w-11 h-11 flex items-center justify-center bg-slate-100/50 rounded-xl">
                  <i className="fa-solid fa-gear text-lg"></i>
                </div>
                <span className="font-bold text-[15px] tracking-tight">Settings</span>
              </motion.button>
              
              <motion.button
                variants={itemVariants}
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all active:scale-[0.98] border border-transparent hover:border-red-100"
              >
                <div className="w-11 h-11 flex items-center justify-center bg-red-50/50 rounded-xl">
                  <i className="fa-solid fa-right-from-bracket text-lg"></i>
                </div>
                <span className="font-bold text-[15px] tracking-tight">Logout</span>
              </motion.button>
              
              <div className="pt-4 flex flex-col items-center">
                <div className="px-3 py-1 bg-slate-100 rounded-full">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Version 1.0.0</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
