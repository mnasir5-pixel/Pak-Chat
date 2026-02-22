import React, { useState } from 'react';
import { ChatService } from '../services/geminiService';
import { Search, Loader2, Volume2, Globe } from 'lucide-react';

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

export const DictionarySidebar: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [data, setData] = useState<DictionaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setData(null);

    const prompt = `Analyze: "${inputText}". Provide translations/linguistic details for English, Urdu, and Chinese. Output ONLY valid JSON:
    {
      "english": { "translation": "string", "definition": "string", "type": "string", "grammar": "string" },
      "urdu": { "translation": "string", "definition": "string", "type": "string", "grammar": "string" },
      "chinese": { "translation": "string", "definition": "string", "type": "string", "grammar": "string", "pinyin": "string" }
    }`;

    try {
      const service = new ChatService("Dictionary API. Output valid JSON.");
      const stream = await service.sendMessageStream(prompt);
      let fullText = '';
      for await (const chunk of stream) { fullText += chunk; }
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) setData(JSON.parse(jsonMatch[0]));
    } catch (e) {
      alert("Linguistic analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="relative group">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Search word or phrase..."
            className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 px-4 py-4 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white"
            onKeyDown={(e) => { if(e.key === 'Enter') handleTranslate(); }}
          />
          <button 
            onClick={handleTranslate}
            disabled={isLoading || !inputText.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl shadow-lg disabled:opacity-30"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
      </div>

      {data ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Section label="English Analysis" lang="en" data={data.english} />
              <Section label="اردو تجزیہ" lang="ur" data={data.urdu} />
              <Section label="Chinese Analysis" lang="zh" data={data.chinese} />
          </div>
      ) : (
          <div className="py-20 text-center opacity-30">
             <Globe size={48} className="mx-auto mb-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Search to begin</p>
          </div>
      )}
    </div>
  );
};

const Section = ({ label, lang, data }: { label: string; lang: 'en' | 'ur' | 'zh', data: any }) => (
  <div className={`relative ${lang === 'ur' ? 'text-right' : 'text-left'}`} dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] block mb-3" dir="ltr">{label}</span>
      <h3 className={`font-black text-slate-900 dark:text-white mb-2 leading-none ${lang === 'zh' ? 'text-5xl' : lang === 'ur' ? 'text-4xl font-serif' : 'text-2xl'}`}>{data.translation}</h3>
      <div className="flex items-center gap-3 mb-2 flex-wrap" dir="ltr">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 italic">{data.type}</span>
          {data.pinyin && <span className="text-xs font-black text-emerald-500 font-mono">[{data.pinyin}]</span>}
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">• {data.grammar}</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          {data.definition}
      </p>
  </div>
);