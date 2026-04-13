import React, { useState } from 'react';
import { Crop, Expense, Sale } from '../types';

interface CropRecordsViewProps {
  crops: Crop[];
  onBack: () => void;
}

interface UnifiedTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'sale' | 'expense';
  title: string;
  cropName: string;
  meta?: string;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN').format(val);

const CropRecordsView: React.FC<CropRecordsViewProps> = ({ crops, onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // 1. Flatten all expenses and sales from every crop into a single transaction pool
  const allTransactions: UnifiedTransaction[] = [];
  crops.forEach(crop => {
    (crop.expenses || []).forEach((exp: Expense) => {
      allTransactions.push({
        id: exp.id,
        date: exp.date,
        amount: exp.amount,
        type: 'expense',
        title: exp.name,
        cropName: crop.name,
        meta: exp.category
      });
    });
    (crop.sales || []).forEach((sale: Sale) => {
      allTransactions.push({
        id: sale.id,
        date: sale.date,
        amount: sale.amount,
        type: 'sale',
        title: sale.quantity,
        cropName: crop.name,
        meta: sale.location
      });
    });
  });

  // 2. Group transactions by the month and year of the transaction (e.g., "February 2026")
  const groupedByMonth = allTransactions.reduce((acc, tx) => {
    const date = new Date(tx.date);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(tx);
    return acc;
  }, {} as Record<string, UnifiedTransaction[]>);

  // 3. Sort months (newest first)
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const getMonthlyTotals = (txs: UnifiedTransaction[]) => {
    const totals = txs.reduce(
      (acc, tx) => {
        if (tx.type === 'expense') acc.expenses += tx.amount;
        else acc.sales += tx.amount;
        return acc;
      },
      { expenses: 0, sales: 0 }
    );
    return { ...totals, profit: totals.sales - totals.expenses };
  };

  const renderMonthCard = (month: string) => {
    const monthTxs = groupedByMonth[month];
    const totals = getMonthlyTotals(monthTxs);
    const isProfit = totals.profit >= 0;
    
    const uniqueCropCount = new Set(monthTxs.map(tx => tx.cropName)).size;

    return (
      <div 
        key={month}
        className="w-full bg-white rounded-[28px] border-2 border-[#11AB2F] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(17,171,47,0.1)] transition-all duration-300 overflow-hidden flex flex-col mb-5"
      >
        {/* Card Header */}
        <div className="p-5 flex items-start justify-between bg-gradient-to-r from-slate-50/50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-[#11AB2F] border-2 border-[#11AB2F]/20 shadow-sm">
              <i className="fa-solid fa-folder-open text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">{month}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-[#11AB2F] text-white">
                  Monthly Report
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {monthTxs.length} Transactions
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex -space-x-2 mb-1">
              {[...Array(Math.min(uniqueCropCount, 3))].map((_, i) => (
                <div 
                  key={i} 
                  className="w-7 h-7 rounded-full bg-white border-2 border-[#11AB2F]/20 flex items-center justify-center text-[#11AB2F] shadow-sm"
                >
                  <i className="fa-solid fa-leaf text-[8px]"></i>
                </div>
              ))}
            </div>
            <span className="text-[9px] font-black text-[#11AB2F] uppercase tracking-tighter">
              {uniqueCropCount} Crops Tracked
            </span>
          </div>
        </div>

        {/* Card Body - Structured Data */}
        <div className="px-5 py-4 grid grid-cols-2 gap-4 border-t border-[#11AB2F]/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
              <i className="fa-solid fa-arrow-up-from-bracket text-xs"></i>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Total Sales</p>
              <p className="text-xs font-black text-green-600">₹{formatCurrency(totals.sales)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
              <i className="fa-solid fa-arrow-down-wide-short text-xs"></i>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Total Expenses</p>
              <p className="text-xs font-black text-red-500">₹{formatCurrency(totals.expenses)}</p>
            </div>
          </div>
        </div>

        {/* Card Footer - Profit & Explore */}
        <div className="p-4 flex items-center justify-between gap-3 border-t border-[#11AB2F]/10 bg-slate-50/30">
          <div className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border ${isProfit ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            <i className={`fa-solid ${isProfit ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} text-[10px]`}></i>
            <span className="text-xs font-black tracking-tight">
              {isProfit ? 'Net Profit' : 'Net Loss'}: ₹{formatCurrency(Math.abs(totals.profit))}
            </span>
          </div>
          <button 
            onClick={() => setSelectedMonth(month)}
            className="flex-1 py-2.5 bg-[#11AB2F] text-white rounded-2xl font-black text-xs shadow-md shadow-green-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            Explore
            <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>
      </div>
    );
  };

  const renderDetailView = () => {
    if (!selectedMonth) return null;
    const monthTxs = groupedByMonth[selectedMonth];

    // Grouping the month's transactions by Crop
    const cropGroups = monthTxs.reduce((acc, tx) => {
      if (!acc[tx.cropName]) {
        acc[tx.cropName] = {
          name: tx.cropName,
          sales: 0,
          expenses: 0,
          txCount: 0
        };
      }
      if (tx.type === 'sale') acc[tx.cropName].sales += tx.amount;
      else acc[tx.cropName].expenses += tx.amount;
      acc[tx.cropName].txCount += 1;
      return acc;
    }, {} as Record<string, { name: string, sales: number, expenses: number, txCount: number }>);

    const sortedCropGroups = Object.values(cropGroups).sort((a, b) => b.sales - a.sales);

    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-3 px-4 py-3 bg-white sticky top-0 z-50 border-b border-slate-50 shadow-sm">
          <button onClick={() => setSelectedMonth(null)} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 active:scale-90 transition-all">
            <i className="fa-solid fa-arrow-left text-slate-800 text-sm"></i>
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{selectedMonth}</h2>
            <p className="text-[9px] text-[#11AB2F] font-bold uppercase tracking-widest leading-none mt-0.5">Monthly Crop Records</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          <div className="flex items-center justify-between px-1 mb-1">
             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Crop Performance</h4>
             <span className="text-[8px] font-black text-[#11AB2F] bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100">{sortedCropGroups.length} Crops</span>
          </div>
          
          {sortedCropGroups.map(group => {
            const profit = group.sales - group.expenses;
            const isProfit = profit >= 0;

            return (
              <div 
                key={group.name} 
                className="bg-white rounded-[24px] p-4 border-2 border-[#11AB2F]/20 shadow-sm hover:shadow-md hover:border-[#11AB2F] transition-all group flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#11AB2F] shadow-sm border border-[#11AB2F]/10 group-hover:scale-105 transition-transform">
                      <i className="fa-solid fa-leaf text-base"></i>
                    </div>
                    <div>
                      <h5 className="font-black text-slate-800 text-sm leading-tight">{group.name}</h5>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{group.txCount} Records</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sales</p>
                      <p className="text-xs font-black text-green-600">₹{formatCurrency(group.sales)}</p>
                    </div>
                    <div className="w-px h-6 bg-slate-200"></div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Expenses</p>
                      <p className="text-xs font-black text-red-500">₹{formatCurrency(group.expenses)}</p>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-3">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Result</p>
                  <div className={`px-3 py-1.5 rounded-xl font-black text-xs inline-block shadow-sm border ${isProfit ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    {isProfit ? '+' : '-'}₹{formatCurrency(Math.abs(profit))}
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="h-24" />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3 px-4 py-4 sticky top-0 z-50 bg-white">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 active:scale-90 transition-all">
          <i className="fa-solid fa-arrow-left text-slate-800 text-sm"></i>
        </button>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">Crop Revenue</h2>
          <p className="text-[9px] text-[#11AB2F] font-bold uppercase tracking-widest mt-0.5">Monthly Folders</p>
        </div>
      </div>

      <div className="px-4">
        {sortedMonths.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[24px] border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-slate-200 shadow-sm">
              <i className="fa-solid fa-money-bill-transfer text-2xl"></i>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">No history yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1 mb-4">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">All Records</span>
                  <span className="text-base font-black text-slate-900 leading-none tracking-tight">Financial Folders</span>
               </div>
               <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                 {sortedMonths.length} MONTHS
               </span>
            </div>
            {sortedMonths.map(renderMonthCard)}
          </div>
        )}
      </div>

      {renderDetailView()}
    </div>
  );
};

export default CropRecordsView;