
import React, { useState } from 'react';
import { ChatService } from '../services/geminiService';

interface DictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setResult(null);

    const prompt = `Translate the following text into 3 distinct languages: English, Urdu, and Chinese (Simplified).
    
    Input Text: "${inputText}"

    OUTPUT FORMAT (Strictly follow this):
    
    **English:**
    [Translation]

    **Urdu:**
    [Translation]

    **Chinese:**
    [Translation]
    `;

    try {
      // Create a temporary service instance for this one-off task
      const service = new ChatService("You are a strict and accurate multi-language translator.");
      const stream = await service.sendMessageStream(prompt);
      
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setResult(fullText);
      }
    } catch (e) {
      setResult("Error: Could not perform translation. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
          <div className="flex items-center gap-2">
             <span className="text-2xl">📖</span>
             <h2 className="text-xl font-bold text-gray-800 dark:text-white">Dictionary & Translator</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
           <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Enter Word or Sentence</label>
              <div className="relative">
                  <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type anything (e.g., 'Hello', 'How are you?')..."
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none text-gray-800 dark:text-gray-100 h-28"
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTranslate(); } }}
                  />
                  <button 
                    onClick={handleTranslate}
                    disabled={isLoading || !inputText.trim()}
                    className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                    title="Translate"
                  >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    )}
                  </button>
              </div>
           </div>

           {/* Results Area */}
           {(result || isLoading) && (
               <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                   {result ? (
                       <div className="prose prose-sm dark:prose-invert max-w-none">
                           {/* Simple parser to make headings pop */}
                           {result.split('\n').map((line, idx) => {
                               if (line.includes('English:') || line.includes('Urdu:') || line.includes('Chinese:')) {
                                   return <h4 key={idx} className="text-indigo-600 dark:text-indigo-400 font-bold mt-3 mb-1 text-base">{line.replace(/\*\*/g, '')}</h4>;
                               }
                               return <p key={idx} className="text-gray-700 dark:text-gray-300 my-1 leading-relaxed text-lg">{line}</p>;
                           })}
                       </div>
                   ) : (
                       <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                           <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-2"></div>
                           <span className="text-xs">Translating...</span>
                       </div>
                   )}
               </div>
           )}
        </div>
      </div>
    </div>
  );
};
