import React, { useState, useEffect } from 'react';
import { 
  CalendarRange, Calendar, Clock, Sparkles, 
  RefreshCw, CheckCircle, BrainCircuit, ArrowRight, Loader2
} from 'lucide-react';
import { API_BASE } from '../App';

function Planner({ twin, fetchTwin }) {
  const [planners, setPlanners] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [spacedRepItems, setSpacedRepItems] = useState([]);
  
  // Form State
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(1.5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Spaced Repetition modal active item
  const [activeReviewItem, setActiveReviewItem] = useState(null);

  const fetchPlannerData = async () => {
    try {
      const planRes = await fetch(`${API_BASE}/planner`);
      if (planRes.ok) {
        const pData = await planRes.json();
        setPlanners(pData);
        if (pData.length > 0 && !selectedPlan) setSelectedPlan(pData[0]);
      }
      
      const repRes = await fetch(`${API_BASE}/spaced-repetition`);
      if (repRes.ok) {
        const rData = await repRes.json();
        setSpacedRepItems(rData);
      }
    } catch (e) {
      // Mock Fallbacks
      const mockPlanners = [
        {
          id: 1,
          subject: "Database Management Systems",
          exam_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          daily_hours: 2,
          schedule: JSON.stringify({
            summary: "Core DBMS syllabus review in 7 days focusing on Normalization, SQL query optimization, and transaction logs.",
            calendar: [
              { day: "Day 1", topic: "ER Diagrams & Logical Schemas", tasks: ["Review entity cardinality rules", "Draw 3 sample ER maps"], duration: 2 },
              { day: "Day 2", topic: "SQL JOIN Queries", tasks: ["Practice Natural & Outer joins", "Write subqueries"], duration: 2 },
              { day: "Day 3", topic: "Normalization 1NF & 2NF", tasks: ["Identify partial dependencies", "Decompose table structures"], duration: 2 },
              { day: "Day 4", topic: "3NF & BCNF", tasks: ["Analyze transitive dependencies", "Solve textbook exercises"], duration: 2 },
              { day: "Day 5", topic: "Indexing & Hashing", tasks: ["Compare B-Trees vs Hash indexes"], duration: 2 }
            ]
          }),
          created_at: new Date().toISOString()
        }
      ];
      setPlanners(mockPlanners);
      setSelectedPlan(mockPlanners[0]);

      const mockRepItems = [
        { id: 1, concept_name: "3NF Normalization", subject: "DBMS", interval: 3, ease_factor: 2.5, repetitions: 2, next_review: new Date().toISOString() },
        { id: 2, concept_name: "SQL JOIN Queries", subject: "DBMS", interval: 6, ease_factor: 2.6, repetitions: 3, next_review: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
        { id: 3, concept_name: "Entity Relationship Mapping", subject: "DBMS", interval: 1, ease_factor: 2.3, repetitions: 1, next_review: new Date().toISOString() }
      ];
      setSpacedRepItems(mockRepItems);
    }
  };

  useEffect(() => {
    fetchPlannerData();
  }, []);

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    if (!subject || !examDate || isGenerating) return;

    setIsGenerating(true);
    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("exam_date", examDate);
    formData.append("daily_hours", dailyHours.toString());

    try {
      const res = await fetch(`${API_BASE}/planner/generate`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const newPlan = await res.json();
        setPlanners(prev => [newPlan, ...prev]);
        setSelectedPlan(newPlan);
        setSubject('');
        setExamDate('');
      } else {
        alert("Failed to generate plan. Validate Gemini API Key.");
      }
    } catch (err) {
      alert("Error generating plan. Mocking locally...");
      const mockNewPlan = {
        id: Date.now(),
        subject: subject,
        exam_date: examDate,
        daily_hours: dailyHours,
        schedule: JSON.stringify({
          summary: `Study preparation calendar generated for ${subject}.`,
          calendar: [
            { day: "Day 1", topic: "Intro & Terminology", tasks: ["Read glossary", "Take initial test"], duration: dailyHours },
            { day: "Day 2", topic: "Core Principles", tasks: ["Summarize Chapter 1-3", "Review math proofs"], duration: dailyHours },
            { day: "Day 3", topic: "Active Review & Quizzes", tasks: ["Attempt practice exam", "Refining notes"], duration: dailyHours }
          ]
        }),
        created_at: new Date().toISOString()
      };
      setPlanners(prev => [mockNewPlan, ...prev]);
      setSelectedPlan(mockNewPlan);
      setSubject('');
      setExamDate('');
    } finally {
      setIsGenerating(false);
    }
  };

  const submitRepReview = async (quality) => {
    if (!activeReviewItem) return;
    
    try {
      const res = await fetch(`${API_BASE}/spaced-repetition/${activeReviewItem.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality: quality })
      });
      
      if (res.ok) {
        const updatedItem = await res.json();
        setSpacedRepItems(prev => prev.map(item => item.id === activeReviewItem.id ? updatedItem : item));
        fetchTwin(); // Reward XP
      } else {
        updateMockRepItem(activeReviewItem.id, quality);
      }
    } catch (e) {
      updateMockRepItem(activeReviewItem.id, quality);
    } finally {
      setActiveReviewItem(null);
    }
  };

  const updateMockRepItem = (id, quality) => {
    setSpacedRepItems(prev => prev.map(item => {
      if (item.id === id) {
        // Simple mock calculations for next interval
        const nextInt = quality >= 3 ? item.interval * 2 : 1;
        const nextDate = new Date(Date.now() + nextInt * 24 * 60 * 60 * 1000).toISOString();
        return {
          ...item,
          interval: nextInt,
          repetitions: quality >= 3 ? item.repetitions + 1 : 0,
          next_review: nextDate
        };
      }
      return item;
    }));
  };

  // Helper to check if review is due (due date in past or today)
  const isDue = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d <= now || d.toDateString() === now.toDateString();
  };

  const getParsedSchedule = () => {
    if (!selectedPlan) return null;
    try {
      return JSON.parse(selectedPlan.schedule);
    } catch (e) {
      return null;
    }
  };

  const parsedSchedule = getParsedSchedule();

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <CalendarRange className="h-7 w-7 text-neonPurple drop-shadow-neon" /> Smart Study Planner & Forgetting Curve
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Plan schedules, calculate study time commitments, and review spaced repetition flashcards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Planner Creator & Active Calendar (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Creator Form */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-3">Generate Exam Calendar</h3>
            <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Subject Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Operating Systems" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs glass-input"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Exam Target Date</label>
                <input 
                  type="date" 
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs glass-input"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Daily Commitment (Hrs)</label>
                <input 
                  type="number" 
                  min="0.5" 
                  max="12" 
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs glass-input"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isGenerating}
                className="w-full md:col-span-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold rounded-lg text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" /> Structuring daily review guides...
                  </>
                ) : "Create Adaptive Timetable"}
              </button>
            </form>
          </div>

          {/* Active Schedule Display */}
          {selectedPlan ? (
            <div className="glass-panel p-5 rounded-2xl border border-neonPurple/20">
              <div className="flex justify-between items-start mb-4 border-b border-glassBorder pb-3">
                <div>
                  <span className="text-[9px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded font-bold uppercase">
                    Active Syllabus Plan
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedPlan.subject} Study Plan</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Exam countdown:</span>
                  <div className="text-xs font-extrabold text-neonCyan">
                    {new Date(selectedPlan.exam_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {parsedSchedule && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-950/20 border border-purple-500/15 rounded-xl text-xs text-purple-200">
                    <strong>Strategy Summary:</strong> {parsedSchedule.summary}
                  </div>
                  
                  <div className="space-y-3">
                    {parsedSchedule.calendar.map((item, idx) => (
                      <div key={idx} className="p-3.5 bg-white/2 border border-glassBorder rounded-xl flex justify-between items-start gap-4">
                        <div className="flex gap-3">
                          <span className="text-xs font-extrabold bg-slate-800 text-slate-300 h-6 w-12 rounded flex items-center justify-center shrink-0">
                            {item.day}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-white">{item.topic}</h4>
                            <ul className="text-[10px] text-slate-400 mt-1 space-y-1 list-disc list-inside">
                              {item.tasks.map((t, i) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <span className="text-[10px] text-neonCyan font-bold shrink-0">{item.duration} hrs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-8 text-center text-slate-500 rounded-2xl">
              <Calendar className="h-10 w-10 mx-auto mb-2" />
              <p className="text-xs">No active study plans generated yet.</p>
            </div>
          )}
        </div>

        {/* Right Column: Spaced Repetition (Forgetting Curve Queue) (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full overflow-hidden">
          <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col overflow-hidden">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-neonCyan" /> Spaced Repetition (Forgetting Curve)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              AI predicts when you will forget concepts based on repetition. Grade your recall quality to reschedule.
            </p>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {spacedRepItems.map((item) => {
                const due = isDue(item.next_review);
                return (
                  <div 
                    key={item.id} 
                    className={`p-3.5 border rounded-xl flex items-center justify-between gap-4 transition-all ${
                      due 
                        ? 'bg-purple-950/20 border-purple-500/25' 
                        : 'bg-white/2 border-glassBorder'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.concept_name}</h4>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-semibold">
                          {item.subject}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          Reps: {item.repetitions} | Int: {item.interval}d
                        </span>
                      </div>
                    </div>

                    {due ? (
                      <button 
                        onClick={() => setActiveReviewItem(item)}
                        className="px-2.5 py-1 bg-neonCyan hover:bg-cyan-500 text-black text-[10px] font-bold rounded-lg transition-all"
                      >
                        Review Now
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-500 font-semibold uppercase italic">
                        Next: {new Date(item.next_review).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Spaced Repetition Review Pop-up Modal */}
      {activeReviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 border border-purple-500/30 shadow-neon">
            <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-bold uppercase">
              Spaced Repetition Review
            </span>
            <h3 className="text-lg font-bold text-white mt-1.5 mb-2">{activeReviewItem.concept_name}</h3>
            <p className="text-xs text-slate-400 mb-6">
              Recite or recall this concept in your head. Now, grade the quality of your memory:
            </p>

            <div className="grid grid-cols-6 gap-2 mb-6">
              {[
                { score: 0, text: 'Forgot', desc: 'No recall' },
                { score: 1, text: 'Bad', desc: 'Incorrect' },
                { score: 2, text: 'Slow', desc: 'Struggled' },
                { score: 3, text: 'Okay', desc: 'Correct' },
                { score: 4, text: 'Good', desc: 'Easy' },
                { score: 5, text: 'Perfect', desc: 'Instant' },
              ].map((q) => (
                <button
                  key={q.score}
                  onClick={() => submitRepReview(q.score)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg border border-glassBorder bg-white/2 hover:bg-purple-950/20 hover:border-purple-500/30 text-white transition-all"
                >
                  <span className="text-sm font-extrabold text-neonCyan">{q.score}</span>
                  <span className="text-[9px] font-bold mt-1 text-slate-300">{q.text}</span>
                  <span className="text-[7px] text-slate-500">{q.desc}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setActiveReviewItem(null)}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all"
            >
              Cancel Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Planner;
