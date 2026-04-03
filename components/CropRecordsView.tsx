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
        onClick={() => setSelectedMonth(month)}
        className="bg-white rounded-[24px] p-4 shadow-sm border-[1.5px] border-[#11AB2F]/50 hover:border-[#11AB2F] flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer mb-3.5 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#11AB2F]/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none group-hover:bg-[#11AB2F]/10 transition-colors"></div>
        
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
             <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center text-[#11AB2F] shadow-inner">
                <i className="fa-solid fa-folder-closed text-[12px]"></i>
             </div>
             <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">{month}</h3>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sales</span>
              <span className="text-[11px] font-bold text-slate-700">₹{formatCurrency(totals.sales)}</span>
            </div>
            <div className="flex flex-col border-l border-slate-100 pl-4">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Expenses</span>
              <span className="text-[11px] font-bold text-slate-700">₹{formatCurrency(totals.expenses)}</span>
            </div>
            <div className="flex flex-col border-l border-slate-100 pl-4">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Profit</span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${isProfit ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                ₹{formatCurrency(Math.abs(totals.profit))}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0 ml-4 relative z-10">
          <div className="flex -space-x-2">
            {[...Array(Math.min(uniqueCropCount, 2))].map((_, i) => (
              <div 
                key={i} 
                className="w-7 h-7 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-[#11AB2F] shadow-sm"
              >
                <i className="fa-solid fa-leaf text-[8px]"></i>
              </div>
            ))}
            {uniqueCropCount > 2 && (
              <div className="w-7 h-7 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-slate-400 text-[8px] font-bold">
                +{uniqueCropCount - 2}
              </div>
            )}
          </div>
          <span className="text-[9px] font-black text-[#11AB2F] uppercase tracking-tighter bg-white px-2 py-0.5 rounded-lg border border-[#11AB2F]/10 shadow-sm">
            {uniqueCropCount} Crops
          </span>
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
        <div className="flex items-center gap-4 px-5 py-4 bg-white sticky top-0 z-50 border-b border-slate-50 shadow-sm">
          <button onClick={() => setSelectedMonth(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 active:scale-90 transition-all">
            <i className="fa-solid fa-arrow-left text-slate-800"></i>
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{selectedMonth}</h2>
            <p className="text-[10px] text-[#11AB2F] font-bold uppercase tracking-widest leading-none mt-1">Monthly Crop Records</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          <div className="flex items-center justify-between px-1 mb-2">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crop Performance</h4>
             <span className="text-[9px] font-black text-[#11AB2F] bg-green-50 px-2 py-1 rounded-md border border-green-100">{sortedCropGroups.length} Crops</span>
          </div>
          
          {sortedCropGroups.map(group => {
            const profit = group.sales - group.expenses;
            const isProfit = profit >= 0;

            return (
              <div key={group.name} className="bg-slate-50/50 rounded-[28px] p-5 border border-slate-100 flex items-center justify-between transition-all group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#11AB2F] shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-leaf text-sm"></i>
                    </div>
                    <div>
                      <h5 className="font-black text-slate-800 text-base leading-tight">{group.name}</h5>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{group.txCount} Records this month</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Sales</p>
                      <p className="text-xs font-bold text-green-600">₹{formatCurrency(group.sales)}</p>
                    </div>
                    <div className="w-px h-6 bg-slate-200"></div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Expenses</p>
                      <p className="text-xs font-bold text-red-500">₹{formatCurrency(group.expenses)}</p>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Profit</p>
                  <div className={`px-3 py-1.5 rounded-2xl font-black text-sm inline-block shadow-sm ${isProfit ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    {isProfit ? '+' : '-'}₹{formatCurrency(Math.abs(profit))}
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="h-28" />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4 px-5 py-6 sticky top-0 z-50 bg-white">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 active:scale-90 transition-all">
          <i className="fa-solid fa-arrow-left text-slate-800"></i>
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Crop Revenue</h2>
          <p className="text-[10px] text-[#11AB2F] font-bold uppercase tracking-widest mt-1">Monthly Folders</p>
        </div>
      </div>

      <div className="px-5">
        {sortedMonths.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm">
              <i className="fa-solid fa-money-bill-transfer text-3xl"></i>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No transaction history yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1 mb-5">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All Records</span>
                  <span className="text-lg font-black text-slate-900 leading-none tracking-tight">Financial Folders</span>
               </div>
               <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
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