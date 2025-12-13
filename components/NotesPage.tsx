
import React, { useState, useEffect, useRef } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { ActionModal } from './ActionModal';

interface Note {
  id: string;
  title: string;
  content: string; // Stores HTML content
  updatedAt: number;
}

interface NotesPageProps {
  onAiAssist: (action: string, content: string) => Promise<string>;
  onTranscribe?: (audioFile: File) => Promise<string>; // New prop for audio transcription
  language: string;
  onMenuClick: () => void;
}

// Helper to detect text direction
const getTextDirection = (text: string) => {
  if (!text) return 'ltr';
  const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text) ? 'rtl' : 'ltr';
};

// Helper to convert RGB to Hex for color inputs
const rgbToHex = (rgb: string) => {
  if (!rgb) return '#000000';
  if (rgb.startsWith('#')) return rgb;
  const rgbValues = rgb.match(/\d+/g);
  if (!rgbValues) return '#000000';
  return '#' + rgbValues.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
};

// --- TOOLBAR COMPONENTS ---

const ToolbarButton: React.FC<{ 
  onClick: () => void; 
  active?: boolean; 
  icon: React.ReactNode; 
  title?: string 
}> = ({ onClick, active, icon, title }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`p-1.5 rounded-md transition-all flex items-center justify-center min-w-[28px] ${
      active 
        ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700 shadow-inner' 
        : 'text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
    }`}
    title={title}
  >
    {icon}
  </button>
);

const ToolbarSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string; style?: React.CSSProperties }[];
  width?: string;
  title?: string;
}> = ({ value, onChange, options, width = "w-24", title }) => (
  <div className="relative group" title={title}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs py-1.5 pl-2 pr-6 rounded-md focus:outline-none focus:border-blue-500 cursor-pointer ${width}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={opt.style}>
          {opt.label}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-500">
      <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
    </div>
  </div>
);

const ColorPicker: React.FC<{
  icon: React.ReactNode;
  onChange: (color: string) => void;
  title?: string;
  colorValue?: string; // Current color value to display in picker
}> = ({ icon, onChange, title, colorValue = "#000000" }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="relative flex items-center justify-center group">
      <button 
        onMouseDown={(e) => { e.preventDefault(); inputRef.current?.click(); }}
        className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200"
        title={title}
      >
        {icon}
      </button>
      <input 
        ref={inputRef}
        type="color" 
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        onChange={(e) => onChange(e.target.value)}
        value={colorValue}
        title={title}
      />
    </div>
  );
};

