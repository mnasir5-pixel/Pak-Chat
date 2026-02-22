import React, { useState } from 'react';
import { ChatService } from '../services/geminiService';

interface DictionaryData {
  english: {
    definition: string;
    type: string;
    grammar: string;
    translation: string;
  };
  urdu: {
    definition: string;
    type: string;
    grammar: string;
    translation: string;
  };
  chinese: {
    definition: string;
    type: string;
    grammar: string;
    pinyin?: string;
    translation: string;
  };
}

interface DictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [data, setData] = useState<DictionaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setData(null);

    const prompt = `Act as a professional polyglot linguist. Analyze the following word, phrase, or sentence: "${inputText}"
    Provide accurate translations and linguistic details for English, Urdu, and Mandarin Chinese.
    
    Return ONLY a valid JSON object with this exact structure:
    {
      "english": { "translation": "string", "definition": "string", "type": "string", "grammar": "string" },
      "urdu": { "translation": "string", "definition": "string", "type": "string", "grammar": "string" },
      "chinese": { "translation": "string", "definition": "string", "type": "string", "grammar": "string", "pinyin": "string" }
    }
    
    Rules:
    1. If the input is a sentence, the "translation" should be the direct translation, and "definition" should explain the context or theme.
    2. Urdu "type" should use traditional terms (e.g., Ism, Fail).
    3. Chinese section MUST include accurate Pinyin for characters.
    4. Provide the result in the requested JSON format only.`;

    try {
      const service = new ChatService("You are a professional dictionary and translation API. Output valid JSON only.");
      const stream = await service.sendMessageStream(prompt);
      
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
      }

      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setData(parsed);
      }
    } catch (e) {
      console.error("Dictionary Error:", e);
      alert("Linguistic analysis failed. Please try a different query.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-slate-950 p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-950 w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Minimalist Header */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-slate-50 dark:border-slate-900">
          <div className="flex items-center gap-3">
             <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight uppercase">Smart Lexicon</h2>
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Professional Search Input */}
        <div className="px-8 py-6">
           <div className="relative group">
               <input 
                 type="text"
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 placeholder="Search word, phrase or sentence..."
                 className="w-full bg-transparent border-b-2 border-slate-100 dark:border-slate-800 py-4 text-2xl font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder-slate-200 dark:placeholder-slate-800"
                 onKeyDown={(e) => { if(e.key === 'Enter') handleTranslate(); }}
                 autoFocus
               />
               <button 
                 onClick={handleTranslate}
                 disabled={isLoading || !inputText.trim()}
                 className="absolute right-0 bottom-4 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs hover:text-indigo-800 disabled:opacity-30 transition-all"
               >
                 {isLoading ? 'Analysing...' : 'Analyse'}
               </button>
           </div>
        </div>

        {/* Results Area */}
        <div className="px-8 pb-10 overflow-y-auto flex-1 scrollbar-hide">
           {data ? (
               <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                   
                   {/* English Section */}
                   <div className="relative">
                       <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] block mb-4">English Analysis</span>
                       <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{data.english.translation}</h3>
                       <div className="flex items-baseline gap-4 mb-2">
                           <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400 italic">{data.english.type}</span>
                           <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{data.english.grammar}</span>
                       </div>
                       <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                           {data.english.definition}
                       </p>
                   </div>

                   {/* Urdu Section */}
                   <div className="text-right" dir="rtl">
                       <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] block mb-4" dir="ltr">اردو تجزیہ (Urdu Analysis)</span>
                       <h3 className="text-4xl font-black text-emerald-800 dark:text-emerald-400 mb-4 font-serif leading-tight">{data.urdu.translation}</h3>
                       <div className="flex items-baseline gap-4 mb-2">
                           <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{data.urdu.type}</span>
                           <span className="text-xs text-slate-400 font-medium">{data.urdu.grammar}</span>
                       </div>
                       <p className="text-2xl text-slate-700 dark:text-slate-300 leading-[1.6] font-serif">
                           {data.urdu.definition}
                       </p>
                   </div>

                   {/* Chinese Section */}
                   <div>
                       <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] block mb-4">Chinese Analysis</span>
                       <h3 className="text-5xl font-black text-rose-600 dark:text-rose-500 mb-2">{data.chinese.translation}</h3>
                       <div className="flex items-center gap-4 mb-3">
                           <span className="text-sm font-bold text-rose-500 dark:text-rose-400">{data.chinese.type}</span>
                           {data.chinese.pinyin && <span className="text-base font-black text-blue-500 font-mono tracking-tight">{data.chinese.pinyin}</span>}
                           <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">• {data.chinese.grammar}</span>
                       </div>
                       <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                           {data.chinese.definition}
                       </p>
                   </div>

               </div>
           ) : isLoading ? (
               <div className="flex items-center gap-4 py-10 opacity-50 justify-center">
                  <div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
               </div>
           ) : (
               <div className="py-20 text-center">
                  <p className="text-slate-200 dark:text-slate-800 text-sm font-black uppercase tracking-[0.5em]">Awaiting Transmission</p>
               </div>
           )}
        </div>
        
        {/* Seamless Footer */}
        {data && (
            <div className="px-8 py-6 border-t border-slate-50 dark:border-slate-900 text-[10px] text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.4em] text-center">
                Multi-Modal Semantic Engine Active
            </div>
        )}
      </div>
    </div>
  );
};