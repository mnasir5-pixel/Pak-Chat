
import React from 'react';
import { X, ExternalLink, Copy, Check } from 'lucide-react';

interface LinkConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const LinkConfirmModal: React.FC<LinkConfirmModalProps> = ({ isOpen, onClose, url, title }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
        setCopied(false);
        onClose();
    }, 1000);
  };

  const handleOpen = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-sm p-6 shadow-2xl border border-gray-200 dark:border-white/10 transform scale-100">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600">
                <ExternalLink size={24} />
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>
        
        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Link Options</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium break-all">
            {title || url}
        </p>

        <div className="space-y-3">
           <button 
             onClick={handleOpen}
             className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
           >
             <ExternalLink size={14} /> Open Source
           </button>
           
           <button 
             onClick={handleCopy}
             className="w-full py-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
           >
             {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
             {copied ? 'Copied' : 'Copy Link'}
           </button>
           
           <button 
             onClick={onClose}
             className="w-full py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold text-[10px] uppercase tracking-widest transition-colors"
           >
             Cancel
           </button>
        </div>
      </div>
    </div>
  );
};
