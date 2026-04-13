import React from 'react';

interface ActionItemProps {
  icon: string;
  label: string;
  onClick?: () => void;
}

const ActionItem: React.FC<ActionItemProps> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center group w-1/4 focus:outline-none">
    <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center mb-2 transition-all group-hover:shadow-md group-active:scale-90 group-active:bg-slate-50">
      <div className="w-10 h-10 rounded-full border-2 border-[#11AB2F]/20 flex items-center justify-center">
        <i className={`${icon} text-lg text-[#11AB2F]`}></i>
      </div>
    </div>
    <span className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-tight leading-tight px-1">
      {label}
    </span>
  </button>
);

interface QuickActionsProps {
  onAction?: (label: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const actions = [
    { icon: 'fa-solid fa-gear', label: 'Settings' },
    { icon: 'fa-solid fa-camera', label: 'Track' },
    { icon: 'fa-solid fa-arrow-trend-up', label: 'Earning' },
    { icon: 'fa-solid fa-money-bill-wave', label: 'Revenue' },
  ];

  return (
    <div className="flex justify-between items-start w-full">
      {actions.map((action, idx) => (
        <ActionItem key={idx} {...action} onClick={() => onAction?.(action.label)} />
      ))}
    </div>
  );
};

export default QuickActions;