
import React from 'react';
import { FarmSummary } from '../types';

interface SummaryBoxProps {
  data: FarmSummary;
}

const SummaryBox: React.FC<SummaryBoxProps> = ({ data }) => {
  // Format currency with Indian locale (en-IN) for Lakhs/Crores placement
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  // Calculate real-time profit margin percentage
  // Profit Margin = (Net Profit / Total Sales) * 100
  const marginPercentage = data.totalSales > 0 
    ? (data.netProfit / data.totalSales) * 100 
    : 0;
  
  const isPositive = data.netProfit >= 0;

  return (
    <div className="bg-gradient-to-br from-[#11AB2F] to-[#0A8C23] rounded-[24px] p-5 text-white shadow-lg shadow-green-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Net Profit</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h2 className="text-2xl font-bold tracking-tight">
              ₹{formatCurrency(data.netProfit)}
            </h2>
            {/* Dynamic Percentage Badge: White background with Red/Green text */}
            <span className={`text-[10px] bg-white px-2 py-0.5 rounded-full flex items-center gap-1 font-black shadow-sm ${isPositive ? 'text-[#11AB2F]' : 'text-red-500'}`}>
              <i className={`fa-solid ${isPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} text-[8px]`}></i>
              {Math.abs(marginPercentage).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <i className="fa-solid fa-scale-balanced text-xl"></i>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          {/* Expenses Section */}
          <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center shrink-0 border border-red-500/30">
            <i className="fa-solid fa-arrow-down text-[10px] text-red-200"></i>
          </div>
          <div className="overflow-hidden">
            <p className="text-[9px] text-red-100 uppercase font-bold tracking-tight truncate">Expenses</p>
            <p className="text-sm font-bold truncate text-red-100">₹{formatCurrency(data.totalExpenses)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Sales Section */}
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
            <i className="fa-solid fa-arrow-up text-[10px] text-green-200"></i>
          </div>
          <div className="overflow-hidden">
            <p className="text-[9px] text-white/70 uppercase font-bold tracking-tight truncate">Sales</p>
            <p className="text-sm font-bold truncate text-white">₹{formatCurrency(data.totalSales)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryBox;
