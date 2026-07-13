import React, { useState } from 'react';
import { Users, ShieldAlert, Sparkles, BookOpen, GraduationCap, Trophy, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function GroupStudy({ twin }) {
  const [activeMode, setActiveMode] = useState('group'); // group, faculty

  const members = [
    { name: "Sneha Sharma", level: 3, streak: 8, xp: 1250, badge: "Database Master" },
    { name: `${twin.username} (You)`, level: twin.level, streak: twin.streak, xp: twin.xp, badge: "Twin Linker" },
    { name: "Rahul Verma", level: 2, streak: 4, xp: 950, badge: "SQL Speedster" },
    { name: "Rohan Das", level: 1, streak: 2, xp: 420, badge: "Beginner Explorer" }
  ];

  const groupDocs = [
    { title: "DBMS Joins Cheat Sheet", uploadedBy: "Sneha", date: "2 hours ago" },
    { title: "Operating Systems Memory Page Table brief", uploadedBy: "Rahul", date: "Yesterday" }
  ];

  // Faculty Mock Analytics
  const classAverages = [
    { name: 'Unit 1', AverageScore: 82, Coverage: 95 },
    { name: 'Unit 2', AverageScore: 78, Coverage: 90 },
    { name: 'Unit 3', AverageScore: 68, Coverage: 75 },
    { name: 'Unit 4', AverageScore: 61, Coverage: 40 },
    { name: 'Unit 5', AverageScore: 0, Coverage: 10 }
  ];

  return (
    <div className="space-y-6">
      {/* Tab toggle */}
      <div className="flex justify-between items-center border-b border-glassBorder pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Users className="h-7 w-7 text-neonPurple drop-shadow-neon" /> Collaborative Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Learn together in study groups or review class trends in Faculty Mode.
          </p>
        </div>
        
        <div className="flex bg-slate-900 p-1.5 rounded-xl border border-glassBorder text-xs">
          <button 
            onClick={() => setActiveMode('group')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeMode === 'group' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-neon' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Group Study
          </button>
          <button 
            onClick={() => setActiveMode('faculty')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeMode === 'faculty' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-neon' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Faculty Mode
          </button>
        </div>
      </div>

      {activeMode === 'group' ? (
        /* Group Study Dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Member leaderboards (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" /> Study Group Leaderboard
              </h3>
              <p className="text-xs text-slate-400 mb-4">Complete study goals and quizzes to outpace your peers.</p>

              <div className="space-y-3">
                {members
                  .sort((a, b) => b.xp - a.xp)
                  .map((m, index) => {
                    const isUser = m.name.includes("(You)");
                    return (
                      <div 
                        key={m.name} 
                        className={`p-3.5 border rounded-xl flex items-center justify-between transition-all ${
                          isUser 
                            ? 'bg-purple-950/20 border-purple-500/30 text-white' 
                            : 'bg-white/2 border-glassBorder text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 w-4">#{index + 1}</span>
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              {m.name}
                              <span className="text-[9px] bg-purple-500/10 text-purple-300 px-1.5 py-0.25 rounded font-semibold uppercase">
                                Lvl {m.level}
                              </span>
                            </h4>
                            <span className="text-[10px] text-slate-500">{m.badge}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-neonCyan">{m.xp} XP</div>
                          <div className="text-[9px] text-slate-500">Streak: {m.streak}🔥</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Quiz Battles */}
            <div className="glass-panel p-5 rounded-2xl border border-neonCyan/20">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-neonCyan" /> Group Quiz Battle
              </h3>
              <p className="text-xs text-slate-400 mb-4">Challenge Sneha or Rahul to a real-time syllabus quiz battle.</p>
              
              <div className="flex justify-between items-center bg-cyan-950/10 border border-cyan-500/15 p-4 rounded-xl text-xs text-cyan-400">
                <div>
                  <div className="font-bold text-white text-sm">Active Challenge: Relational Algebra</div>
                  <div className="text-[10px] text-slate-400 mt-1">Sneha scored 4/5. Your turn to play!</div>
                </div>
                <button className="px-4 py-2 bg-neonCyan text-black text-xs font-extrabold rounded-lg hover:bg-cyan-500 transition-all">
                  Join Battle
                </button>
              </div>
            </div>
          </div>

          {/* Shared files (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-neonPurple" /> Shared Study Vault
              </h3>
              <p className="text-xs text-slate-400 mb-4">Syllabus documents and notes shared by group mates.</p>

              <div className="space-y-3">
                {groupDocs.map((doc) => (
                  <div key={doc.title} className="p-3 bg-white/2 border border-glassBorder rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{doc.title}</h4>
                      <span className="text-[9px] text-slate-500">Shared by {doc.uploadedBy} | {doc.date}</span>
                    </div>
                    <button className="text-[10px] text-neonPurple font-bold hover:underline">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Faculty Admin Dashboard Mode */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Class trends chart (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-neonCyan" /> Class Academic trends
              </h3>
              <p className="text-xs text-slate-400 mb-4">Anonymized test scores and syllabus coverage averages across 42 students.</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classAverages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f0c1b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey="AverageScore" fill="#a855f7" radius={[4, 4, 0, 0]} name="Average Score %" />
                    <Bar dataKey="Coverage" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Syllabus Coverage %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Attention warnings (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-red-500/20">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-400 animate-pulse" /> At-Risk Students
              </h3>
              <p className="text-xs text-slate-400 mb-4">Anonymized student profiles failing to maintain spaced repetition schedules.</p>

              <div className="space-y-3">
                {[
                  { id: "Student #12", gap: "Normalization", score: "42% Quiz avg", action: "Schedule alert" },
                  { id: "Student #31", gap: "SQL Subqueries", score: "55% Quiz avg", action: "Push notes pack" }
                ].map((item) => (
                  <div key={item.id} className="p-3 bg-white/2 border border-glassBorder rounded-xl text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white">{item.id}</span>
                      <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.25 rounded font-bold uppercase">
                        Warning
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Syllabus gap: **{item.gap}**. Performs at {item.score}.
                    </p>
                    <button className="w-full py-1 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-[9px] font-bold text-red-400 rounded transition-all">
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupStudy;
