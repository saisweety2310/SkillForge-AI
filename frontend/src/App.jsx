import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, BookOpen, Network, 
  CalendarRange, BrainCircuit, GraduationCap, Briefcase, 
  Users, Flame, Sparkles, Smile, MessageCircleCode
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Notes from './pages/Notes';
import GraphView from './pages/GraphView';
import Planner from './pages/Planner';
import QuizArena from './pages/QuizArena';
import ExamPrep from './pages/ExamPrep';
import CareerHub from './pages/CareerHub';
import GroupStudy from './pages/GroupStudy';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [twin, setTwin] = useState({
    username: "ForgeStudent",
    learning_speed: 1.0,
    preferred_time: "Evening",
    streak: 3,
    xp: 280,
    badges: JSON.stringify(["Welcome Badge", "Knowledge Seeker"]),
    level: 1,
    study_time_total: 4.5,
    accuracy_total: 78.5,
    weekly_hours: JSON.stringify([1.2, 0.8, 1.5, 1.0, 0, 0, 0]),
    motivation_score: 75,
    current_mood: "Focused"
  });

  // Fetch twin profile from API on mount
  const fetchTwinData = async () => {
    try {
      const res = await fetch(`${API_BASE}/twin`);
      if (res.ok) {
        const data = await res.json();
        setTwin(data);
      }
    } catch (e) {
      console.log("Using mock twin data - backend connection pending.");
    }
  };

  useEffect(() => {
    fetchTwinData();
    // Prompt mood check-in on first load after a delay
    const hasCheckedIn = sessionStorage.getItem("checked_in_mood");
    if (!hasCheckedIn) {
      setTimeout(() => setShowMoodModal(true), 1500);
    }
  }, []);

  const handleMoodSelect = async (mood) => {
    setShowMoodModal(false);
    sessionStorage.setItem("checked_in_mood", "true");
    
    try {
      const formData = new FormData();
      formData.append("mood", mood);
      const res = await fetch(`${API_BASE}/twin/mood`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setTwin(data);
      } else {
        updateMockMood(mood);
      }
    } catch (e) {
      updateMockMood(mood);
    }
  };

  const updateMockMood = (mood) => {
    const moodMap = {
      "Focused": { motivation: 90, xp: 15 },
      "Energetic": { motivation: 95, xp: 20 },
      "Stressed": { motivation: 50, xp: 5 },
      "Tired": { motivation: 40, xp: 5 },
      "Anxious": { motivation: 55, xp: 5 }
    };
    const adj = moodMap[mood] || { motivation: 70, xp: 0 };
    setTwin(prev => ({
      ...prev,
      current_mood: mood,
      motivation_score: adj.motivation,
      xp: prev.xp + adj.xp
    }));
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Document Hub', icon: FileText },
    { id: 'notes', label: 'Notes Generator', icon: BookOpen },
    { id: 'graph', label: 'Knowledge Graph', icon: Network },
    { id: 'planner', label: 'Adaptive Planner', icon: CalendarRange },
    { id: 'quizzes', label: 'Quiz & Debate', icon: BrainCircuit },
    { id: 'exam', label: 'Exam Mode', icon: GraduationCap },
    { id: 'careers', label: 'Careers & Projects', icon: Briefcase },
    { id: 'group', label: 'Group Study', icon: Users },
  ];

  const parsedBadges = JSON.parse(twin.badges || "[]");

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard twin={twin} fetchTwin={fetchTwinData} />;
      case 'documents': return <Documents twin={twin} fetchTwin={fetchTwinData} />;
      case 'notes': return <Notes twin={twin} fetchTwin={fetchTwinData} />;
      case 'graph': return <GraphView />;
      case 'planner': return <Planner twin={twin} fetchTwin={fetchTwinData} />;
      case 'quizzes': return <QuizArena twin={twin} fetchTwin={fetchTwinData} />;
      case 'exam': return <ExamPrep twin={twin} fetchTwin={fetchTwinData} />;
      case 'careers': return <CareerHub />;
      case 'group': return <GroupStudy twin={twin} fetchTwin={fetchTwinData} />;
      default: return <Dashboard twin={twin} fetchTwin={fetchTwinData} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-darkBg text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-glassBorder flex flex-col justify-between p-4 z-20">
        <div>
          <div className="flex items-center gap-2 mb-8 px-2 py-3 border-b border-glassBorder">
            <Sparkles className="h-7 w-7 text-neonPurple drop-shadow-neon" />
            <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              SkillForge AI
            </span>
          </div>

          {/* User Cognitive Status Mini-Card */}
          <div className="p-3 mb-6 rounded-xl bg-purple-950/20 border border-purple-500/15">
            <div className="flex justify-between items-center text-xs text-purple-300 font-medium mb-1">
              <span>LEARNING TWIN</span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Smile className="h-3 w-3" /> {twin.current_mood}
              </span>
            </div>
            <p className="text-sm font-semibold truncate text-white">{twin.username}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-purple-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-neonPurple to-neonCyan" 
                  style={{ width: `${(twin.xp % 500) / 5}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-neonCyan">Lvl {twin.level}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{twin.xp % 500} / 500 XP</span>
              <span>Streak: {twin.streak}🔥</span>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-white border border-purple-500/35 shadow-neon' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-neonPurple' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info / mood check-in trigger */}
        <div className="mt-auto pt-4 border-t border-glassBorder space-y-2">
          <button 
            onClick={() => setShowMoodModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cyan-950/20 border border-cyan-500/20 hover:bg-cyan-950/40 text-xs font-semibold text-cyan-400 transition-all"
          >
            <Smile className="h-4.5 w-4.5" /> Check-in Mood
          </button>
          <div className="text-[10px] text-slate-500 text-center">
            SkillForge AI Platform v1.0
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto relative p-6 md:p-8">
        {/* Glow Effects */}
        <div className="glow-orb absolute top-20 right-20 w-72 h-72 rounded-full bg-neonPurple/5 blur-3xl pointer-events-none z-0"></div>
        <div className="glow-orb absolute bottom-20 left-20 w-96 h-96 rounded-full bg-neonCyan/5 blur-3xl pointer-events-none z-0"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Mood Check-In Modal */}
      {showMoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 border border-purple-500/30 shadow-neon">
            <h3 className="text-xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Emotion-Aware Study Check-in
            </h3>
            <p className="text-xs text-slate-400 text-center mb-6">
              Rate your mood today. SkillForge AI will dynamically tailor your study schedule, session length, and XP rewards.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { name: 'Focused', emoji: '🎯', desc: 'Ready to tackle deep work', color: 'border-green-500/30 hover:bg-green-500/10 text-green-400' },
                { name: 'Energetic', emoji: '⚡', desc: 'Highly motivated to learn', color: 'border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-400' },
                { name: 'Stressed', emoji: '😰', desc: 'Lighter lessons suggested', color: 'border-orange-500/30 hover:bg-orange-500/10 text-orange-400' },
                { name: 'Tired', emoji: '😴', desc: 'Quick bullet revisions', color: 'border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400' },
                { name: 'Anxious', emoji: '😟', desc: 'Confidence building quizzes', color: 'border-pink-500/30 hover:bg-pink-500/10 text-pink-400' }
              ].map((mood) => (
                <button
                  key={mood.name}
                  onClick={() => handleMoodSelect(mood.name)}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all bg-white/2 ${mood.color}`}
                >
                  <span className="text-2xl mb-1">{mood.emoji}</span>
                  <span className="text-sm font-semibold">{mood.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{mood.desc}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowMoodModal(false)}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all"
            >
              Skip Check-in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
