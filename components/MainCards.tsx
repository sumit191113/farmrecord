
import React from 'react';

interface MainCardsProps {
  onNavigateToCrops: () => void;
  onNavigateToRecords: () => void;
}

const MainCards: React.FC<MainCardsProps> = ({ onNavigateToCrops, onNavigateToRecords }) => {
  return (
    <div className="space-y-4">
      {/* My Crops Card */}
      <button 
        onClick={onNavigateToCrops}
        className="w-full text-left bg-white border-[3px] border-[#11AB2F] rounded-[24px] p-5 flex items-center justify-between shadow-[0_10px_25px_rgba(17,171,47,0.1)] hover:shadow-[0_15px_35px_rgba(17,171,47,0.15)] group transition-all active:scale-[0.98] bg-gradient-to-br from-white to-green-50/50"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center border border-[#11AB2F]/10">
            <i className="fa-solid fa-leaf text-[#11AB2F] text-2xl"></i>
          </div>
          <div>
            <h4 className="text-slate-800 text-lg font-bold tracking-tight">My Crops</h4>
            <p className="text-slate-500 text-sm">Record crop income & costs</p>
          </div>
        </div>
        <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:translate-x-1">
          <i className="fa-solid fa-chevron-right text-[#11AB2F]"></i>
        </div>
      </button>

      {/* Crop Revenue Card - Now featuring the circular arrow icon */}
      <button 
        onClick={onNavigateToRecords}
        className="w-full text-left bg-white border-[3px] border-[#11AB2F] rounded-[24px] p-5 flex items-center justify-between shadow-[0_10px_25px_rgba(17,171,47,0.1)] hover:shadow-[0_15px_35px_rgba(17,171,47,0.15)] group transition-all active:scale-[0.98] bg-gradient-to-br from-white to-green-50/50"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center border border-[#11AB2F]/10">
            <i className="fa-solid fa-file-invoice-dollar text-[#11AB2F] text-2xl"></i>
          </div>
          <div>
            <h4 className="text-slate-800 text-lg font-bold tracking-tight">Crop Revenue</h4>
            <p className="text-slate-500 text-sm">View expense & profit history</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-[#11AB2F] rounded-full flex items-center justify-center shadow-md shadow-green-100 transition-transform group-hover:translate-x-1">
          <i className="fa-solid fa-arrow-right text-white"></i>
        </div>
      </button>
    </div>
  );
};

export default MainCards;
