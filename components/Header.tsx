
import React, { useRef, useState } from 'react';
import { uploadToCloudinary } from '../services/firebaseService';

interface HeaderProps {
  syncStatus?: 'synced' | 'syncing' | 'offline';
  onMenuClick?: () => void;
  profilePhoto?: string | null;
  onProfilePhotoUpdate?: (url: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  syncStatus = 'synced', 
  onMenuClick, 
  profilePhoto,
  onProfilePhotoUpdate 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadToCloudinary(file);
      onProfilePhotoUpdate?.(url);
    } catch (error) {
      console.error("Profile photo upload failed:", error);
      alert("Photo upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-[1.5px] border-slate-200/60 shadow-sm">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-all active:scale-90"
          >
            <i className="fa-solid fa-bars-staggered text-lg text-slate-800"></i>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Farm Book</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-[#11AB2F] font-bold uppercase tracking-widest">Agriculture</p>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <div className="flex items-center gap-1">
                {syncStatus === 'synced' && (
                  <>
                    <i className="fa-solid fa-cloud-check text-[10px] text-green-500"></i>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Synced</span>
                  </>
                )}
                {syncStatus === 'syncing' && (
                  <>
                    <i className="fa-solid fa-cloud-arrow-up text-[10px] text-[#11AB2F] animate-bounce"></i>
                    <span className="text-[9px] font-bold text-[#11AB2F] uppercase tracking-tight">Syncing...</span>
                  </>
                )}
                {syncStatus === 'offline' && (
                  <>
                    <i className="fa-solid fa-cloud-slash text-[10px] text-red-400"></i>
                    <span className="text-[9px] font-bold text-red-400 uppercase tracking-tight">Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            onClick={handleProfileClick}
            className={`w-10 h-10 rounded-xl border-2 border-slate-100 flex items-center justify-center cursor-pointer shadow-sm hover:border-[#11AB2F] transition-all bg-slate-50 text-slate-400 overflow-hidden relative ${isUploading ? 'opacity-50' : ''}`}
          >
            {isUploading ? (
              <i className="fa-solid fa-circle-notch fa-spin text-lg text-[#11AB2F]"></i>
            ) : profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <i className="fa-solid fa-user text-lg"></i>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
