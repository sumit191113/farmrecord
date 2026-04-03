import React, { useState } from 'react';
import { Earning } from '../types';

interface ReportsViewProps {
  earnings: Earning[];
  onBack: () => void;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN').format(val);

const ReportsView: React.FC<ReportsViewProps> = ({ earnings, onBack }) => {
  const [filterLocation, setFilterLocation] = useState('All');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  
  const locations = ['All', ...Array.from(new Set(earnings.map(e => e.location)))];
  
  const filteredEarnings = filterLocation === 'All' 
    ? earnings 
    : earnings.filter(e => e.location === filterLocation);

  const totalFiltered = filteredEarnings.reduce((s, e) => s + e.amount, 0);

  // Group filtered earnings by month
  const groupedEarnings = filteredEarnings.reduce((acc, earning) => {
    const date = new Date(earning.date);
    const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(earning);
    return acc;
  }, {} as Record<string, Earning[]>);

  const months = Object.keys(groupedEarnings);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  return (
    <div className="bg-slate-50 min-h-screen animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4 px-5 py-4 bg-white border-b border-slate-100 sticky top-0 z-50">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-90 transition-all">
          <i className="fa-solid fa-arrow-left text-slate-800"></i>
        </button>
        <h2 className="text-xl font-bold text-slate-900">Revenue</h2>
      </div>

      <div className="p-5 space-y-6">
        {/* Slidable Location Selector */}
        <div className="relative">
          <div className="overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            <div className="flex items-center gap-2 min-w-max">
              {locations.map(loc => (
                <button
                  key={loc}
                  onClick={() => setFilterLocation(loc)}
                  className={`px-5 py-2 rounded-2xl font-bold text-xs transition-all shadow-sm border whitespace-nowrap ${
                    filterLocation === loc 
                      ? 'bg-[#11AB2F] text-white border-[#11AB2F] shadow-green-100' 
                      : 'bg-white text-slate-500 border-slate-100 hover:border-[#11AB2F]/30'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compact Summary Card */}
        <div className="bg-gradient-to-br from-white to-green-50 rounded-[24px] p-5 border-2 border-[#11AB2F]/30 shadow-md shadow-green-900/5 flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none mb-1.5">
              Total {filterLocation} Earnings
            </p>
            <h3 className="text-2xl font-black text-[#11AB2F] tracking-tight">₹{formatCurrency(totalFiltered)}</h3>
          </div>
          <div className="w-12 h-12 bg-[#11AB2F] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-100">
            <i className="fa-solid fa-chart-line text-lg"></i>
          </div>
        </div>

        {/* Filtered Records - Accordion Style */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Earning Records</h4>
            <span className="text-[10px] bg-slate-200/50 text-slate-500 px-2 py-0.5 rounded-full font-bold">
              {filteredEarnings.length} Items
            </span>
          </div>
          
          {months.length === 0 ? (
            <div className="bg-white rounded-[24px] p-10 text-center border border-slate-100">
              <i className="fa-solid fa-magnifying-glass text-slate-200 text-3xl mb-3"></i>
              <p className="text-slate-400 font-medium">No records found for this location</p>
            </div>
          ) : (
            <div className="space-y-3">
              {months.map((month) => {
                const monthEarnings = groupedEarnings[month];
                const totalMonth = monthEarnings.reduce((s, e) => s + e.amount, 0);
                const isExpanded = expandedMonths[month] ?? false; // Default to collapsed

                return (
                  <div key={month} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                    {/* Month Header / Toggle */}
                    <button 
                      onClick={() => toggleMonth(month)}
                      className="w-full flex items-center justify-between p-4 text-left outline-none bg-gradient-to-r from-white to-green-50/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#11AB2F] text-white' : 'bg-green-50 text-[#11AB2F]'}`}>
                          <i className={`fa-solid ${isExpanded ? 'fa-folder-open' : 'fa-folder'} text-xs`}></i>
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-sm block leading-tight">{month}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{monthEarnings.length} Records</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none mb-0.5">Subtotal</span>
                          <span className="text-xs font-black text-[#11AB2F]">₹{formatCurrency(totalMonth)}</span>
                        </div>
                        <i className={`fa-solid fa-chevron-down text-slate-300 text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                      </div>
                    </button>

                    {/* Expandable List of Records */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="px-2 pb-2 divide-y divide-slate-50 border-t border-slate-50">
                        {monthEarnings.map((earning) => (
                          <div key={earning.id} className="p-3 mx-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100">
                                <i className="fa-solid fa-receipt text-[10px]"></i>
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-700 text-[11px]">{earning.location}</h4>
                                <p className="text-[9px] text-slate-400 font-medium">{new Date(earning.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                              </div>
                            </div>
                            <span className="font-bold text-slate-900 text-xs">₹{formatCurrency(earning.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;