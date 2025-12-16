
import React, { useRef, useEffect } from 'react';

// Define window interface for TS if needed, though 'any' casting is used below
// interface Window { HanziWriter: any; }

const HanziWriterComponent: React.FC<{ char: string }> = ({ char }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);

  useEffect(() => {
    if (divRef.current && (window as any).HanziWriter && char) {
        // Clear previous instance if any
        divRef.current.innerHTML = '';
        
        try {
            writerRef.current = (window as any).HanziWriter.create(divRef.current, char, {
                width: 100,
                height: 100,
                padding: 5,
                strokeColor: '#3b82f6', // blue-500
                radicalColor: '#16a34a', // green-600
                showOutline: true,
                outlineColor: '#e2e8f0', // slate-200
                delayBetweenStrokes: 150,
            });
            writerRef.current.loopCharacterAnimation();
        } catch (e) {
            console.error("HanziWriter Error:", e);
            divRef.current.innerText = char; // Fallback text
        }
    }
  }, [char]);

  return (
    <div 
        ref={divRef} 
        className="w-[100px] h-[100px] bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:shadow-md transition-shadow flex items-center justify-center text-4xl font-bold text-gray-800 dark:text-gray-200"
        title="Tap to animate"
        onClick={() => writerRef.current?.animateCharacter()}
    />
  );
};

interface SimpleMarkdownProps {
  content: string;
  onReply?: (message: string) => void;
}

export const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ content, onReply }) => {
  // Simple parser to split code blocks from text
  const parts = content.split(/(```[\s\S]*?```)/g);

  const handleSpeak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to set Chinese voice if available
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh'));
    if (zhVoice) utterance.voice = zhVoice;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 leading-snug">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // Extract language and code
          const match = part.match(/```([\w:-]*)\n?([\s\S]*?)```/);
          const language = match ? match[1] : '';
          const code = match ? match[2] : part.slice(3, -3);

          // --- INTERACTIVE QUIZ BLOCK ---
          if (language === 'json:quiz') {
            try {
              // Safety: Ensure valid JSON before rendering to avoid crashes
              const quiz = JSON.parse(code);
              
              if (!quiz || typeof quiz !== 'object' || !quiz.question || !Array.isArray(quiz.options)) {
                  // If JSON is incomplete (streaming), render fallback instead of crashing
                  throw new Error("Incomplete quiz data");
              }

              return (
                <div key={index} className="my-2 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in zoom-in-95">
                  <h3 className="text-gray-900 dark:text-white font-semibold text-base mb-3">{quiz.question}</h3>
                  <div className="flex flex-col gap-1.5">
                    {quiz.options.map((option: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => onReply && onReply(option)}
                        className="text-left px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-all font-medium text-gray-700 dark:text-gray-300 text-sm"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              );
            } catch (e) {
              // Graceful Fallback: Shows loading state if JSON is still streaming
              return (
                <div key={index} className="text-xs text-gray-400 p-2 border border-gray-100 dark:border-gray-800 rounded animate-pulse">
                    Generating Quiz...
                </div>
              );
            }
          }

          // --- VOCABULARY CARD BLOCK ---
          if (language === 'json:vocab') {
            try {
              const items = JSON.parse(code);
              const vocabList = Array.isArray(items) ? items : [items];
              
              if (vocabList.length === 0) throw new Error("Empty vocab");

              return (
                <div key={index} className="my-4 grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-bottom-2">
                  {vocabList.map((item: any, i: number) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                      <div className="flex gap-4">
                          
                          {/* LEFT: STROKE ANIMATION (TARGET WORD) */}
                          <div className="shrink-0 flex flex-col items-center">
                              {/* Only animate the first character if multiple, or simple text if English */}
                              {(window as any).HanziWriter && /[\u4e00-\u9fa5]/.test(item.hanzi) ? (
                                  <HanziWriterComponent char={item.hanzi.charAt(0)} />
                              ) : (
                                  <div className="w-[100px] h-[100px] bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center text-4xl font-bold">
                                      {item.hanzi ? item.hanzi.charAt(0) : '?'}
                                  </div>
                              )}
                              {/* Target Pronunciation (Pinyin or IPA) */}
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono text-center max-w-[100px] break-words">{item.pinyin}</span>
                          </div>

                          {/* RIGHT: DETAILS (SEPARATE PRONUNCIATIONS) */}
                          <div className="flex-1 flex flex-col justify-center min-w-0 gap-3">
                              
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-none">{item.hanzi}</h3>
                              
                              {/* ENGLISH SECTION */}
                              <div className="flex flex-col">
                                  <div className="flex items-baseline gap-2 text-sm">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase w-8">ENG</span>
                                      <span className="text-gray-800 dark:text-gray-200 font-semibold">{item.english_meaning || item.meaning}</span>
                                  </div>
                                  {item.english_pronunciation && (
                                      <div className="ml-10 text-xs text-gray-500 dark:text-gray-400 italic">
                                          Pron: {item.english_pronunciation}
                                      </div>
                                  )}
                              </div>

                              {/* URDU SECTION */}
                              {(item.urdu_meaning) && (
                                  <div className="flex flex-col">
                                      <div className="flex items-baseline gap-2 text-sm">
                                          <span className="text-[10px] font-bold text-gray-400 uppercase w-8">URDU</span>
                                          <span className="text-green-700 dark:text-green-400 font-medium font-serif text-base">{item.urdu_meaning}</span>
                                      </div>
                                      {item.urdu_pronunciation && (
                                          <div className="ml-10 text-xs text-gray-500 dark:text-gray-400 italic">
                                              Roman: {item.urdu_pronunciation}
                                          </div>
                                      )}
                                  </div>
                              )}

                              <button 
                                onClick={() => handleSpeak(item.hanzi)}
                                className="mt-1 flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline w-fit"
                              >
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                   <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                   <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                                 </svg>
                                 Listen to {item.hanzi}
                              </button>
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            } catch (e) {
              return <div key={index} className="text-xs text-gray-400 p-2 border border-gray-100 dark:border-gray-800 rounded animate-pulse">Generating Vocabulary...</div>;
            }
          }

          return (
            <div key={index} className="my-2 rounded-md overflow-hidden bg-gray-900 border border-gray-700 shadow-md">
              <div className="bg-gray-800 px-3 py-1 flex justify-between items-center border-b border-gray-700">
                <span className="text-[10px] text-gray-300 font-mono lowercase">{language || 'code'}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-gray-100 font-mono text-xs">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Render regular text with simple formatting for bold, lists, and newlines
        return (
           <div key={index} dangerouslySetInnerHTML={{ __html: formatText(part) }} />
        );
      })}
    </div>
  );
};

// Basic formatter for text outside code blocks
function formatText(text: string): string {
  if (!text) return '';
  let formatted = text
    // Escape HTML (basic)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Markdown Images: ![alt](src) -> <img ... />
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-2 border border-gray-200 dark:border-gray-700" />')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet lists
    .replace(/^-\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Numbered lists
    .replace(/^\d+\.\s+(.*)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Headers
    .replace(/^### (.*)$/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
    .replace(/^## (.*)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 text-red-500 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    // Paragraphs
    .replace(/\n\n/g, '<br/><br/>');

  return formatted;
}

