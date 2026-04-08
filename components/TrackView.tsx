import React, { useState, useRef, useEffect } from 'react';
import { Crop, TrackEntry, AppView } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { uploadToCloudinary, saveTrackEntryToFirebase, deleteTrackEntryFromFirebase } from '../services/firebaseService';

interface TrackViewProps {
  crops: Crop[];
  trackEntries: TrackEntry[];
  onAddEntry: (entry: TrackEntry) => void;
  onDeleteEntry: (entry: TrackEntry) => void;
  onNavigate: (view: AppView, id?: string) => void;
  initialCropId?: string | null;
}

const TrackView: React.FC<TrackViewProps> = ({ crops, trackEntries, onAddEntry, onDeleteEntry, onNavigate, initialCropId }) => {
  const [selectedCropId, setSelectedCropId] = useState<string | null>(initialCropId || null);

  useEffect(() => {
    if (initialCropId) {
      setSelectedCropId(initialCropId);
    }
  }, [initialCropId]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TrackEntry | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const activeCrop = crops.find(c => c.id === selectedCropId);
  const activeEntries = trackEntries.filter(e => e.cropId === selectedCropId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const [itemToDelete, setItemToDelete] = useState<TrackEntry | null>(null);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.8);
        } catch (e) {
          console.error("Compression error:", e);
          resolve(file);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        console.error("Image load error in compressImage");
        resolve(file);
      };

      img.src = url;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Clean up previous preview URL if it exists
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadError(false);
  };

  const handleSave = async () => {
    if (!selectedFile || !selectedCropId) {
      alert("Please select an image first");
      return;
    }

    setUploading(true);
    setUploadError(false);
    try {
      const compressedFile = await compressImage(selectedFile);
      const imageUrl = await uploadToCloudinary(compressedFile);
      
      const newEntry: TrackEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        cropId: selectedCropId,
        imageUrl,
        description,
        timestamp: new Date(selectedDate).toISOString()
      };
      
      await saveTrackEntryToFirebase(newEntry);
      onAddEntry(newEntry);
      
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setIsUploadModalOpen(false);
        resetForm();
      }, 2000);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const renderHeader = (title: string, onBack: () => void) => (
    <div className="bg-white px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 z-50 shadow-sm">
      <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl active:scale-90 transition-all">
        <i className="fa-solid fa-arrow-left"></i>
      </button>
      <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
    </div>
  );

  if (!selectedCropId) {
    return (
      <div className="bg-slate-50 min-h-screen pb-32 animate-in fade-in duration-300">
        {renderHeader('Track Growth', () => onNavigate('dashboard'))}
        <div className="p-5 space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Select a Crop to Track</p>
          <div className="grid grid-cols-1 gap-4">
            {crops.map((crop) => (
              <motion.button
                key={crop.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCropId(crop.id)}
                className="bg-white p-5 rounded-[32px] shadow-md shadow-slate-200/50 border border-slate-100 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-50 text-[#11AB2F] rounded-2xl flex items-center justify-center border border-green-100 shadow-sm group-hover:bg-[#11AB2F] group-hover:text-white transition-all duration-300">
                    <i className="fa-solid fa-seedling text-2xl"></i>
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-slate-800 text-lg leading-tight">{crop.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {crop.area} {crop.unit} • {crop.status}
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-300 rounded-full group-hover:bg-green-50 group-hover:text-[#11AB2F] transition-all">
                  <i className="fa-solid fa-chevron-right text-xs"></i>
                </div>
              </motion.button>
            ))}
            {crops.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <i className="fa-solid fa-seedling text-3xl"></i>
                </div>
                <h3 className="text-slate-800 font-black text-lg">No Crops Found</h3>
                <p className="text-slate-400 text-sm mt-1">Add a crop in 'My Crops' first.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-32 animate-in slide-in-from-right duration-300">
      {renderHeader(activeCrop?.name || 'Tracking', () => setSelectedCropId(null))}
      
      <div className="p-5">
        {activeEntries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <i className="fa-solid fa-camera text-3xl"></i>
            </div>
            <h3 className="text-slate-800 font-black text-lg">No Growth Records</h3>
            <p className="text-slate-400 text-sm mt-1">Start tracking by adding your first photo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {activeEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 group"
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={entry.imageUrl} 
                    alt={entry.description} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                      {new Date(entry.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  {entry.description && (
                    <p className="text-slate-600 text-sm font-medium leading-relaxed mb-3 line-clamp-2">
                      {entry.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete(entry);
                      }}
                      className="text-red-400 hover:text-red-500 p-2 active:scale-90 transition-all"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button 
        onClick={() => setIsUploadModalOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-[#11AB2F] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-[70] border-[6px] border-white"
      >
        <i className="fa-solid fa-plus text-2xl"></i>
      </button>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => !uploading && setIsUploadModalOpen(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl relative z-10"
            >
              <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-4 sm:hidden" />
              
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-all"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>

              <h3 className="text-xl font-black text-slate-800 mb-1">Track Growth</h3>
              <p className="text-slate-400 text-xs font-medium mb-5">Capture a photo to track your crop's progress.</p>
                           <div className="space-y-4">
                {/* Date Selection */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Growth Date</label>
                  <div className="relative">
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-slate-800 font-bold focus:border-[#11AB2F] focus:outline-none transition-all appearance-none text-sm"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                      <i className="fa-solid fa-calendar-day"></i>
                    </div>
                  </div>
                </div>

                {/* Image Selection */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Crop Photo</label>
                  <div 
                    className={`w-full aspect-video bg-slate-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all overflow-hidden relative ${uploading ? 'opacity-50 border-slate-200' : 'border-slate-200'}`}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center p-4 text-center">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
                          <i className="fa-solid fa-image text-xl text-slate-300"></i>
                        </div>
                        <p className="text-xs font-bold text-slate-500">No image selected</p>
                      </div>
                    )}
                    
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                        <i className="fa-solid fa-circle-notch animate-spin text-2xl text-[#11AB2F] mb-2"></i>
                        <p className="text-xs font-bold text-[#11AB2F]">Uploading...</p>
                      </div>
                    )}

                    {uploadSuccess && (
                      <div className="absolute inset-0 bg-green-500/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-white">
                        <i className="fa-solid fa-circle-check text-3xl mb-2 animate-bounce"></i>
                        <p className="text-base font-black">Saved!</p>
                      </div>
                    )}
                  </div>

                  {/* Upload Options */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      onClick={() => !uploading && cameraInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs transition-all active:scale-95"
                    >
                      <i className="fa-solid fa-camera text-[#11AB2F]"></i>
                      Capture
                    </button>
                    <button 
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs transition-all active:scale-95"
                    >
                      <i className="fa-solid fa-images text-[#11AB2F]"></i>
                      Gallery
                    </button>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <input 
                    type="file" 
                    ref={cameraInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Observations (Optional)</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Healthy growth..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-slate-800 font-medium focus:border-[#11AB2F] focus:outline-none transition-all min-h-[60px] resize-none text-sm"
                  />
                </div>

                {/* Save Button */}
                <button 
                  onClick={handleSave}
                  disabled={uploading || !selectedFile}
                  className={`w-full py-4 rounded-2xl font-black text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${uploading || !selectedFile ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#11AB2F] text-white shadow-green-200'}`}
                >
                  {uploading ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      Save Record
                    </>
                  )}
                </button>

                {uploadError && (
                  <p className="text-[10px] text-red-400 font-bold text-center">
                    Upload failed. Please check your connection and try again.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full View Dialog */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl" 
              onClick={() => setSelectedEntry(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-white rounded-[40px] overflow-hidden shadow-2xl relative z-10"
            >
              <button 
                onClick={() => setSelectedEntry(null)}
                className="absolute top-6 right-6 w-12 h-12 bg-black/20 backdrop-blur-md text-white rounded-full flex items-center justify-center active:scale-90 z-20"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
              <div className="aspect-square sm:aspect-video overflow-hidden">
                <img 
                  src={selectedEntry.imageUrl} 
                  alt="Full view" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 text-[#11AB2F] rounded-xl flex items-center justify-center">
                      <i className="fa-solid fa-calendar-day"></i>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recorded On</p>
                      <p className="text-sm font-bold text-slate-800">
                        {new Date(selectedEntry.timestamp).toLocaleDateString(undefined, { dateStyle: 'full' })}
                      </p>
                    </div>
                  </div>
                </div>
                {selectedEntry.description && (
                  <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                    <p className="text-slate-600 font-medium leading-relaxed italic">
                      "{selectedEntry.description}"
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setItemToDelete(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl relative z-10 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-trash-can text-2xl"></i>
              </div>
              <h4 className="text-xl font-black text-slate-800 mb-2">Delete Record?</h4>
              <p className="text-sm text-slate-400 font-medium mb-6">This action cannot be undone. Are you sure?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    onDeleteEntry(itemToDelete);
                    deleteTrackEntryFromFirebase(itemToDelete);
                    setItemToDelete(null);
                  }}
                  className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-100 active:scale-95 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrackView;
