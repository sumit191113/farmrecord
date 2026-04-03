
import React, { useState } from 'react';
import { Earning } from '../types';

interface EarningsViewProps {
  earnings: Earning[];
  onAddEarning: (earning: Earning) => void;
  onDeleteEarning: (id: string) => Promise<void>;
  onBack: () => void;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN').format(val);

const EarningsView: React.FC<EarningsViewProps> = ({ earnings, onAddEarning, onDeleteEarning, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [earningToDelete, setEarningToDelete] = useState<Earning | null>(null);
  const [newEarning, setNewEarning] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    location: 'Mandi',
    newLocation: ''
  });
  const [locations, setLocations] = useState(['Ahmedpur', 'Udhauli', 'Mandi']);
  const [showNewLocationInput, setShowNewLocationInput] = useState(false);

  // Group earnings by month
  const groupedEarnings = earnings.reduce((acc, earning) => {
    const date = new Date(earning.date);
    const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(earning);
    return acc;
  }, {} as Record<string, Earning[]>);

  // Months found in the data, sorted by date (newest first)
  const months = Object.keys(groupedEarnings).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  const handleSave = () => {
    if (!newEarning.amount) return;
    const location = showNewLocationInput ? newEarning.newLocation : newEarning.location;
    if (showNewLocationInput && newEarning.newLocation && !locations.includes(newEarning.newLocation)) {
      setLocations([...locations, newEarning.newLocation]);
    }
    onAddEarning({
      id: Date.now().toString(),
      date: newEarning.date,
      amount: parseFloat(newEarning.amount),
      location: location || 'Unknown'
    });
    setIsModalOpen(false);
    setNewEarning({ date: new Date().toISOString().split('T')[0], amount: '', location: 'Mandi', newLocation: '' });
    setShowNewLocationInput(false);
  };

  const confirmDelete = async () => {
    if (earningToDelete) {
      await onDeleteEarning(earningToDelete.id);
      setEarningToDelete(null);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4 px-5 py-4 bg-white border-b border-slate-100 sticky top-0 z-50">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-90 transition-all">
          <i className="fa-solid fa-arrow-left text-slate-800"></i>
        </button>
        <h2 className="text-xl font-bold text-slate-900">Total Earnings</h2>
      </div>

      <div className="p-5 space-y-4">
        {months.length > 0 ? (
          months.map((month) => {
            const monthEarnings = groupedEarnings[month];
            const total = monthEarnings.reduce((s, e) => s + e.amount, 0);
            const isExpanded = expandedMonths[month] ?? false; // Default to collapsed

            return (
              <div key={month} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                {/* Folder Header - Toggle Button */}
                <button 
                  onClick={() => toggleMonth(month)}
                  className="w-full flex items-center justify-between bg-gradient-to-r from-white to-green-50/30 p-4 text-left outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#11AB2F] text-white' : 'bg-green-50 text-[#11AB2F]'}`}>
                      <i className={`fa-solid ${isExpanded ? 'fa-folder-open' : 'fa-folder'} text-sm`}></i>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">{month}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{monthEarnings.length} Records</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none mb-1">Total</span>
                      <span className="text-sm font-black text-[#11AB2F]">₹{formatCurrency(total)}</span>
                    </div>
                    <i className={`fa-solid fa-chevron-down text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                  </div>
                </button>

                {/* Expandable Content */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="px-2 pb-2 divide-y divide-slate-50 border-t border-slate-50">
                    {monthEarnings.map((earning) => (
                      <div key={earning.id} className="p-3 mx-2 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100">
                            <i className="fa-solid fa-location-dot text-[10px]"></i>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-700 text-xs">{earning.location}</h4>
                            <p className="text-[9px] text-slate-400 font-medium">{new Date(earning.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 text-sm">₹{formatCurrency(earning.amount)}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEarningToDelete(earning); }}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center active:scale-90 transition-all opacity-100"
                            aria-label="Delete earning"
                          >
                            <i className="fa-solid fa-trash-can text-[10px]"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-money-bill-trend-up text-3xl text-slate-300"></i>
            </div>
            <p className="text-slate-500 font-medium">No earnings recorded yet</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#11AB2F] text-white rounded-full shadow-lg shadow-green-200 flex items-center justify-center active:scale-90 transition-all z-[70] border-4 border-white"
      >
        <i className="fa-solid fa-plus text-xl"></i>
      </button>

      {/* Add Earning Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-10 shadow-2xl relative animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">New Earning</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-90">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Date</label>
                <input 
                  type="date"
                  value={newEarning.date}
                  onChange={e => setNewEarning({...newEarning, date: e.target.value})}
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
                {!showNewLocationInput ? (
                  <select 
                    value={newEarning.location}
                    onChange={e => {
                      if (e.target.value === 'ADD_NEW') setShowNewLocationInput(true);
                      else setNewEarning({...newEarning, location: e.target.value});
                    }}
                    className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all"
                  >
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    <option value="ADD_NEW">+ Add New Location</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      placeholder="Enter Location Name"
                      value={newEarning.newLocation}
                      onChange={e => setNewEarning({...newEarning, newLocation: e.target.value})}
                      className="flex-1 px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all"
                    />
                    <button onClick={() => setShowNewLocationInput(false)} className="px-4 bg-slate-100 rounded-2xl text-slate-400"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Earning Amount (₹)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                  <input 
                    type="number"
                    value={newEarning.amount}
                    onChange={e => setNewEarning({...newEarning, amount: e.target.value})}
                    placeholder="0.00" 
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all font-bold"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-5 bg-gradient-to-r from-[#11AB2F] to-[#2ecc71] text-white rounded-[20px] font-bold text-lg shadow-lg shadow-green-200 active:scale-95 transition-all mt-8"
            >
              Save Earning
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {earningToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEarningToDelete(null)}></div>
          <div className="bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <i className="fa-solid fa-trash-can text-2xl"></i>
            </div>
            <h4 className="text-xl font-bold text-center text-slate-900 mb-2">Delete Earning?</h4>
            <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">Are you sure you want to delete this earning record of <span className="font-bold text-slate-800">₹{formatCurrency(earningToDelete.amount)}</span>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setEarningToDelete(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm active:scale-95 transition-all">Cancel</button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-100 active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsView;
