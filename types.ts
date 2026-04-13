
export interface FarmSummary {
  totalExpenses: number;
  totalSales: number;
  netProfit: number;
}

export interface Expense {
  id: string;
  date: string;
  name: string;
  category: string;
  amount: number;
}

export interface Sale {
  id: string;
  date: string;
  quantity: string;
  location: string;
  amount: number;
}

export interface Earning {
  id: string;
  date: string;
  amount: number;
  location: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface TrackEntry {
  id: string;
  cropId: string;
  imageUrl: string;
  description?: string;
  category: 'Plant' | 'Farm' | 'Disease' | 'Other';
  timestamp: string;
}

export interface Crop {
  id: string;
  name: string;
  type: string;
  sowingDate: string;
  area: string;
  unit: 'Acre' | 'Bigha' | 'Meter Square';
  expenses: Expense[];
  sales: Sale[];
  status: 'Active' | 'Harvested';
  imageUrl?: string;
}

export interface UserProfile {
  photoUrl: string;
}

export type NavItem = 'home' | 'manage' | 'calculator' | 'notepad';

export type AppView = 
  | 'dashboard' 
  | 'my-crops' 
  | 'add-crop' 
  | 'crop-detail' 
  | 'expenses' 
  | 'manage-expenses'
  | 'manage-sales'
  | 'sales' 
  | 'profit-loss'
  | 'add-expense'
  | 'add-sale'
  | 'earnings'
  | 'reports'
  | 'crop-records'
  | 'notepad'
  | 'track'
  | 'track-detail'
  | 'settings';
