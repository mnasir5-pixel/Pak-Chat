import React from 'react';
import { 
  MessageSquare, BookOpen, Library, 
  Sparkles, Mic2, GraduationCap, Languages, ArrowRight, Zap, 
  FileText, Database, ChevronRight
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (view: any, id?: string) => void;
  userName?: string;
}

const FeatureCard: React.FC<{
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  badge?: string;
}> = ({ title, desc, icon, color, onClick, badge }) => (
  <button 
    onClick={onClick}
    className="group relative flex flex-col p-6 bg-white dark:bg-[#0a0a0e] border border-gray-100 dark:border-white/5 rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-blue-500/30 transition-all text-left overflow-hidden active:scale-[0.98]"
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 shadow-lg ${color}`}>
      {icon}
    </div>
    {badge && (
      <span className="absolute top-6 right-6 px-2 py-1 bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-blue-500/20">
        {badge}
      </span>
    )}
    <h3 className="font-black text-gray-900 dark:text-white text-lg uppercase tracking-tight mb-2 group-hover:text-blue-500 transition-colors">{title}</h3>
    <p className="text-xs text-gray-400 font-medium leading-relaxed opacity-80 mb-6">{desc}</p>
    
    <div className="mt-auto flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest py-1.5 px-3 bg-gray-50 dark:bg-white/5 rounded-full text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-all">Launch Module</span>
        <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
    </div>
  </button>
);

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, userName }) => {
  const FEATURES = [
    {
      id: 'chat',
      title: 'Pak Chat',
      desc: 'Advanced AI assistant for reasoning, coding, and creative writing.',
      icon: <MessageSquare size={24} />,
      color: 'bg-blue-600 text-white',
      badge: 'V3 Core'
    },
    {
      id: 'notes-lm',
      title: 'NotesLM',
      desc: 'Research-grade source analysis with grounded knowledge trees.',
      icon: <Sparkles size={24} />,
      color: 'bg-indigo-600 text-white',
      badge: 'Insightful'
    },
    {
      id: 'resource-hub',
      title: 'Librarian AI',
      desc: 'Direct retrieval of textbooks, research papers, and documents.',
      icon: <Library size={24} />,
      color: 'bg-orange-600 text-white',
      badge: 'Archive'
    },
    {
      id: 'voice-chat',
      title: 'Voice Chat',
      desc: 'Real-time low-latency audio conversations with diverse personalities.',
      icon: <Mic2 size={24} />,
      color: 'bg-rose-600 text-white',
      badge: 'Interactive'
    },
    {
      id: 'notes',
      title: 'Personal Notes',
      desc: 'Full-featured document editor with integrated AI assistance.',
      icon: <FileText size={24} />,
      color: 'bg-slate-800 text-white',
      badge: 'Productivity'
    }
  ];

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-6 py-12 animate-in fade-in zoom-in duration-500 overflow-y-auto no-scrollbar">
      <div className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-blue-500 fill-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Workspace Dashboard</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            Welcome back{userName ? `, ${userName}` : ''}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium text-lg italic">Access all Pak Chat modules from your central intelligence hub.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {FEATURES.map((feature) => (
          <FeatureCard 
            key={feature.id}
            title={feature.title}
            desc={feature.desc}
            icon={feature.icon}
            color={feature.color}
            badge={feature.badge}
            onClick={() => onNavigate(feature.id)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 dark:bg-white/5 rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3 mb-6">
                  <Languages size={24} className="text-teal-500" />
                  <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Language Trackers</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">Resume your linguistic mastery sessions with specialized AI agents.</p>
              <button 
                onClick={() => onNavigate('tutors', 'chinese-default')}
                className="w-full py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-between px-6 hover:border-blue-500 transition-all group mb-3 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl">🇨🇳</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300">Chinese Mastery</span>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-all" />
              </button>
              <button 
                onClick={() => onNavigate('tutors', 'english-default')}
                className="w-full py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-between px-6 hover:border-blue-500 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl">🇬🇧</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300">English Fluency</span>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-all" />
              </button>
          </div>

          <div className="bg-gray-50 dark:bg-white/5 rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3 mb-6">
                  <GraduationCap size={24} className="text-purple-500" />
                  <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Study School</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">Interactive classrooms for subject-specific learning and curriculum tracking.</p>
              <div className="grid grid-cols-3 gap-2">
                 {['📐 Math', '🧬 Science', '💻 Tech'].map(sub => (
                   <button 
                    key={sub}
                    onClick={() => onNavigate('study-school', sub.split(' ')[1])}
                    className="py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-600 hover:border-purple-500 transition-all shadow-sm"
                   >
                     {sub}
                   </button>
                 ))}
              </div>
          </div>
      </div>

      <div className="mt-16 flex items-center justify-center p-12 border border-dashed border-gray-200 dark:border-white/10 rounded-[3rem] opacity-30">
          <Database size={48} className="text-gray-400" />
      </div>
    </div>
  );
};
