import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const RightDrawer: React.FC<RightDrawerProps> = ({ isOpen, onClose, title, icon, children }) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 z-[490] transition-opacity duration-300 backdrop-blur-[2px] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div 
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full z-[500] w-full sm:w-[450px] bg-white dark:bg-[#0a0a10] shadow-[-10px_0_30px_rgba(0,0,0,0.1)] transform transition-transform duration-300 ease-in-out flex flex-col border-l border-gray-100 dark:border-white/5 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5 shrink-0 bg-white/80 dark:bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600/10 text-blue-600 rounded-lg">
                {icon}
             </div>
             <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">{title}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          {children}
        </div>
      </div>
    </>
  );
};