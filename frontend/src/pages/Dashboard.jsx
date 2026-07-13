import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  RadialBarChart, RadialBar, Legend, BarChart, Bar
} from 'recharts';
import { 
  Flame, Trophy, Award, Clock, Target, Calendar, 
  TrendingUp, CheckCircle2, ShieldAlert, Sparkles, Smile
} from 'lucide-react';
import { API_BASE } from '../App';

function Dashboard({ twin, fetchTwin }) {
  const [goals, setGoals] = useState([
    { id: 1, goal_text: "Complete a 15-minute study session", completed: false },
    { id: 2, goal_text: "Generate study notes from a document", completed: true },
    { id: 3, goal_text: "Pass an adaptive quiz with >80% accuracy", completed: false }
  ]);
  const [weaknesses, setWeaknesses] = useState([
    { id: 1, concept_name: "3NF Normalization", subject: "DBMS", severity: "High" },
    { id: 2, concept_name: "SQL JOIN Queries", subject: "DBMS", severity: "Medium" }
  ]);

  // Load goals and weaknesses
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const goalsRes = await fetch(`${API_BASE}/goals`);
        if (goalsRes.ok) {
          const gData = await goalsRes.ok ? await goalsRes.json() : [];
          if (gData.length > 0) setGoals(gData);
        }
        
        const weakRes = await fetch(`${API_BASE}/weaknesses`);
        if (weakRes.ok) {
          const wData = await weakRes.json();
          if (wData.length > 0) setWeaknesses(wData);
        }
      } catch (e) {
        console.log("Using mock dashboard data");
      }
    };
    loadDashboardData();
  }, []);

  const toggleGoal = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/goals/${id}/toggle`, {
        method: "PUT"
      });
      if (res.ok) {
        const updatedGoal = await res.json();
        setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
        fetchTwin(); // Refresh XP/Streak
      } else {
        toggleMockGoal(id);
      }
    } catch (e) {
      toggleMockGoal(id);
    }
  };

  const toggleMockGoal = (id) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const newStatus = !g.completed;
        if (newStatus) {
          twin.xp += 15; // Give mock XP
          fetchTwin();
        }
        return { ...g, completed: newStatus };
      }
      return g;
    }));
  };

  // Convert weekly hours string to numbers array
  let hoursArray = [1.2, 0.8, 1.5, 1.0, 0, 0, 0];
  try {
    hoursArray = JSON.parse(twin.weekly_hours);
  } catch (e) {}

  const studyData = [
    { name: 'Mon', Hours: hoursArray[0] },
    { name: 'Tue', Hours: hoursArray[1] },
    { name: 'Wed', Hours: hoursArray[2] },
    { name: 'Thu', Hours: hoursArray[3] },
    { name: 'Fri', Hours: hoursArray[4] },
    { name: 'Sat', Hours: hoursArray[5] },
    { name: 'Sun', Hours: hoursArray[6] },
  ];

  // Semester Success Prediction score logic
  const attendance = 85; // mock
  const internalMarks = 82; // mock
  const readinessScore = Math.min(
    Math.round(
      (attendance * 0.3) + 
      (internalMarks * 0.4) + 
      (twin.accuracy_total * 0.2) + 
      (twin.streak * 2)
    ), 100
  );

  const parsedBadges = JSON.parse(twin.badges || "[]");

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Welcome back, <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">{twin.username}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Here's what your learning twin has scheduled for your session.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-purple-950/20 border border-purple-500/20 px-4 py-2 rounded-xl">
          <Smile className="h-5 w-5 text-neonPurple" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Mood Status</div>
            <div className="text-sm font-bold text-white">{twin.current_mood} check-in active</div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Study Streak', value: `${twin.streak} Days`, desc: 'Active learning days', icon: Flame, color: 'text-orange-400 border-orange-500/10 bg-orange-500/5' },
          { label: 'Platform XP', value: `${twin.xp} XP`, desc: `Level ${twin.level} Apprentice`, icon: Trophy, color: 'text-purple-400 border-purple-500/10 bg-purple-500/5' },
          { label: 'Avg Quiz Accuracy', value: `${twin.accuracy_total}%`, desc: 'Across all subjects', icon: Target, color: 'text-cyan-400 border-cyan-500/10 bg-cyan-500/5' },
          { label: 'Total Study Time', value: `${twin.study_time_total} hrs`, desc: 'Dedicated focus', icon: Clock, color: 'text-pink-400 border-pink-500/10 bg-pink-500/5' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-panel p-4 rounded-xl border ${stat.color} flex flex-col justify-between`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-400">{stat.label}</span>
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{stat.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Analytics Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-neonPurple" /> Study Hours Analytics
                </h2>
                <p className="text-xs text-slate-400">Total time spent studying this week</p>
              </div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f0c1b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="Hours" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Goals Check-in */}
          <div className="glass-panel p-5 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-neonCyan" /> AI-Generated Daily Goals
            </h2>
            <p className="text-xs text-slate-400 mb-4">Custom milestones based on your active syllabi and weaknesses.</p>
            
            <div className="space-y-3">
              {goals.map((g) => (
                <div 
                  key={g.id} 
                  onClick={() => toggleGoal(g.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    g.completed 
                      ? 'bg-cyan-950/10 border-cyan-500/20 text-slate-400' 
                      : 'bg-white/3 border-glassBorder hover:border-purple-500/30 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                      g.completed ? 'bg-neonCyan border-neonCyan' : 'border-slate-500'
                    }`}>
                      {g.completed && <CheckCircle2 className="h-4.5 w-4.5 text-black stroke-[3px]" />}
                    </div>
                    <span className={`text-sm ${g.completed ? 'line-through text-slate-500' : ''}`}>
                      {g.goal_text}
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                    +15 XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Predictive Analytics & Badges */}
        <div className="space-y-6">
          {/* Semester Success Predictor */}
          <div className="glass-panel p-5 rounded-2xl border border-neonCyan/20">
            <h2 className="text-lg font-bold text-white mb-1">Semester Success Predictor</h2>
            <p className="text-xs text-slate-400 mb-4">Readiness score calculated by internal marks, streaks, and quiz accuracy.</p>

            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative h-32 w-32 flex items-center justify-center border-4 border-dashed border-slate-800 rounded-full">
                <div className="absolute inset-2 bg-gradient-to-tr from-purple-900/40 to-cyan-900/40 rounded-full flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white">{readinessScore}%</span>
                  <span className="text-[10px] font-bold text-neonCyan tracking-wide">READINESS</span>
                </div>
                {/* Visual Glow ring */}
                <div className="absolute inset-0 rounded-full border-4 border-neonCyan border-t-transparent border-r-transparent animate-spin duration-10000"></div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-white">Status: Exam Prepared</p>
                <p className="text-xs text-slate-400 mt-1">Excellent progress. Recommended action: Revise weak subjects.</p>
              </div>
            </div>
          </div>

          {/* Weak areas list */}
          <div className="glass-panel p-5 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-neonPink" /> Weakness Predictor
            </h2>
            <p className="text-xs text-slate-400 mb-4">AI detected concept gaps needing revision before exams.</p>

            <div className="space-y-3">
              {weaknesses.map((w, index) => (
                <div key={index} className="p-3 bg-white/2 border border-glassBorder rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{w.concept_name}</h4>
                    <span className="text-[10px] text-slate-400">{w.subject} Syllabus</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    w.severity === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    {w.severity} Risk
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gamification Badges */}
          <div className="glass-panel p-5 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Award className="h-5 w-5 text-neonPurple" /> Badges Earned
            </h2>
            <p className="text-xs text-slate-400 mb-4">Milestones achieved on your learning journey.</p>
            
            <div className="flex flex-wrap gap-2.5">
              {parsedBadges.map((badge, idx) => (
                <span 
                  key={idx} 
                  className="flex items-center gap-1 text-xs bg-purple-950/20 border border-purple-500/20 text-purple-300 px-3 py-1.5 rounded-full font-medium"
                >
                  <Sparkles className="h-3.5 w-3.5 text-neonPurple" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;