const ListStylePicker: React.FC<{
  icon: React.ReactNode;
  options: { label: string; value: string; preview: React.ReactNode }[];
  onSelect: (value: string) => void;
  title?: string;
}> = ({ icon, options, onSelect, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onMouseDown={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        className={`p-1.5 rounded-md transition-all flex items-center justify-center text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 ${isOpen ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
        title={title}
      >
        {icon}
        <svg className="w-2.5 h-2.5 ml-0.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2 w-52 grid grid-cols-2 gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onMouseDown={(e) => {
                 e.preventDefault();
                 onSelect(opt.value);
                 setIsOpen(false);
              }}
              className="flex items-center gap-2 p-2 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 rounded text-sm text-gray-700 dark:text-gray-200 border border-transparent transition-colors text-left"
              title={opt.label}
            >
               {opt.preview}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TableGridPicker: React.FC<{
  onSelect: (rows: number, cols: number) => void;
  onOpenManual: () => void;
  title?: string;
}> = ({ onSelect, onOpenManual, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoverRow(0);
        setHoverCol(0);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onMouseDown={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        className={`p-1.5 rounded-md transition-all flex items-center justify-center text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 ${isOpen ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
        title={title || "Insert Table"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7-12h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-3 w-[220px]">
          <div className="mb-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
             {hoverRow > 0 && hoverCol > 0 ? `${hoverCol} x ${hoverRow} Table` : "Insert Table"}
          </div>
          <div className="grid grid-cols-10 gap-1 mb-3" onMouseLeave={() => { setHoverRow(0); setHoverCol(0); }}>
             {Array.from({ length: 100 }).map((_, idx) => {
                 const r = Math.floor(idx / 10) + 1;
                 const c = (idx % 10) + 1;
                 const isActive = r <= hoverRow && c <= hoverCol;
                 
                 return (
                     <div 
                        key={idx}
                        onMouseEnter={() => { setHoverRow(r); setHoverCol(c); }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onSelect(r, c);
                            setIsOpen(false);
                            setHoverRow(0);
                            setHoverCol(0);
                        }}
                        className={`w-4 h-4 border ${isActive ? 'bg-orange-200 border-orange-400 dark:bg-orange-900 dark:border-orange-500' : 'bg-gray-50 border-gray-300 dark:bg-gray-700 dark:border-gray-600'} cursor-pointer`}
                     ></div>
                 );
             })}
          </div>
          <button 
            onMouseDown={(e) => {
                e.preventDefault();
                onOpenManual();
                setIsOpen(false);
            }}
            className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors border-t border-gray-100 dark:border-gray-700 pt-2"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
             Insert Table...
          </button>
        </div>
      )}
    </div>
  );
};


export const NotesPage: React.FC<NotesPageProps> = ({ onAiAssist, onTranscribe, language, onMenuClick }) => {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('naxi_notes_data');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'prompt';
    title: string;
    noteId: string;
    defaultValue?: string;
    isDestructive?: boolean;
    action: 'rename' | 'delete';
  }>({ isOpen: false, type: 'confirm', title: '', noteId: '', action: 'rename' });

  // Formatting State trackers
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentFont, setCurrentFont] = useState('Arial');
  const [currentSize, setCurrentSize] = useState('3');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [align, setAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [isSub, setIsSub] = useState(false);
  const [isSuper, setIsSuper] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [hiliteColor, setHiliteColor] = useState('#ffffff');

  // Format Painter State
  const [isFormatPainterActive, setIsFormatPainterActive] = useState(false);
  const [painterStyles, setPainterStyles] = useState<any>(null);

  // Table Modal State
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(2);
  const [tableCols, setTableCols] = useState(5);
  const [tableAutoWidth, setTableAutoWidth] = useState(true);

  // Translation State
  const [showTranslate, setShowTranslate] = useState(false);
  const [sourceLang, setSourceLang] = useState('Auto');
  const [targetLang, setTargetLang] = useState(language);

  // Audio Transcribe
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  // Auto-save
  useEffect(() => {
    if (autoSaveEnabled) {
        localStorage.setItem('naxi_notes_data', JSON.stringify(notes));
    }
  }, [notes, autoSaveEnabled]);

  // Sync editor content
  useEffect(() => {
    if (activeNoteId && editorRef.current) {
      const note = notes.find(n => n.id === activeNoteId);
      if (note && editorRef.current.innerHTML !== note.content) {
        editorRef.current.innerHTML = note.content;
      }
    }
  }, [activeNoteId]);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '<div><br></div>',
      updatedAt: Date.now()
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const handleSaveManually = () => {
      localStorage.setItem('naxi_notes_data', JSON.stringify(notes));
      alert("Note Saved!");
  };

  // --- MENU ACTIONS REPLACEMENT ---
  
  const handleRenameClick = (id: string, currentTitle: string, e: React.MouseEvent) => {
      e.stopPropagation(); e.preventDefault(); setMenuOpenId(null);
      setModalConfig({
          isOpen: true,
          type: 'prompt',
          title: 'Rename Note',
          defaultValue: currentTitle,
          noteId: id,
          action: 'rename',
          isDestructive: false
      });
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); e.preventDefault(); setMenuOpenId(null);
      setModalConfig({
          isOpen: true,
          type: 'confirm',
          title: 'Delete this note?',
          noteId: id,
          action: 'delete',
          isDestructive: true
      });
  };

  const handleModalConfirm = (value?: string) => {
      if (modalConfig.action === 'rename' && value) {
          updateNote(modalConfig.noteId, { title: value });
      } else if (modalConfig.action === 'delete') {
          setNotes(prev => prev.filter(n => n.id !== modalConfig.noteId));
          if (activeNoteId === modalConfig.noteId) setActiveNoteId(null);
      }
      setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleCopyContent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpenId(null);
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content;
    const text = tempDiv.innerText || tempDiv.textContent || "";
    navigator.clipboard.writeText(text);
  };

  const handleDuplicateNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpenId(null);
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const newNote: Note = {
        ...note,
        id: Date.now().toString(),
        title: `${note.title} (Copy)`,
        updatedAt: Date.now()
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const handleDownloadNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpenId(null);
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n');
    const text = tempDiv.innerText || tempDiv.textContent || "";
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- SHARE FUNCTIONALITY ---
  const handleShareNote = async () => {
      if (!activeNote) return;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = activeNote.content.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n');
      const text = tempDiv.innerText || tempDiv.textContent || "";
      const shareData = { title: activeNote.title, text: text };
      if (navigator.share) {
          try { await navigator.share(shareData); } catch (err) { console.error("Share failed:", err); }
      } else {
          try { await navigator.clipboard.writeText(text); alert("Note content copied to clipboard!"); } catch (err) { alert("Failed to copy note."); }
      }
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  };

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (activeNoteId) {
      updateNote(activeNoteId, { content: e.currentTarget.innerHTML });
    }
  };

  const checkActiveFormatting = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));
    setIsStrike(document.queryCommandState('strikethrough'));
    setIsSub(document.queryCommandState('subscript'));
    setIsSuper(document.queryCommandState('superscript'));
    
    if (document.queryCommandState('justifyLeft')) setAlign('left');
    else if (document.queryCommandState('justifyCenter')) setAlign('center');
    else if (document.queryCommandState('justifyRight')) setAlign('right');
    else if (document.queryCommandState('justifyFull')) setAlign('justify');
    else setAlign('left');

    const fontName = document.queryCommandValue('fontName');
    if (fontName) setCurrentFont(fontName.replace(/['"]+/g, ''));

    const fontSize = document.queryCommandValue('fontSize');
    if (fontSize) setCurrentSize(fontSize);

    const fColor = document.queryCommandValue('foreColor');
    if (fColor) setTextColor(rgbToHex(fColor));

    const hColor = document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor');
    if (hColor && hColor !== 'rgba(0, 0, 0, 0)' && hColor !== 'transparent') {
        setHiliteColor(rgbToHex(hColor));
    }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current && activeNoteId) {
      editorRef.current.focus();
      updateNote(activeNoteId, { content: editorRef.current.innerHTML });
      checkActiveFormatting();
    }
  };

  // --- AUDIO TRANSCRIPTION ---
  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onTranscribe || !activeNoteId) return;
      
      setIsAiProcessing(true);
      onTranscribe(file).then(text => {
          if (editorRef.current) {
              const html = `<p><strong>[Transcript]:</strong> ${text}</p><br/>`;
              execCmd('insertHTML', html);
          }
      }).catch(err => {
          alert("Transcription failed. " + err.message);
      }).finally(() => {
          setIsAiProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      });
  };

  // ... (Paste, Cut, Copy, Table logic same as before) ...
  const handlePaste = async () => { try { const text = await navigator.clipboard.readText(); execCmd('insertText', text); } catch (err) { alert("Browser blocked programmatic paste. Please use Ctrl+V (Cmd+V) to paste."); } };
  const handleCut = () => execCmd('cut');
  const handleCopy = () => execCmd('copy');
  const insertTable = (rows: number, cols: number, isAutoWidth: boolean = true) => { const widthStyle = isAutoWidth ? 'width: 100%;' : ''; let html = `<div style="overflow: auto; resize: vertical; margin: 1em 0; border: 1px dashed transparent;">`; html += `<table style="border-collapse: collapse; ${widthStyle} border: 1px solid #ccc; table-layout: auto;"><tbody>`; for(let r = 0; r < rows; r++) { html += '<tr>'; for(let c = 0; c < cols; c++) { html += `<td style="border: 1px solid #ccc; padding: 8px; min-width: 40px; word-break: break-word;">&nbsp;</td>`; } html += '</tr>'; } html += '</tbody></table></div><p><br/></p>'; execCmd('insertHTML', html); };
  const handleManualTableInsert = () => { insertTable(tableRows, tableCols, tableAutoWidth); setShowTableModal(false); };
  const toggleFormatPainter = () => { if (isFormatPainterActive) { setIsFormatPainterActive(false); setPainterStyles(null); return; } const styles = { bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'), underline: document.queryCommandState('underline'), strike: document.queryCommandState('strikethrough'), fontName: document.queryCommandValue('fontName'), fontSize: document.queryCommandValue('fontSize'), foreColor: document.queryCommandValue('foreColor'), hiliteColor: document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor'), }; setPainterStyles(styles); setIsFormatPainterActive(true); };
  const applyFormatPainter = () => { if (isFormatPainterActive && painterStyles) { if (painterStyles.bold !== document.queryCommandState('bold')) execCmd('bold'); if (painterStyles.italic !== document.queryCommandState('italic')) execCmd('italic'); if (painterStyles.underline !== document.queryCommandState('underline')) execCmd('underline'); if (painterStyles.strike !== document.queryCommandState('strikethrough')) execCmd('strikethrough'); execCmd('fontName', painterStyles.fontName); execCmd('fontSize', painterStyles.fontSize); execCmd('foreColor', painterStyles.foreColor); execCmd('hiliteColor', painterStyles.hiliteColor); setIsFormatPainterActive(false); setPainterStyles(null); } checkActiveFormatting(); };
  const applyListStyle = (styleType: string, isOrdered: boolean) => { const cmd = isOrdered ? 'insertOrderedList' : 'insertUnorderedList'; if (!document.queryCommandState(cmd)) { document.execCommand(cmd); } const selection = window.getSelection(); if (selection?.anchorNode) { let node = selection.anchorNode; while(node && node !== editorRef.current) { if (node.nodeName === (isOrdered ? 'OL' : 'UL')) { (node as HTMLElement).style.listStyleType = styleType; break; } node = node.parentNode; } } if (activeNoteId && editorRef.current) { updateNote(activeNoteId, { content: editorRef.current.innerHTML }); } editorRef.current?.focus(); };
  const handleAiAction = async (action: string) => { if (!activeNote || !editorRef.current?.innerText.trim()) return; setIsAiProcessing(true); try { const textContent = editorRef.current.innerText; let prompt = ""; if (action === 'grammar') prompt = `Fix the grammar and spelling of the following text. Preserve formatting. Text: \n\n${textContent}`; else if (action === 'summarize') prompt = `Summarize the following text into concise HTML bullet points. Text: \n\n${textContent}`; else if (action === 'translate') prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Return the result in HTML. Text: \n\n${textContent}`; else if (action === 'expand') prompt = `Expand on the following ideas. Text: \n\n${textContent}`; const result = await onAiAssist(prompt, textContent); const newContent = `${activeNote.content}<br/><hr/><br/><p><strong>--- AI (${action}) ---</strong></p>${result}`; updateNote(activeNote.id, { content: newContent }); if (editorRef.current) editorRef.current.innerHTML = newContent; } catch (e) { alert("AI Assistant failed to process. Please try again."); } finally { setIsAiProcessing(false); } };

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.content.toLowerCase().includes(searchTerm.toLowerCase()));
  const titleDir = activeNote ? getTextDirection(activeNote.title) : 'ltr';
  const contentDir = activeNote ? getTextDirection(editorRef.current?.innerText || '') : 'ltr';

  const FONT_FAMILIES = [ { label: 'Arial', value: 'Arial' }, { label: 'Arial Black', value: 'Arial Black' }, { label: 'Algerian', value: 'Algerian' }, { label: 'Book Antiqua', value: 'Book Antiqua' }, { label: 'Comic Sans MS', value: 'Comic Sans MS' }, { label: 'Courier New', value: 'Courier New' }, { label: 'Georgia', value: 'Georgia' }, { label: 'Impact', value: 'Impact' }, { label: 'Tahoma', value: 'Tahoma' }, { label: 'Times New Roman', value: 'Times New Roman' }, { label: 'Verdana', value: 'Verdana' } ];
  // UPDATED FONT SIZES as requested
  const FONT_SIZES = [
    { label: '8', value: '1' }, // HTML font size 1 is ~8-10px
    { label: '10', value: '2' },
    { label: '12', value: '3' },
    { label: '14', value: '4' },
    { label: '18', value: '5' },
    { label: '24', value: '6' },
    { label: '36', value: '7' }
  ];
  const BULLET_STYLES = [ { label: 'Disc', value: 'disc', preview: <div className="flex gap-2 items-center"><span className="text-lg leading-none">•</span> Disc</div> }, { label: 'Circle', value: 'circle', preview: <div className="flex gap-2 items-center"><span className="text-lg leading-none">○</span> Circle</div> }, { label: 'Square', value: 'square', preview: <div className="flex gap-2 items-center"><span className="text-lg leading-none">■</span> Square</div> }, { label: 'Diamond', value: "'◆ '", preview: <div className="flex gap-2 items-center"><span className="text-sm">◆</span> Diamond</div> }, { label: 'Diamond 2', value: "'❖ '", preview: <div className="flex gap-2 items-center"><span className="text-sm">❖</span> Diamond 2</div> }, { label: 'Arrow', value: "'➤ '", preview: <div className="flex gap-2 items-center"><span className="text-sm">➤</span> Arrow</div> }, { label: 'Check', value: "'✓ '", preview: <div className="flex gap-2 items-center"><span className="text-sm">✓</span> Check</div> }, { label: 'Star', value: "'✦ '", preview: <div className="flex gap-2 items-center"><span className="text-sm">✦</span> Star</div> }, ];
  const NUMBER_STYLES = [ { label: '1. 2. 3.', value: 'decimal', preview: <div className="flex gap-2 items-center"><span>1.</span> Decimal</div> }, { label: 'a. b. c.', value: 'lower-alpha', preview: <div className="flex gap-2 items-center"><span>a.</span> Lower Alpha</div> }, { label: 'A. B. C.', value: 'upper-alpha', preview: <div className="flex gap-2 items-center"><span>A.</span> Upper Alpha</div> }, { label: 'i. ii. iii.', value: 'lower-roman', preview: <div className="flex gap-2 items-center"><span>i.</span> Lower Roman</div> }, { label: 'I. II. III.', value: 'upper-roman', preview: <div className="flex gap-2 items-center"><span>I.</span> Upper Roman</div> }, ];

  return (
    <div className="flex h-full bg-white dark:bg-gray-900 overflow-hidden" onClick={() => setMenuOpenId(null)}>
      <style>{` .editor-content ul { padding-left: 1.5em !important; margin: 0.5em 0; } .editor-content ol { padding-left: 1.5em !important; margin: 0.5em 0; } .editor-content li { margin-bottom: 0.25em; } .editor-content blockquote { border-left: 4px solid #ddd; padding-left: 1em; color: #666; margin: 1em 0; } .editor-content table { border-collapse: collapse; margin-bottom: 1rem; width: 100%; } .editor-content td { border: 1px solid #ccc; padding: 8px; } .cursor-copy { cursor: copy !important; } `}</style>

      {/* LEFT SIDEBAR */}
      <div className={`${activeNoteId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50`}>
         <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.preventDefault(); onMenuClick(); }} className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg></button>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><span className="text-orange-500">📝</span> Notes</h2>
                </div>
                <button onClick={handleCreateNote} className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></button>
            </div>
            <div className="relative"><input type="text" placeholder="Search notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-3 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg></div>
         </div>
         <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredNotes.length === 0 ? (<div className="text-center text-gray-400 mt-10 text-sm">No notes found. Create one!</div>) : (filteredNotes.map(note => { const previewText = note.content.replace(/<[^>]+>/g, '').slice(0, 50) || 'No text'; const noteDir = getTextDirection(note.title || previewText); return (
                <div key={note.id} onClick={() => setActiveNoteId(note.id)} className={`group relative p-4 rounded-xl cursor-pointer transition-all border ${activeNoteId === note.id ? 'bg-white dark:bg-gray-800 border-orange-400 shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    <div className="flex justify-between items-start"><h3 dir={noteDir} className={`font-semibold text-sm mb-1 flex-1 ${activeNoteId === note.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} ${noteDir === 'rtl' ? 'text-right' : 'text-left'}`}>{note.title || 'Untitled Note'}</h3><div className="relative ml-2"><button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setMenuOpenId(menuOpenId === note.id ? null : note.id); }} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">•••</button>{menuOpenId === note.id && (<div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden"><button onClick={(e) => handleRenameClick(note.id, note.title, e)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Rename</button><button onClick={(e) => handleCopyContent(note.id, e)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Copy Text</button><button onClick={(e) => handleDuplicateNote(note.id, e)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Duplicate</button><button onClick={(e) => handleDownloadNote(note.id, e)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Download</button><div className="border-t border-gray-100 dark:border-gray-700 my-1"></div><button onClick={(e) => handleDeleteClick(note.id, e)} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400">Delete</button></div>)}</div></div>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">{previewText}</p>
                    <span className="text-[10px] text-gray-400 mt-2 block">{new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
            ); }))}
         </div>
      </div>

      {/* RIGHT EDITOR */}
      <div className={`${activeNoteId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white dark:bg-gray-900 relative`}>
         {activeNote ? (
            <>
               <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 shrink-0 shadow-sm transition-all duration-300">
                   <div className="flex items-center justify-between p-3 gap-3">
                       <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button onClick={() => setActiveNoteId(null)} className="md:hidden text-gray-500 p-2 -ml-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg></button>
                            <input dir={titleDir} value={activeNote.title} onChange={(e) => updateNote(activeNote.id, { title: e.target.value })} className={`flex-1 bg-transparent text-lg md:text-xl font-bold text-gray-800 dark:text-white placeholder-gray-300 border-none focus:ring-0 min-w-0 p-0 ${titleDir === 'rtl' ? 'text-right' : 'text-left'}`} placeholder="Note Title" />
                       </div>
                       
                       {/* SAVE BUTTON (New) */}
                       <button onClick={handleSaveManually} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2" title="Save Note">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.25a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12 7.5V3m0 3v4.5" /></svg>
                       </button>

                       <button onClick={handleShareNote} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2" title="Share Note">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                       </button>
                   </div>
                   
                   <div className="flex items-center justify-between px-3 pb-2 gap-2 overflow-x-auto no-scrollbar border-t border-dashed border-gray-100 dark:border-gray-800 pt-2">
                        <div className="flex items-center gap-1 md:gap-3">
                             <div className="flex gap-0.5"><ToolbarButton onClick={() => execCmd('undo')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>} title="Undo" /><ToolbarButton onClick={() => execCmd('redo')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>} title="Redo" /></div>
                             <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                             <div className="flex gap-0.5"><ToolbarButton active={isBold} onClick={() => execCmd('bold')} icon={<span className="font-bold serif">B</span>} title="Bold" /><ToolbarButton active={isItalic} onClick={() => execCmd('italic')} icon={<span className="italic serif">I</span>} title="Italic" /><ToolbarButton active={isUnderline} onClick={() => execCmd('underline')} icon={<span className="underline serif">U</span>} title="Underline" /></div>
                             <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                             <ColorPicker title="Text Color" colorValue={textColor} onChange={(val) => { execCmd('foreColor', val); setTextColor(val); }} icon={<div className="flex flex-col items-center justify-center leading-none"><span className="font-bold text-sm">A</span><div className="w-3 h-1 mt-0.5 rounded-sm transition-colors" style={{ backgroundColor: textColor }}></div></div>} />
                             <ToolbarButton onClick={handlePaste} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>} title="Paste" />
                        </div>
                        <button onClick={() => setIsExpanded(!isExpanded)} className={`p-1.5 rounded-full transition-all flex items-center justify-center ${isExpanded ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`} title={isExpanded ? "Collapse Tools" : "Expand Tools"}>{isExpanded ? (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" /></svg>)}</button>
                   </div>
                   
                   {isExpanded && (
                       <div className="px-3 pb-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 shadow-inner">
                           <div className="flex flex-wrap items-center gap-3 pt-3">
                                <div className="flex gap-0.5 items-center border-r border-gray-200 dark:border-gray-700 pr-2">
                                     <ToolbarButton active={isFormatPainterActive} onClick={toggleFormatPainter} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.077-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>} title="Format Painter" />
                                     <ToolbarButton onClick={handleCut} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>} title="Cut" />
                                     <ToolbarButton onClick={handleCopy} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" /></svg>} title="Copy" />
                                </div>
                                <div className="flex gap-2 items-center border-r border-gray-200 dark:border-gray-700 pr-2">
                                    <ToolbarSelect width="w-24 md:w-28" value={currentFont} onChange={(val) => { setCurrentFont(val); execCmd('fontName', val); }} options={FONT_FAMILIES} title="Font Family" />
                                    <ToolbarSelect width="w-16" value={currentSize} onChange={(val) => { setCurrentSize(val); execCmd('fontSize', val); }} options={FONT_SIZES} title="Size" />
                                </div>
                                <div className="flex gap-1 items-center border-r border-gray-200 dark:border-gray-700 pr-2">
                                    <ListStylePicker icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zM8 6h12v2H8V6zm0 5h12v2H8v-2zm0 5h12v2H8v-2z"/></svg>} options={BULLET_STYLES} onSelect={(val) => applyListStyle(val, false)} title="Bullet Styles" />
                                    <ListStylePicker icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h1.5v2H4V6zm0 5h1.5v2H4v-2zm0 5h1.5v2H4v-2zM7 6h13v2H7V6zm0 5h13v2H7v-2zm0 5h13v2H7v-2z"/></svg>} options={NUMBER_STYLES} onSelect={(val) => applyListStyle(val, true)} title="Numbering Styles" />
                                     <ToolbarButton active={align === 'left'} onClick={() => execCmd('justifyLeft')} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" /></svg>} title="Align Left" />
                                     <ToolbarButton active={align === 'center'} onClick={() => execCmd('justifyCenter')} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" /></svg>} title="Align Center" />
                                     <ToolbarButton active={align === 'right'} onClick={() => execCmd('justifyRight')} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM18 10a.75.75 0 01-.75.75H2.75a.75.75 0 010-1.5h14.5A.75.75 0 0118 10z" clipRule="evenodd" /></svg>} title="Align Right" />
                                     <ToolbarButton active={align === 'justify'} onClick={() => execCmd('justifyFull')} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" /></svg>} title="Justify" />
                                     <ToolbarButton onClick={() => execCmd('indent')} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" /></svg>} title="Indent" />
                                     <ToolbarButton onClick={() => execCmd('outdent')} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" /></svg>} title="Outdent" />
                                </div>
                                <div className="flex gap-1 items-center border-r border-gray-200 dark:border-gray-700 pr-2">
                                    <ColorPicker title="Highlight Color" colorValue={hiliteColor} onChange={(val) => { execCmd('hiliteColor', val); setHiliteColor(val); }} icon={<div className="flex flex-col items-center justify-center leading-none"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg><div className="w-3 h-1 mt-0.5 rounded-sm transition-colors" style={{ backgroundColor: hiliteColor }}></div></div>} />
                                    <TableGridPicker onSelect={(r, c) => insertTable(r, c, true)} onOpenManual={() => setShowTableModal(true)} />
                                    <ToolbarButton onClick={() => { const url = prompt("Enter link URL:"); if(url) execCmd('createLink', url); }} icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>} title="Insert Link" />
                                    <ToolbarButton onClick={() => execCmd('formatBlock', 'blockquote')} icon={<span className="font-serif font-bold text-lg">“</span>} title="Blockquote" />
                                    <ToolbarButton active={isSub} onClick={() => execCmd('subscript')} icon={<span className="text-xs">x₂</span>} title="Subscript" />
                                    <ToolbarButton active={isSuper} onClick={() => execCmd('superscript')} icon={<span className="text-xs">x²</span>} title="Superscript" />
                                    <ToolbarButton active={isStrike} onClick={() => execCmd('strikethrough')} icon={<span className="line-through serif">S</span>} title="Strikethrough" />
                                    <ToolbarButton onClick={() => execCmd('removeFormat')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>} title="Clear Formatting" />
                                </div>

                                {/* AUTO SAVE TOGGLE */}
                                <div className="flex gap-2 items-center border-r border-gray-200 dark:border-gray-700 pr-2">
                                    <button 
                                      onClick={() => setAutoSaveEnabled(!autoSaveEnabled)} 
                                      className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${autoSaveEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500'}`}
                                      title="Toggle Auto-Save"
                                    >
                                      {autoSaveEnabled ? 'Auto-Save: On' : 'Auto-Save: Off'}
                                    </button>
                                </div>

                                {/* AI Tools & Audio Transcription */}
                                <div className="flex gap-1 ml-auto border-l border-gray-200 dark:border-gray-700 pl-2">
                                    {/* AUDIO TRANSCRIBE BUTTON */}
                                    <button onClick={() => fileInputRef.current?.click()} disabled={isAiProcessing} className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Transcribe Audio">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleAudioFileSelect} accept="audio/*" className="hidden" />

                                    <button onClick={() => handleAiAction('grammar')} disabled={isAiProcessing} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Fix Grammar">✨</button>
                                    <button onClick={() => handleAiAction('summarize')} disabled={isAiProcessing} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Summarize">📝</button>
                                    <button onClick={() => setShowTranslate(!showTranslate)} disabled={isAiProcessing} className={`p-1.5 rounded-lg transition-colors ${showTranslate ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:text-green-600'}`} title="Translate">🌐</button>
                                </div>
                           </div>
                           
                           {/* Translation Panel */}
                           {showTranslate && (
                               <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mt-3 flex flex-wrap items-center gap-3 animate-in fade-in zoom-in-95">
                                   <div className="flex items-center gap-2">
                                       <span className="text-xs font-bold text-gray-500 uppercase">From:</span>
                                       <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"><option value="Auto">Auto Detect</option>{SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}</select>
                                   </div>
                                   <span className="text-gray-400">→</span>
                                   <div className="flex items-center gap-2">
                                       <span className="text-xs font-bold text-gray-500 uppercase">To:</span>
                                       <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">{SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}</select>
                                   </div>
                                   <button onClick={() => handleAiAction('translate')} className="ml-auto bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1 rounded shadow-sm">Translate</button>
                               </div>
                           )}
                       </div>
                   )}
               </div>

               {/* 4. EDITOR AREA */}
               <div 
                  className="flex-1 w-full bg-transparent overflow-y-auto cursor-text relative"
                  onClick={() => editorRef.current?.focus()}
               >
                  <div
                    ref={editorRef}
                    contentEditable
                    dir={contentDir}
                    onInput={handleEditorInput}
                    onKeyUp={checkActiveFormatting}
                    onMouseUp={() => { checkActiveFormatting(); if (isFormatPainterActive) applyFormatPainter(); }}
                    className={`min-h-full p-6 md:p-8 outline-none text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm md:prose-base dark:prose-invert max-w-none ${contentDir === 'rtl' ? 'text-right' : 'text-left'} ${isFormatPainterActive ? 'cursor-copy' : ''} editor-content`}
                    style={{ minHeight: '100%' }}
                    data-placeholder="Start typing your notes here..."
                  />
               </div>

               {/* Status */}
               <div className="absolute bottom-4 right-6 text-xs text-gray-300 dark:text-gray-600 pointer-events-none bg-white/80 dark:bg-gray-900/80 px-2 py-1 rounded">
                  {isAiProcessing ? "AI is thinking..." : (autoSaveEnabled ? "Saved" : "Unsaved")}
               </div>

               {/* MANUAL TABLE DIALOG */}
               {showTableModal && (
                   <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm p-5 animate-in fade-in zoom-in-95">
                           <div className="flex justify-between items-center mb-4">
                               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Insert Table</h3>
                               <button onClick={() => setShowTableModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                               </button>
                           </div>
                           <div className="space-y-4">
                               <div className="grid grid-cols-2 gap-4">
                                   <div><label className="block text-xs font-medium text-gray-500 mb-1">Number of columns</label><input type="number" min="1" max="20" value={tableCols} onChange={(e) => setTableCols(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                                   <div><label className="block text-xs font-medium text-gray-500 mb-1">Number of rows</label><input type="number" min="1" max="50" value={tableRows} onChange={(e) => setTableRows(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                               </div>
                               <div><label className="block text-xs font-medium text-gray-500 mb-2">AutoFit behavior</label><div className="space-y-2"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={!tableAutoWidth} onChange={() => setTableAutoWidth(false)} className="text-blue-600 focus:ring-blue-500" /><span className="text-sm text-gray-700 dark:text-gray-300">Fixed column width</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={tableAutoWidth} onChange={() => setTableAutoWidth(true)} className="text-blue-600 focus:ring-blue-500" /><span className="text-sm text-gray-700 dark:text-gray-300">Auto column width</span></label></div></div>
                               <div className="pt-2 flex justify-end gap-2"><button onClick={() => setShowTableModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">Cancel</button><button onClick={handleManualTableInsert} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm">OK</button></div>
                           </div>
                       </div>
                   </div>
               )}
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 dark:text-gray-700">
               <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl text-gray-200 dark:text-gray-600">✎</span>
               </div>
               <p>Select a note or create a new one</p>
            </div>
         )}
      </div>

      <ActionModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        defaultValue={modalConfig.defaultValue}
        isDestructive={modalConfig.isDestructive}
        confirmText={modalConfig.action === 'delete' ? 'Delete' : 'Save'}
        onConfirm={handleModalConfirm}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
