
import React, { useState, useRef, useEffect } from 'react';
import { Crop, AppView, Expense, Sale } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CropManagementProps {
  view: AppView;
  crops: Crop[];
  activeCrop?: Crop;
  onNavigate: (view: AppView, id?: string) => void;
  setCrops: (updated: Crop[] | ((prev: Crop[]) => Crop[])) => void;
  onSurgicalSave: (crop: Crop) => Promise<void>;
  onSurgicalDelete: (id: string) => Promise<void>;
  isAddModalOpen?: boolean;
  setIsAddModalOpen?: (open: boolean) => void;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN').format(val);

const getTotalQuantity = (sales: Sale[]) => {
  if (!sales || sales.length === 0) return '0';
  let total = 0;
  let unit = '';
  
  sales.forEach(sale => {
    const qtyStr = sale.quantity || '';
    const numMatch = qtyStr.match(/(\d+(\.\d+)?)/);
    if (numMatch) {
      total += parseFloat(numMatch[1]);
      const unitMatch = qtyStr.match(/[a-zA-Z]+/);
      if (unitMatch && !unit) {
        unit = unitMatch[0];
      }
    }
  });
  
  const formattedTotal = Number.isInteger(total) ? total.toString() : total.toFixed(2);
  return `${formattedTotal}${unit ? ' ' + unit : ''}`;
};

const getTotalQuantityValue = (sales: Sale[]) => {
  if (!sales || sales.length === 0) return 0;
  let total = 0;
  sales.forEach(sale => {
    const qtyStr = sale.quantity || '';
    const numMatch = qtyStr.match(/(\d+(\.\d+)?)/);
    if (numMatch) {
      let val = parseFloat(numMatch[1]);
      const unit = qtyStr.toLowerCase();
      if (unit.includes('qtl') || unit.includes('quintal')) {
        val *= 100;
      } else if (unit.includes('ton')) {
        val *= 1000;
      }
      total += val;
    }
  });
  return total;
};

const CropManagement: React.FC<CropManagementProps> = ({ 
  view, 
  crops, 
  activeCrop, 
  onNavigate, 
  setCrops, 
  onSurgicalSave,
  onSurgicalDelete,
  isAddModalOpen, 
  setIsAddModalOpen 
}) => {
  
  // Local form states
  const [newCrop, setNewCrop] = useState<{
    name: string;
    date: string;
    area: string;
    unit: 'Acre' | 'Bigha' | 'Meter Square';
  }>({ 
    name: '', 
    date: new Date().toISOString().split('T')[0], 
    area: '', 
    unit: 'Acre' 
  });
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [newSale, setNewSale] = useState({ quantity: '', location: '', amount: '', date: new Date().toISOString().split('T')[0] });

  // Custom Dropdown State
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUnitDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [expandedCrops, setExpandedCrops] = useState<Record<string, boolean>>({});
  const [inlineExpenses, setInlineExpenses] = useState<Record<string, { name: string; amount: string; date: string }>>({});
  const [inlineSales, setInlineSales] = useState<Record<string, { quantity: string; location: string; amount: string; date: string }>>({});

  const [cropToDelete, setCropToDelete] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'expense' | 'sale' } | null>(null);
  const [downloadConfirm, setDownloadConfirm] = useState<'Expenses' | 'Sales' | null>(null);

  const toggleCropExpansion = (id: string) => {
    setExpandedCrops(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleInlineExpenseChange = (cropId: string, field: string, value: string) => {
    setInlineExpenses(prev => ({
      ...prev,
      [cropId]: {
        ...(prev[cropId] || { name: '', amount: '', date: new Date().toISOString().split('T')[0] }),
        [field]: value
      }
    }));
  };

  const saveInlineExpense = (cropId: string) => {
    const data = inlineExpenses[cropId];
    if (!data || !data.name || !data.amount) return;
    const exp: Expense = {
      id: Date.now().toString(),
      date: data.date || new Date().toISOString().split('T')[0],
      name: data.name,
      category: 'General',
      amount: parseFloat(data.amount)
    };
    
    const crop = crops.find(c => c.id === cropId);
    if (crop) {
      const updatedCrop = { ...crop, expenses: [...(crop.expenses || []), exp] };
      onSurgicalSave(updatedCrop);
    }

    setInlineExpenses(prev => ({
      ...prev,
      [cropId]: { name: '', amount: '', date: new Date().toISOString().split('T')[0] }
    }));
  };

  const handleInlineSaleChange = (cropId: string, field: string, value: string) => {
    setInlineSales(prev => ({
      ...prev,
      [cropId]: {
        ...(prev[cropId] || { quantity: '', location: '', amount: '', date: new Date().toISOString().split('T')[0] }),
        [field]: value
      }
    }));
  };

  const saveInlineSale = (cropId: string) => {
    const data = inlineSales[cropId];
    if (!data || !data.quantity || !data.amount) return;
    const sale: Sale = {
      id: Date.now().toString(),
      date: data.date || new Date().toISOString().split('T')[0],
      quantity: data.quantity,
      location: data.location,
      amount: parseFloat(data.amount)
    };
    
    const crop = crops.find(c => c.id === cropId);
    if (crop) {
      const updatedCrop = { ...crop, sales: [...(crop.sales || []), sale] };
      onSurgicalSave(updatedCrop);
    }

    setInlineSales(prev => ({
      ...prev,
      [cropId]: { quantity: '', location: '', amount: '', date: new Date().toISOString().split('T')[0] }
    }));
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!activeCrop) return;
    const updatedExpenses = (activeCrop.expenses || []).filter(e => e.id !== expenseId);
    const updatedCrop = { ...activeCrop, expenses: updatedExpenses };
    onSurgicalSave(updatedCrop);
    setItemToDelete(null);
  };

  const handleDeleteSale = (saleId: string) => {
    if (!activeCrop) return;
    const updatedSales = (activeCrop.sales || []).filter(s => s.id !== saleId);
    const updatedCrop = { ...activeCrop, sales: updatedSales };
    onSurgicalSave(updatedCrop);
    setItemToDelete(null);
  };

  const handleAddCrop = () => {
    if (!newCrop.name || !newCrop.date || !newCrop.area) return;
    if (isEditing) {
      const crop = crops.find(c => c.id === isEditing);
      if (crop) {
        const updatedCrop = {
          ...crop,
          name: newCrop.name,
          type: newCrop.name,
          sowingDate: newCrop.date,
          area: newCrop.area,
          unit: newCrop.unit
        };
        onSurgicalSave(updatedCrop);
      }
      setIsEditing(null);
    } else {
      const crop: Crop = {
        id: Date.now().toString(),
        name: newCrop.name,
        type: newCrop.name,
        sowingDate: newCrop.date,
        area: newCrop.area,
        unit: newCrop.unit,
        expenses: [],
        sales: [],
        status: 'Active'
      };
      onSurgicalSave(crop);
    }
    setIsAddModalOpen?.(false);
    setNewCrop({ name: '', date: new Date().toISOString().split('T')[0], area: '', unit: 'Acre' });
    if (view !== 'my-crops') onNavigate('my-crops');
  };

  const handleEditCrop = (e: React.MouseEvent, crop: Crop) => {
    e.stopPropagation();
    setNewCrop({
      name: crop.name,
      date: crop.sowingDate,
      area: crop.area,
      unit: crop.unit
    });
    setIsEditing(crop.id);
    setIsAddModalOpen?.(true);
  };

  const confirmDeleteCrop = () => {
    if (cropToDelete) {
      onSurgicalDelete(cropToDelete);
      setCropToDelete(null);
    }
  };

  const handleAddExpense = () => {
    if (!activeCrop || !newExpense.name || !newExpense.amount) return;
    const exp: Expense = {
      id: Date.now().toString(),
      date: newExpense.date || new Date().toISOString().split('T')[0],
      name: newExpense.name,
      category: 'General',
      amount: parseFloat(newExpense.amount)
    };
    const updatedCrop = { ...activeCrop, expenses: [...(activeCrop.expenses || []), exp] };
    onSurgicalSave(updatedCrop);
    setIsExpenseModalOpen(false);
    setNewExpense({ name: '', amount: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleAddSale = () => {
    if (!activeCrop || !newSale.quantity || !newSale.amount) return;
    const sale: Sale = {
      id: Date.now().toString(),
      date: newSale.date || new Date().toISOString().split('T')[0],
      quantity: newSale.quantity,
      location: newSale.location,
      amount: parseFloat(newSale.amount)
    };
    const updatedCrop = { ...activeCrop, sales: [...(activeCrop.sales || []), sale] };
    onSurgicalSave(updatedCrop);
    setIsSaleModalOpen(false);
    setNewSale({ quantity: '', location: '', amount: '', date: new Date().toISOString().split('T')[0] });
  };

  const downloadPDF = (type: 'Expenses' | 'Sales') => {
    if (!activeCrop) return;
    
    const doc = new jsPDF();
    const data = type === 'Expenses' ? (activeCrop.expenses || []) : (activeCrop.sales || []);
    const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const tableData = sortedData.map((item, index) => [
      index + 1,
      new Date(item.date).toLocaleDateString('en-IN'),
      type === 'Expenses' ? (item as Expense).name : (item as Sale).quantity + ( (item as Sale).location ? ` (${(item as Sale).location})` : '' ),
      `Rs. ${formatCurrency(item.amount)}`
    ]);

    doc.setFontSize(18);
    doc.text(`${activeCrop.name} - ${type} Report`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 30);

    autoTable(doc, {
      startY: 35,
      head: [['SR.NO', 'Date', `${type === 'Expenses' ? 'Expense' : 'Sales'} Name`, 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [17, 171, 47], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        3: { cellWidth: 40, halign: 'right' }
      }
    });

    const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total ${type}: Rs. ${formatCurrency(total)}`, 14, finalY + 10);

    doc.save(`${activeCrop.name}_${type}_Report.pdf`);
    setDownloadConfirm(null);
  };

  const renderHeader = (title: string, backView: AppView, backId?: string, onDownload?: () => void) => (
    <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate(backView, backId)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-90 transition-all">
          <i className="fa-solid fa-arrow-left text-slate-800"></i>
        </button>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
      {onDownload && (
        <button 
          onClick={onDownload}
          className="w-10 h-10 flex items-center justify-center bg-green-50 text-[#11AB2F] rounded-xl hover:bg-green-100 active:scale-90 transition-all shadow-sm border border-green-100"
          title="Download PDF"
        >
          <i className="fa-solid fa-file-pdf text-lg"></i>
        </button>
      )}
    </div>
  );

  const addCropModalJSX = isAddModalOpen && (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={() => { setIsAddModalOpen?.(false); setIsEditing(null); }}></div>
      <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-10 shadow-2xl relative animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto pointer-events-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Crop' : 'Add New Crop'}</h3>
          <button onClick={() => { setIsAddModalOpen?.(false); setIsEditing(null); }} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-90"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Crop Name</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-solid fa-seedling"></i></div>
              <input value={newCrop.name} onChange={e => setNewCrop({...newCrop, name: e.target.value})} placeholder="e.g. Wheat Season 1" className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 placeholder:text-slate-300 focus:border-[#11AB2F] focus:bg-white outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sowing Date</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-solid fa-calendar-day"></i></div>
              <input type="date" value={newCrop.date} onChange={e => setNewCrop({...newCrop, date: e.target.value})} className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Area</label>
            <div className="flex gap-3 relative">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-solid fa-ruler-combined"></i></div>
                <input type="number" value={newCrop.area} onChange={e => setNewCrop({...newCrop, area: e.target.value})} placeholder="0.00" className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all" />
              </div>
              <div className="relative w-40" ref={dropdownRef}>
                <button onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)} className="w-full h-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[#11AB2F] font-bold flex items-center justify-between active:bg-white focus:border-[#11AB2F] transition-all outline-none">
                  <span className="truncate">{newCrop.unit === 'Meter Square' ? 'm²' : newCrop.unit}</span>
                  <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-300 ${isUnitDropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>
                {isUnitDropdownOpen && (
                  <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border-2 border-[#11AB2F]/10 overflow-hidden z-[210] animate-in slide-in-from-bottom-2 duration-200">
                    {(['Acre', 'Bigha', 'Meter Square'] as const).map((unit) => (
                      <button key={unit} onClick={() => { setNewCrop({...newCrop, unit}); setIsUnitDropdownOpen(false); }} className={`w-full px-5 py-4 text-left font-bold text-sm transition-colors flex items-center justify-between ${newCrop.unit === unit ? 'bg-[#11AB2F] text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                        {unit}
                        {newCrop.unit === unit && <i className="fa-solid fa-check text-[10px]"></i>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <button onClick={handleAddCrop} className="w-full py-5 bg-gradient-to-r from-[#11AB2F] to-[#2ecc71] text-white rounded-[20px] font-bold text-lg shadow-lg shadow-green-200 active:scale-95 transition-all mt-8 flex items-center justify-center gap-3"><i className={`fa-solid ${isEditing ? 'fa-check' : 'fa-plus'}`}></i>{isEditing ? 'Update Crop Details' : 'Save New Crop'}</button>
      </div>
    </div>
  );

  const addExpenseModalJSX = isExpenseModalOpen && (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={() => setIsExpenseModalOpen(false)}></div>
      <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-10 shadow-2xl relative animate-in slide-in-from-bottom duration-500 pointer-events-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900">New Expense</h3>
          <button onClick={() => setIsExpenseModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-90"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Date</label>
            <input type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Expense Name</label>
            <input value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})} placeholder="e.g. Fertilizer, Seeds, Labor" className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount (₹)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
              <input type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} placeholder="0.00" className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all font-bold" />
            </div>
          </div>
        </div>
        <button onClick={handleAddExpense} className="w-full py-5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-[20px] font-bold text-lg shadow-lg shadow-red-200 active:scale-95 transition-all mt-8">Save Expense</button>
      </div>
    </div>
  );

  const addSaleModalJSX = isSaleModalOpen && (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={() => setIsSaleModalOpen(false)}></div>
      <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-10 shadow-2xl relative animate-in slide-in-from-bottom duration-500 pointer-events-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900">New Sale</h3>
          <button onClick={() => setIsSaleModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-90"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Date</label>
            <input type="date" value={newSale.date} onChange={e => setNewSale({...newSale, date: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
            <input value={newSale.quantity} onChange={e => setNewSale({...newSale, quantity: e.target.value})} placeholder="e.g. 10 Qtl, 50 Kg" className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location / Market</label>
            <input value={newSale.location} onChange={e => setNewSale({...newSale, location: e.target.value})} placeholder="e.g. Local Mandi, City Market" className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Total Amount (₹)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
              <input type="number" value={newSale.amount} onChange={e => setNewSale({...newSale, amount: e.target.value})} placeholder="0.00" className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 focus:border-[#11AB2F] focus:bg-white outline-none transition-all font-bold" />
            </div>
          </div>
        </div>
        <button onClick={handleAddSale} className="w-full py-5 bg-gradient-to-r from-[#11AB2F] to-[#0A8C23] text-white rounded-[20px] font-bold text-lg shadow-lg shadow-green-200 active:scale-95 transition-all mt-8">Save Sale Record</button>
      </div>
    </div>
  );

  let viewContent = null;

  if (view === 'manage-expenses') {
    viewContent = (
      <div className="bg-slate-50 min-h-screen pb-20 animate-in slide-in-from-right duration-300">
        {renderHeader('Manage Expenses', 'dashboard')}
        <div className="p-4 space-y-3">
          {crops.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[24px] shadow-sm border-2 border-[#11AB2F]">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300"><i className="fa-solid fa-seedling text-xl"></i></div>
              <p className="text-slate-500 text-sm font-bold">Add a crop first</p>
              <button onClick={() => setIsAddModalOpen?.(true)} className="mt-3 px-5 py-2 bg-[#11AB2F] text-white rounded-full text-xs font-black active:scale-95 transition-all uppercase tracking-wider">Add New Crop</button>
            </div>
          ) : (
            crops.map(crop => {
              const isExpanded = !!expandedCrops[crop.id];
              const totalExp = (crop.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
              const inline = inlineExpenses[crop.id] || { name: '', amount: '', date: new Date().toISOString().split('T')[0] };
              return (
                <div key={crop.id} className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                  <div onClick={() => toggleCropExpansion(crop.id)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-[#11AB2F] border border-green-100/50"><i className="fa-solid fa-leaf text-sm"></i></div>
                      <div><h3 className="font-black text-slate-800 text-sm leading-tight">{crop.name}</h3><p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{crop.area} {crop.unit}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right"><p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Total</p><p className="text-sm font-black text-red-500">₹{formatCurrency(totalExp)}</p></div>
                      <i className={`fa-solid fa-chevron-down text-slate-300 text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-50 animate-in slide-in-from-top duration-300">
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
                        <p className="text-[9px] font-black text-[#11AB2F] uppercase tracking-widest ml-1">Quick Add Expense</p>
                        <div className="grid grid-cols-1 gap-2">
                          <input value={inline.name} onChange={(e) => handleInlineExpenseChange(crop.id, 'name', e.target.value)} placeholder="Expense name (e.g. Fertilizer)" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#11AB2F] outline-none font-bold" />
                          <div className="flex gap-2">
                            <input type="number" value={inline.amount} onChange={(e) => handleInlineExpenseChange(crop.id, 'amount', e.target.value)} placeholder="Amount (₹)" className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#11AB2F] outline-none font-bold" />
                            <input type="date" value={inline.date} onChange={(e) => handleInlineExpenseChange(crop.id, 'date', e.target.value)} className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-[#11AB2F] outline-none font-bold" />
                          </div>
                          <button onClick={() => saveInlineExpense(crop.id)} className="w-full py-2.5 bg-[#11AB2F] text-white rounded-lg font-black text-xs shadow-sm active:scale-[0.98] transition-all uppercase tracking-wider">Save Expense</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  } else if (view === 'manage-sales') {
    viewContent = (
      <div className="bg-slate-50 min-h-screen pb-20 animate-in slide-in-from-right duration-300">
        {renderHeader('Manage Sales', 'dashboard')}
        <div className="p-4 space-y-3">
          {crops.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[24px] shadow-sm border-2 border-[#11AB2F]">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300"><i className="fa-solid fa-seedling text-xl"></i></div>
              <p className="text-slate-500 text-sm font-bold">Add a crop first</p>
              <button onClick={() => setIsAddModalOpen?.(true)} className="mt-3 px-5 py-2 bg-[#11AB2F] text-white rounded-full text-xs font-black active:scale-95 transition-all uppercase tracking-wider">Add New Crop</button>
            </div>
          ) : (
            crops.map(crop => {
              const isExpanded = !!expandedCrops[crop.id];
              const totalSale = (crop.sales || []).reduce((s, e) => s + (e.amount || 0), 0);
              const inline = inlineSales[crop.id] || { quantity: '', location: '', amount: '', date: new Date().toISOString().split('T')[0] };
              return (
                <div key={crop.id} className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                  <div onClick={() => toggleCropExpansion(crop.id)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-[#11AB2F] border border-green-100/50"><i className="fa-solid fa-leaf text-sm"></i></div>
                      <div><h3 className="font-black text-slate-800 text-sm leading-tight">{crop.name}</h3><p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{crop.area} {crop.unit}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right"><p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Sales</p><p className="text-sm font-black text-green-600">₹{formatCurrency(totalSale)}</p></div>
                      <i className={`fa-solid fa-chevron-down text-slate-300 text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-50 animate-in slide-in-from-top duration-300">
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
                        <p className="text-[9px] font-black text-[#11AB2F] uppercase tracking-widest ml-1">Quick Add Sale</p>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex gap-2">
                            <input value={inline.quantity} onChange={(e) => handleInlineSaleChange(crop.id, 'quantity', e.target.value)} placeholder="Qty (e.g. 10 Qtl)" className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#11AB2F] outline-none font-bold" />
                            <input value={inline.location} onChange={(e) => handleInlineSaleChange(crop.id, 'location', e.target.value)} placeholder="Market" className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#11AB2F] outline-none font-bold" />
                          </div>
                          <div className="flex gap-2">
                            <input type="number" value={inline.amount} onChange={(e) => handleInlineSaleChange(crop.id, 'amount', e.target.value)} placeholder="Total (₹)" className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#11AB2F] outline-none font-bold" />
                            <input type="date" value={inline.date} onChange={(e) => handleInlineSaleChange(crop.id, 'date', e.target.value)} className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-[#11AB2F] outline-none font-bold" />
                          </div>
                          <button onClick={() => saveInlineSale(crop.id)} className="w-full py-2.5 bg-[#11AB2F] text-white rounded-lg font-black text-xs shadow-sm active:scale-[0.98] transition-all uppercase tracking-wider">Save Sale Record</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  } else if (view === 'my-crops') {
    const deletingCrop = crops.find(c => c.id === cropToDelete);
    viewContent = (
      <div className="bg-slate-50 min-h-screen pb-20 animate-in slide-in-from-right duration-300">
        {renderHeader('My Crops', 'dashboard')}
        <div className="p-5 space-y-4">
          {crops.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <i className="fa-solid fa-seedling text-3xl"></i>
              </div>
              <p className="text-slate-500 font-medium">No crops added yet</p>
            </div>
          ) : (
            crops.map(crop => {
              const totalExp = (crop.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
              const totalSale = (crop.sales || []).reduce((sum, s) => sum + (s.amount || 0), 0);
              const totalQty = getTotalQuantity(crop.sales || []);
              const profit = totalSale - totalExp;
              const isProfit = profit >= 0;
              return (
                <div key={crop.id} onClick={() => onNavigate('crop-detail', crop.id)} className="w-full bg-gradient-to-br from-white to-green-50 rounded-[20px] p-4 border-2 border-[#11AB2F] shadow-lg shadow-green-900/10 hover:shadow-xl hover:shadow-green-900/20 transition-all active:scale-[0.99] text-left relative cursor-pointer overflow-hidden flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#11AB2F] shrink-0 border border-[#11AB2F]/20 shadow-sm">
                        <i className="fa-solid fa-leaf text-lg"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate leading-tight">{crop.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider ${crop.status === 'Active' ? 'bg-[#11AB2F]/10 text-[#11AB2F]' : 'bg-slate-100 text-slate-600'}`}>{crop.status}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{crop.area} {crop.unit === 'Meter Square' ? 'm²' : crop.unit}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={(e) => handleEditCrop(e, crop)} className="w-7 h-7 rounded-lg bg-white/80 text-slate-400 hover:text-[#11AB2F] hover:bg-white flex items-center justify-center transition-all active:scale-90 shadow-sm border border-slate-100">
                        <i className="fa-solid fa-pen-to-square text-[10px]"></i>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setCropToDelete(crop.id); }} className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 flex items-center justify-center transition-all active:scale-90 shadow-sm border border-red-100">
                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#11AB2F]/10">
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Sales</span>
                        <span className="text-xs font-bold text-green-600">₹{formatCurrency(totalSale)}</span>
                      </div>
                      <div className="flex flex-col border-l border-[#11AB2F]/10 pl-4">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Exp.</span>
                        <span className="text-xs font-bold text-red-500">₹{formatCurrency(totalExp)}</span>
                      </div>
                      <div className="flex flex-col border-l border-[#11AB2F]/10 pl-4">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Qty</span>
                        <span className="text-xs font-bold text-blue-600">{totalQty}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg shadow-sm border ${isProfit ? 'bg-white text-green-700 border-[#11AB2F]/20' : 'bg-white text-red-700 border-red-100'}`}>
                      <i className={`fa-solid ${isProfit ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} text-[8px]`}></i>
                      <span className="text-[10px] font-black tracking-tight">₹{formatCurrency(Math.abs(profit))}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {cropToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCropToDelete(null)}></div>
            <div className="bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <i className="fa-solid fa-trash-can text-2xl"></i>
              </div>
              <h4 className="text-xl font-bold text-center text-slate-900 mb-2">Delete Crop?</h4>
              <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">Are you sure you want to delete <span className="font-bold text-slate-800">{deletingCrop?.name}</span>?</p>
              <div className="flex gap-3">
                <button onClick={() => setCropToDelete(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm active:scale-95 transition-all">Cancel</button>
                <button onClick={confirmDeleteCrop} className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-100 active:scale-95 transition-all">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } else if (view === 'crop-detail' && activeCrop) {
    const totalExp = (activeCrop.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalSale = (activeCrop.sales || []).reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalQty = getTotalQuantity(activeCrop.sales || []);
    const profit = totalSale - totalExp;
    viewContent = (
      <div className="bg-slate-50 min-h-screen animate-in fade-in duration-300">
        {renderHeader(activeCrop.name, 'my-crops')}
        <div className="p-5 space-y-6">
          <div className="bg-gradient-to-br from-[#11AB2F] to-[#0A8C23] rounded-[24px] p-6 text-white shadow-lg border-2 border-white/20">
            <p className="text-white/60 text-xs font-bold uppercase mb-1">Financial Summary</p>
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-3xl font-bold">₹{formatCurrency(profit)}</h3>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-md">NET PROFIT</span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
              <div>
                <p className="text-white/60 text-[9px] font-bold uppercase">Sales</p>
                <p className="text-sm font-bold truncate">₹{formatCurrency(totalSale)}</p>
              </div>
              <div className="border-l border-white/10 pl-2">
                <p className="text-white/60 text-[9px] font-bold uppercase">Exp.</p>
                <p className="text-sm font-bold truncate">₹{formatCurrency(totalExp)}</p>
              </div>
              <div className="border-l border-white/10 pl-2">
                <p className="text-white/60 text-[9px] font-bold uppercase">Qty</p>
                <p className="text-sm font-bold truncate">{totalQty}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <button onClick={() => onNavigate('expenses', activeCrop.id)} className="w-full bg-gradient-to-br from-white to-green-50 rounded-2xl p-5 flex items-center justify-between border-2 border-[#11AB2F]/30 shadow-md shadow-green-900/5 active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center border border-red-100">
                  <i className="fa-solid fa-receipt"></i>
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800">Expenses</h4>
                  <p className="text-xs text-slate-400">View and manage costs</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-[#11AB2F]/40"></i>
            </button>
            <button onClick={() => onNavigate('sales', activeCrop.id)} className="w-full bg-gradient-to-br from-white to-green-50 rounded-2xl p-5 flex items-center justify-between border-2 border-[#11AB2F]/30 shadow-md shadow-green-900/5 active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center border border-green-100">
                  <i className="fa-solid fa-cart-shopping"></i>
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800">Sales</h4>
                  <p className="text-xs text-slate-400">View and manage revenue</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-[#11AB2F]/40"></i>
            </button>
            <button onClick={() => onNavigate('profit-loss', activeCrop.id)} className="w-full bg-gradient-to-br from-white to-green-50 rounded-2xl p-5 flex items-center justify-between border-2 border-[#11AB2F]/30 shadow-md shadow-green-900/5 active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center border border-blue-100">
                  <i className="fa-solid fa-chart-pie"></i>
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800">Analytics</h4>
                  <p className="text-xs text-slate-400">Profit/Loss visualizations</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-[#11AB2F]/40"></i>
            </button>
            <button onClick={() => onNavigate('track', activeCrop.id)} className="w-full bg-gradient-to-br from-white to-green-50 rounded-2xl p-5 flex items-center justify-between border-2 border-[#11AB2F]/30 shadow-md shadow-green-900/5 active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center border border-orange-100">
                  <i className="fa-solid fa-chart-line"></i>
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800">Track Growth</h4>
                  <p className="text-xs text-slate-400">Monitor crop progress</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-[#11AB2F]/40"></i>
            </button>
          </div>
        </div>
      </div>
    );
  } else if (view === 'expenses' && activeCrop) {
    const sortedExpenses = [...(activeCrop.expenses || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalExp = sortedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    viewContent = (
      <div className="bg-slate-50 min-h-screen pb-32 animate-in slide-in-from-right duration-300">
        {renderHeader('Expenses', 'crop-detail', activeCrop.id, () => setDownloadConfirm('Expenses'))}
        
        <div className="p-4 space-y-4">
          {sortedExpenses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[24px] border border-slate-100 shadow-sm">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                <i className="fa-solid fa-receipt text-xl"></i>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No expenses recorded</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {sortedExpenses.map((exp) => (
                <div key={exp.id} className="bg-white rounded-[20px] p-3 flex items-center justify-between shadow-sm border border-slate-50 transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center border border-red-100/50">
                      <i className="fa-solid fa-receipt text-xs"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{exp.name}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(exp.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-red-500">₹{formatCurrency(exp.amount || 0)}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setItemToDelete({ id: exp.id, type: 'expense' }); }}
                      className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center active:scale-90 transition-all"
                    >
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setIsExpenseModalOpen(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-red-500 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all z-[70] border-4 border-white">
          <i className="fa-solid fa-plus text-xl"></i>
        </button>
      </div>
    );
  } else if (view === 'sales' && activeCrop) {
    const sortedSales = [...(activeCrop.sales || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalSale = sortedSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    
    viewContent = (
      <div className="bg-slate-50 min-h-screen pb-32 animate-in slide-in-from-right duration-300">
        {renderHeader('Sales', 'crop-detail', activeCrop.id, () => setDownloadConfirm('Sales'))}
        
        <div className="p-4 space-y-4">
          {sortedSales.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[24px] border border-slate-100 shadow-sm">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                <i className="fa-solid fa-cart-shopping text-xl"></i>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No sales recorded</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {sortedSales.map((sale) => (
                <div key={sale.id} className="bg-white rounded-[20px] p-3 flex items-center justify-between shadow-sm border border-slate-50 transition-all active:scale-[0.98]">
                   <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 text-green-500 rounded-lg flex items-center justify-center border border-green-100/50">
                      <i className="fa-solid fa-cart-shopping text-xs"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{sale.quantity}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {new Date(sale.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        {sale.location ? ` • ${sale.location}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-green-600">₹{formatCurrency(sale.amount || 0)}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setItemToDelete({ id: sale.id, type: 'sale' }); }}
                      className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center active:scale-90 transition-all"
                    >
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsSaleModalOpen(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-green-500 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all z-[70] border-4 border-white"
        >
          <i className="fa-solid fa-plus text-xl"></i>
        </button>
      </div>
    );
  } else if (view === 'profit-loss' && activeCrop) {
    const totalExp = (activeCrop.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalSale = (activeCrop.sales || []).reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalQtyValue = getTotalQuantityValue(activeCrop.sales || []);
    const avgRate = totalQtyValue > 0 ? totalSale / totalQtyValue : 0;
    const profit = totalSale - totalExp;
    const isProfit = profit >= 0;
    const ratio = (totalExp + totalSale === 0) ? 0 : (totalExp / (totalExp + totalSale)) * 100;
    
    viewContent = (
      <div className="bg-slate-50 min-h-screen animate-in slide-in-from-right duration-300">
        {renderHeader('Analytics', 'crop-detail', activeCrop.id)}
        <div className="p-5 space-y-6">
          <div className="bg-gradient-to-br from-white to-green-50 rounded-[32px] p-8 border-2 border-[#11AB2F] shadow-lg shadow-green-900/10 flex flex-col items-center">
            <h4 className="text-slate-400 text-xs font-bold uppercase mb-6 tracking-widest">Revenue Breakdown</h4>
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="4"></circle>
                <circle 
                  cx="18" cy="18" r="16" fill="transparent" stroke="#11AB2F" strokeWidth="4" 
                  strokeDasharray={(100 - ratio) + " 100"} 
                ></circle>
                <circle 
                  cx="18" cy="18" r="16" fill="transparent" stroke="#ef4444" strokeWidth="4" 
                  strokeDasharray={ratio + " 100"} 
                  strokeDashoffset={"-" + (100 - ratio)}
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Profit</p>
                <p className={`text-xl font-black ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                  {isProfit ? '+' : '-'}{Math.round((Math.abs(profit) / (totalSale || 1)) * 100)}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-white to-red-50 p-4 rounded-3xl border-2 border-red-100 shadow-md shadow-red-900/5">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Expenses</p>
              <p className="text-sm font-bold text-red-500">₹{formatCurrency(totalExp)}</p>
            </div>
            <div className="bg-gradient-to-br from-white to-green-50 p-4 rounded-3xl border-2 border-[#11AB2F]/20 shadow-md shadow-green-900/5">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Sales</p>
              <p className="text-sm font-bold text-green-600">₹{formatCurrency(totalSale)}</p>
            </div>
            <div className="bg-gradient-to-br from-white to-blue-50 p-4 rounded-3xl border-2 border-blue-100 shadow-md shadow-blue-900/5">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Qty</p>
              <p className="text-sm font-bold text-blue-600">{getTotalQuantity(activeCrop.sales || [])}</p>
            </div>
          </div>

          {/* Avg Rate Box */}
          <div className="bg-white rounded-[28px] p-6 border-2 border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-100">
                <i className="fa-solid fa-scale-balanced text-xl"></i>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Avg Rate per kg</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Sales / Total Qty (kg)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-orange-600">₹{avgRate.toFixed(2)}</p>
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">per kg</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contents">
      {viewContent}
      {addCropModalJSX}
      {addExpenseModalJSX}
      {addSaleModalJSX}

      {/* Download Confirmation Modal */}
      {downloadConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDownloadConfirm(null)}></div>
          <div className="bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#11AB2F]">
              <i className="fa-solid fa-file-pdf text-2xl"></i>
            </div>
            <h4 className="text-xl font-bold text-center text-slate-900 mb-2">Download PDF?</h4>
            <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
              Do you want to download the <span className="font-bold text-slate-800">{downloadConfirm}</span> report for <span className="font-bold text-[#11AB2F]">{activeCrop?.name}</span>?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => downloadPDF(downloadConfirm)} 
                className="w-full py-4 bg-[#11AB2F] text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-download text-xs"></i>
                Download Now
              </button>
              <button 
                onClick={() => setDownloadConfirm(null)} 
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setItemToDelete(null)}></div>
          <div className="bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <i className="fa-solid fa-trash-can text-2xl"></i>
            </div>
            <h4 className="text-xl font-bold text-center text-slate-900 mb-2">Delete Item?</h4>
            <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">Are you sure you want to delete this {itemToDelete.type} record? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm active:scale-95 transition-all">Cancel</button>
              <button 
                onClick={() => itemToDelete.type === 'expense' ? handleDeleteExpense(itemToDelete.id) : handleDeleteSale(itemToDelete.id)} 
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

export default CropManagement;
