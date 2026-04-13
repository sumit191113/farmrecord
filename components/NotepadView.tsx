
import React, { useState, useRef, useEffect } from 'react';
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
  const editorRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isEditorOpen && editorRef.current) {
      editorRef.current.innerHTML = formData.content;
    }
  }, [isEditorOpen]);

  const handleSave = async () => {
    const content = editorRef.current?.innerHTML || '';
    if (!formData.title.trim() && !content.trim()) return;

    const note: Note = {
      id: editingNote?.id || Date.now().toString(),
      title: formData.title || 'Untitled Note',
      content: content,
      date: new Date().toISOString()
    };

    await onSaveNote(note);
    setIsEditorOpen(false);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const confirmDelete = async () => {
    if (noteToDelete) {
      await onDeleteNote(noteToDelete);
      setNoteToDelete(null);
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
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
          <div className="text-center py-24 bg-white rounded-[40px] border-4 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
              <i className="fa-solid fa-folder-open text-3xl"></i>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] px-10">Capture your farming ideas, plans, and to-do lists here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {notes.map((note, idx) => {
              const colors = [
                { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', tab: 'bg-green-200', icon: 'fa-leaf' },
                { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', tab: 'bg-blue-200', icon: 'fa-cloud' },
                { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', tab: 'bg-amber-200', icon: 'fa-sun' },
                { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', tab: 'bg-purple-200', icon: 'fa-star' },
                { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', tab: 'bg-rose-200', icon: 'fa-heart' },
              ];
              const color = colors[idx % colors.length];
              
              return (
                <div 
                  key={note.id} 
                  onClick={() => handleEdit(note)}
                  className="relative group cursor-pointer active:scale-95 transition-all duration-300"
                >
                  {/* Folder Tab */}
                  <div className={`absolute -top-2 left-4 w-14 h-5 ${color.tab} rounded-t-xl group-hover:brightness-95 transition-all border-t-2 border-x-2 ${color.border}`} />
                  
                  {/* Folder Body */}
                  <div className={`bg-white rounded-[24px] rounded-tl-none p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)] border-2 ${color.border} relative z-10 h-40 flex flex-col justify-between group-hover:shadow-xl group-hover:-translate-y-1 transition-all`}>
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className={`w-9 h-9 ${color.bg} rounded-xl flex items-center justify-center ${color.text} shadow-sm border ${color.border}`}>
                          <i className={`fa-solid ${color.icon} text-sm`}></i>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id); }}
                          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors bg-slate-50 rounded-lg"
                        >
                          <i className="fa-solid fa-trash-can text-[10px]"></i>
                        </button>
                      </div>
                      <h3 className="text-sm font-black text-slate-800 tracking-tight line-clamp-2 leading-tight group-hover:text-slate-900 transition-colors">{note.title}</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed font-medium">
                        {stripHtml(note.content) || "No content yet..."}
                      </p>
                      <div className={`flex items-center justify-between pt-2 border-t-2 ${color.border}/30`}>
                        <div className="flex items-center gap-1">
                          <i className={`fa-regular fa-calendar text-[8px] ${color.text}`}></i>
                          <span className={`text-[8px] font-black ${color.text} uppercase tracking-widest`}>
                            {new Date(note.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-lg ${color.bg} flex items-center justify-center ${color.text} group-hover:bg-[#11AB2F] group-hover:text-white transition-all shadow-sm`}>
                          <i className="fa-solid fa-chevron-right text-[7px]"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
          <div className="flex items-center justify-between px-5 py-6 sticky top-0 bg-white z-50 border-b border-slate-50">
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

          {/* Compact Toolbar */}
          <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b border-slate-100 overflow-x-auto no-scrollbar sticky top-[88px] z-40">
            <button onClick={() => execCommand('bold')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 active:bg-slate-100 transition-all">
              <i className="fa-solid fa-bold"></i>
            </button>
            <button onClick={() => execCommand('insertUnorderedList')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 active:bg-slate-100 transition-all">
              <i className="fa-solid fa-list-ul"></i>
            </button>
            
            <div className="w-px h-6 bg-slate-200 mx-1" />
            
            {/* Color Presets */}
            <button onClick={() => execCommand('foreColor', '#000000')} className="w-8 h-8 rounded-full bg-black border-2 border-white shadow-sm shrink-0" />
            <button onClick={() => execCommand('foreColor', '#11AB2F')} className="w-8 h-8 rounded-full bg-[#11AB2F] border-2 border-white shadow-sm shrink-0" />
            <button onClick={() => execCommand('foreColor', '#EF4444')} className="w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-sm shrink-0" />
            <button onClick={() => execCommand('foreColor', '#3B82F6')} className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-sm shrink-0" />

            <div className="w-px h-6 bg-slate-200 mx-1" />

            {/* Font Size */}
            <button onClick={() => execCommand('fontSize', '3')} className="px-3 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs active:bg-slate-100 transition-all shrink-0">S</button>
            <button onClick={() => execCommand('fontSize', '5')} className="px-3 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-base active:bg-slate-100 transition-all shrink-0">M</button>
            <button onClick={() => execCommand('fontSize', '7')} className="px-3 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xl active:bg-slate-100 transition-all shrink-0">L</button>
          </div>

          <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
            <input 
              autoFocus
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Note Title"
              className="text-2xl font-black text-slate-900 bg-transparent border-none focus:ring-0 outline-none w-full placeholder:text-slate-200"
            />
            <div className="w-12 h-1 bg-[#11AB2F]/10 rounded-full" />
            <div 
              ref={editorRef}
              contentEditable
              className="flex-1 text-base text-slate-600 bg-transparent border-none focus:ring-0 outline-none w-full leading-relaxed placeholder:text-slate-300 min-h-[200px]"
              onInput={() => {}} // Just to trigger re-renders if needed, but we use ref
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
