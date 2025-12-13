
import React from 'react';

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
    <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-li:my-0.5">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // Extract language and code
          const match = part.match(/```([\w:-]*)\n?([\s\S]*?)```/);
          const language = match ? match[1] : '';
          const code = match ? match[2] : part.slice(3, -3);

          // --- INTERACTIVE QUIZ BLOCK ---
          if (language === 'json:quiz') {
            try {
              const quiz = JSON.parse(code);
              return (
                <div key={index} className="my-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-gray-900 font-semibold text-lg mb-4">{quiz.question}</h3>
                  <div className="flex flex-col gap-2">
                    {quiz.options?.map((option: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => onReply && onReply(option)}
                        className="text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all font-medium text-gray-700"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              );
            } catch (e) {
              return <div key={index} className="text-red-500 text-xs">Error rendering quiz</div>;
            }
          }

          // --- VOCABULARY CARD BLOCK ---
          if (language === 'json:vocab') {
            try {
              const items = JSON.parse(code);
              const vocabList = Array.isArray(items) ? items : [items];
              return (
                <div key={index} className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vocabList.map((item: any, i: number) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-800 mb-1">{item.hanzi}</div>
                        <div className="text-sm text-gray-500">{item.pinyin}</div>
                        <div className="text-sm font-medium text-blue-600">{item.meaning}</div>
                      </div>
                      <button 
                        onClick={() => handleSpeak(item.hanzi)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Listen"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                         </svg>
                      </button>
                    </div>
                  ))}
                </div>
              );
            } catch (e) {
              return <div key={index} className="text-red-500 text-xs">Error rendering vocab</div>;
            }
          }

          return (
            <div key={index} className="my-4 rounded-md overflow-hidden bg-gray-900 border border-gray-700 shadow-md">
              <div className="bg-gray-800 px-4 py-1 flex justify-between items-center border-b border-gray-700">
                <span className="text-xs text-gray-300 font-mono lowercase">{language || 'code'}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-gray-100 font-mono text-xs md:text-sm">
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
  let formatted = text
    // Escape HTML (basic)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Markdown Images: ![alt](src) -> <img ... />
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-3 border border-gray-200 dark:border-gray-700" />')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet lists
    .replace(/^-\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Numbered lists
    .replace(/^\d+\.\s+(.*)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Headers
    .replace(/^### (.*)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*)$/gm, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-500 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    // Paragraphs
    .replace(/\n\n/g, '<br/><br/>');

  return formatted;
}
