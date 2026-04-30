
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crop, Sale, Expense } from '../types';

interface MonitorCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  crop: Crop;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN').format(val);

const getSaleQuantityValue = (qtyStr: string) => {
  if (!qtyStr) return 0;
  const numMatch = qtyStr.match(/(\d+(\.\d+)?)/);
  if (numMatch) {
    let val = parseFloat(numMatch[1]);
    const unit = qtyStr.toLowerCase();
    if (unit.includes('qtl') || unit.includes('quintal')) {
      val *= 100;
    } else if (unit.includes('ton')) {
      val *= 1000;
    }
    return val;
  }
  return 0;
};

const MonitorCalendar: React.FC<MonitorCalendarProps> = ({ isOpen, onClose, crop }) => {
  const [activeTab, setActiveTab] = useState<'Sales' | 'Expenses'>('Sales');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateDetails, setSelectedDateDetails] = useState<{
    date: string;
    items: any[];
  } | null>(null);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const daysInMonth = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return date.getDate();
  }, [currentDate]);

  const firstDayOfMonth = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return date.getDay();
  }, [currentDate]);

  const recordDates = useMemo(() => {
    const dates = new Set<string>();
    if (activeTab === 'Sales') {
      crop.sales.forEach(s => dates.add(new Date(s.date).toDateString()));
    } else {
      crop.expenses.forEach(e => dates.add(new Date(e.date).toDateString()));
    }
    return dates;
  }, [crop, activeTab]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = clickedDate.toDateString();
    
    let items: any[] = [];
    if (activeTab === 'Sales') {
      items = crop.sales.filter(s => new Date(s.date).toDateString() === dateStr);
    } else {
      items = crop.expenses.filter(e => new Date(e.date).toDateString() === dateStr);
    }

    if (items.length > 0) {
      setSelectedDateDetails({
        date: clickedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        items
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header / Switch */}
            <div className="p-6 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Monitor Activity</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{crop.name}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-9 h-9 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center active:scale-90 transition-all"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl relative">
                <motion.div 
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm z-0"
                  animate={{ x: activeTab === 'Expenses' ? '100%' : '0%' }}
                />
                <button 
                  onClick={() => setActiveTab('Sales')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative z-10 ${activeTab === 'Sales' ? 'text-[#11AB2F]' : 'text-slate-400'}`}
                >
                  <i className="fa-solid fa-cart-shopping mr-2"></i>
                  Sales
                </button>
                <button 
                  onClick={() => setActiveTab('Expenses')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative z-10 ${activeTab === 'Expenses' ? 'text-red-500' : 'text-slate-400'}`}
                >
                  <i className="fa-solid fa-receipt mr-2"></i>
                  Expenses
                </button>
              </div>
            </div>

            {/* Calendar UI */}
            <div className="p-6 pt-4">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-black text-slate-800 tracking-tight">
                  {monthName} <span className="text-slate-300 ml-1">{year}</span>
                </h4>
                <div className="flex gap-2">
                  <button onClick={handlePrevMonth} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center active:bg-slate-100 transition-all">
                    <i className="fa-solid fa-chevron-left text-[10px]"></i>
                  </button>
                  <button onClick={handleNextMonth} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center active:bg-slate-100 transition-all">
                    <i className="fa-solid fa-chevron-right text-[10px]"></i>
                  </button>
                </div>
              </div>

              {/* Grid Days */}
              <div className="grid grid-cols-7 gap-y-3 gap-x-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <div key={`${day}-${idx}`} className="text-[10px] font-black text-slate-300 text-center uppercase mb-2">
                    {day}
                  </div>
                ))}
                
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const isToday = dateObj.toDateString() === new Date().toDateString();
                  const hasRecord = recordDates.has(dateObj.toDateString());
                  
                  return (
                    <button 
                      key={day}
                      onClick={() => handleDateClick(day)}
                      disabled={!hasRecord}
                      className={`
                        relative w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all
                        ${hasRecord 
                          ? activeTab === 'Sales' 
                            ? 'bg-green-50 text-[#11AB2F] border-2 border-green-100 active:scale-90' 
                            : 'bg-red-50 text-red-500 border-2 border-red-100 active:scale-90'
                          : 'text-slate-400 opacity-40 cursor-default'
                        }
                        ${isToday && !hasRecord ? 'bg-slate-100 text-slate-800' : ''}
                      `}
                    >
                      {day}
                      {hasRecord && (
                        <div className={`absolute bottom-1 w-1 h-1 rounded-full ${activeTab === 'Sales' ? 'bg-[#11AB2F]' : 'bg-red-500'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex items-center justify-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Select a highlighted date</p>
            </div>
          </motion.div>

          {/* Details Popup */}
          <AnimatePresence>
            {selectedDateDetails && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                  onClick={() => setSelectedDateDetails(null)}
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl border-2 border-[#11AB2F]/10 animate-shake"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">Activity Log</p>
                      <h5 className="text-lg font-black text-slate-900 tracking-tight leading-none">{selectedDateDetails.date}</h5>
                    </div>
                    <button 
                      onClick={() => setSelectedDateDetails(null)}
                      className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center active:scale-90 transition-all shadow-inner"
                    >
                      <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                    {selectedDateDetails.items.map((item, idx) => {
                      if (activeTab === 'Sales') {
                        const sale = item as Sale;
                        const qtyVal = getSaleQuantityValue(sale.quantity);
                        const rate = qtyVal > 0 ? sale.amount / qtyVal : 0;
                        return (
                          <div key={idx} className="bg-white rounded-[24px] border-2 border-green-100 overflow-hidden shadow-sm">
                            <div className="bg-green-50/50 px-4 py-3 border-b border-green-100 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#11AB2F] shadow-sm border border-green-100">
                                  <i className="fa-solid fa-cart-shopping text-xs"></i>
                                </div>
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Sale Record</span>
                              </div>
                              <span className="px-2.5 py-1 bg-white rounded-full text-[8px] font-black text-[#11AB2F] border border-green-200 uppercase tracking-tighter">Verified</span>
                            </div>
                            
                            <div className="p-4 space-y-4">
                              <div className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1">Market Location</p>
                                <p className="text-sm font-black text-slate-700">{sale.location || 'Local Mandi'}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 border border-slate-100 rounded-xl bg-white">
                                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Amount</p>
                                  <p className="text-base font-black text-[#11AB2F]">₹{formatCurrency(sale.amount)}</p>
                                </div>
                                <div className="p-3 border border-slate-100 rounded-xl bg-white">
                                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1">Quantity</p>
                                  <p className="text-base font-black text-slate-700">{sale.quantity}</p>
                                </div>
                              </div>

                              <div className="bg-[#11AB2F] rounded-xl p-3 flex items-center justify-between shadow-lg shadow-green-100 border border-[#11AB2F]/20">
                                <div className="flex items-center gap-2">
                                  <i className="fa-solid fa-chart-line text-white/60 text-xs"></i>
                                  <p className="text-[9px] text-white font-black uppercase tracking-widest">Average Rate</p>
                                </div>
                                <p className="text-lg font-black text-white">₹{rate.toFixed(2)}<span className="text-[10px] ml-1 opacity-70">/kg</span></p>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        const expense = item as Expense;
                        return (
                          <div key={idx} className="bg-white rounded-[24px] border-2 border-red-100 overflow-hidden shadow-sm">
                            <div className="bg-red-50/50 px-4 py-3 border-b border-red-100 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                                  <i className="fa-solid fa-receipt text-xs"></i>
                                </div>
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Expense Entry</span>
                              </div>
                              <div className="px-2.5 py-1 bg-white rounded-full text-[8px] font-black text-red-500 border border-red-200 uppercase tracking-tighter">
                                {expense.category}
                              </div>
                            </div>

                            <div className="p-4 space-y-3">
                              <div className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1">Particulars</p>
                                <p className="text-sm font-black text-slate-700">{expense.name}</p>
                              </div>

                              <div className="p-4 bg-red-500/5 border border-red-100 rounded-2xl flex items-center justify-between">
                                <div className="space-y-1">
                                  <p className="text-[8px] text-red-400 font-bold uppercase tracking-widest">Total Paid</p>
                                  <p className="text-2xl font-black text-red-500 tracking-tight">₹{formatCurrency(expense.amount)}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                  <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>

                  <div className="mt-8 text-center">
                    <button 
                      onClick={() => setSelectedDateDetails(null)}
                      className="px-8 py-3 bg-[#11AB2F] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MonitorCalendar;
