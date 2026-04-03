
import React, { useState } from 'react';
import { Note } from '../types';

interface NotepadViewProps {
  notes: Note[];
  onSaveNote: (note: Note) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onBack: () => void;
}

const NotepadView: React.FC<NotepadViewProps> = ({ notes, onSaveNote, onDeleteNote, onBack }) => {
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  const handleAddNew = () => {
    setEditingNote(null);
    setFormData({ title: '', content: '' });
    setIsEditorOpen(true);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content });
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() && !formData.content.trim()) return;

    const note: Note = {
      id: editingNote?.id || Date.now().toString(),
      title: formData.title || 'Untitled Note',
      content: formData.content,
      date: new Date().toISOString()
    };

    await onSaveNote(note);
    setIsEditorOpen(false);
  };

  const confirmDelete = async () => {
    if (noteToDelete) {
      await onDeleteNote(noteToDelete);
      setNoteToDelete(null);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-6 sticky top-0 z-50 bg-white shadow-sm mb-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 active:scale-90 transition-all">
          <i className="fa-solid fa-arrow-left text-slate-800"></i>
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Notepad</h2>
          <p className="text-[10px] text-[#11AB2F] font-bold uppercase tracking-widest mt-1">Farm Records & Ideas</p>
        </div>
      </div>

      {/* Note List */}
      <div className="flex-1 px-5 pb-32">
        {notes.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
              <i className="fa-solid fa-note-sticky text-3xl"></i>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] px-10">Capture your farming ideas, plans, and to-do lists here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {notes.map(note => (
              <div 
                key={note.id} 
                onClick={() => handleEdit(note)}
                className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer group hover:border-[#11AB2F]/30 hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight line-clamp-1">{note.title}</h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id); }}
                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <i className="fa-solid fa-trash-can text-sm"></i>
                  </button>
                </div>
                <p className="text-sm text-slate-500 line-clamp-3 mb-4 leading-relaxed">{note.content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    {new Date(note.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#11AB2F]/10 group-hover:text-[#11AB2F] transition-colors">
                    <i className="fa-solid fa-chevron-right text-[8px]"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Plus Button */}
      <button 
        onClick={handleAddNew}
        className="fixed bottom-24 right-6 w-16 h-16 bg-[#11AB2F] text-white rounded-full shadow-[0_8px_24px_rgba(17,171,47,0.3)] flex items-center justify-center active:scale-90 transition-all z-50 border-[6px] border-white"
      >
        <i className="fa-solid fa-plus text-2xl"></i>
      </button>

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
          <div className="flex items-center justify-between px-5 py-6 sticky top-0 bg-white z-50">
            <button onClick={() => setIsEditorOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 active:scale-90">
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="flex-1 px-4 text-center">
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingNote ? 'Edit Note' : 'New Note'}</h3>
            </div>
            <button 
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#11AB2F] text-white rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all"
            >
              Save
            </button>
          </div>
          <div className="flex-1 flex flex-col p-6 space-y-4">
            <input 
              autoFocus
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Note Title"
              className="text-2xl font-black text-slate-900 bg-transparent border-none focus:ring-0 outline-none w-full placeholder:text-slate-200"
            />
            <div className="w-12 h-1 bg-[#11AB2F]/10 rounded-full" />
            <textarea 
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              placeholder="Start writing your farming thoughts..."
              className="flex-1 text-base text-slate-600 bg-transparent border-none focus:ring-0 outline-none w-full resize-none leading-relaxed placeholder:text-slate-300"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {noteToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setNoteToDelete(null)}></div>
          <div className="bg-white w-full max-w-xs rounded-[40px] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
              <i className="fa-solid fa-trash-can text-2xl"></i>
            </div>
            <h4 className="text-xl font-black text-center text-slate-900 mb-2">Delete Note?</h4>
            <p className="text-sm text-slate-400 text-center leading-relaxed mb-8">This will permanently remove this note. You cannot undo this action.</p>
            <div className="flex gap-3">
              <button onClick={() => setNoteToDelete(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Keep</button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotepadView;
