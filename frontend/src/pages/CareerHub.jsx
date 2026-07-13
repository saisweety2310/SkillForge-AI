import React, { useState } from 'react';
import { Briefcase, Lightbulb, Compass, Code, ArrowRight, CheckCircle } from 'lucide-react';

function CareerHub() {
  const [projectTopic, setProjectTopic] = useState('Relational Databases');
  const [projectRoadmap, setProjectRoadmap] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const careers = [
    {
      role: "Database Administrator (DBA)",
      desc: "Manages, secures, and optimizes database environments. Ensures backup restoration and query speeds.",
      match: "85%",
      skills: ["SQL Optimization", "Relational Normalization", "Index Structuring", "Transaction Logs"],
      completed: 3
    },
    {
      role: "Backend Software Engineer",
      desc: "Integrates server logic, builds custom APIs, models application database schemas and caching networks.",
      match: "70%",
      skills: ["ORM Frameworks", "API Design", "ER Diagram Mapping", "Schema Migrations"],
      completed: 2
    },
    {
      role: "Systems Architect",
      desc: "Designs high-level technical layouts. Chooses between SQL/NoSQL systems based on transactional needs.",
      match: "60%",
      skills: ["Distributed Systems", "Database Partitioning", "ACID guarantees", "Storage Engine selection"],
      completed: 2
    }
  ];

  const handleGenerateRoadmap = (e) => {
    e.preventDefault();
    if (!projectTopic.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      setProjectRoadmap({
        title: `E-Commerce Database Schema & API Orchestrator`,
        description: `Design a fully normalized (3NF) relational database for an e-commerce platform supporting product inventories, shopping carts, transactions, and order logs.`,
        steps: [
          { name: "Step 1: ER Diagram & Relationships", details: "Map out Entity relationship cardinality constraints between User, Order, Product, and Cart items." },
          { name: "Step 2: Normalization & DDL scripts", details: "Write SQL DDL schemas decomposing arrays into atomic attributes. Implement foreign keys." },
          { name: "Step 3: Indexing & Performance", details: "Add B-Tree indexes on search identifiers (Product Name, User Email) to avoid full table scans." },
          { name: "Step 4: API Backend Mocking", details: "Build basic REST endpoints in Python (FastAPI/Flask) to query orders, verifying transaction ACID safeguards." }
        ]
      });
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Briefcase className="h-7 w-7 text-neonPurple drop-shadow-neon" /> Career Skill Mapping & AI Project Helper
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Bridge the gap between syllabus theory and careers. Discover role matches and generate project roadmaps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Career Skill Mapping (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-1.5">
            <Compass className="h-5 w-5 text-neonCyan" /> Career Skill Mapping
          </h3>
          
          <div className="space-y-4">
            {careers.map((career) => (
              <div key={career.role} className="glass-panel p-5 rounded-2xl border border-glassBorder hover:border-purple-500/20 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{career.role}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{career.desc}</p>
                  </div>
                  <span className="text-xs bg-cyan-950/20 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold text-cyan-400">
                    {career.match} Match
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-glassBorder/10">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Key Skills Needed</span>
                  <div className="flex flex-wrap gap-1.5">
                    {career.skills.map((skill, index) => {
                      const isLearned = index < career.completed;
                      return (
                        <span 
                          key={skill}
                          className={`text-[9px] px-2 py-1 rounded font-medium flex items-center gap-1 ${
                            isLearned 
                              ? 'bg-purple-950/25 border border-purple-500/25 text-purple-300' 
                              : 'bg-slate-900 border border-glassBorder text-slate-500'
                          }`}
                        >
                          {isLearned && <CheckCircle className="h-3 w-3 text-neonPurple" />}
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Project Helper (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-1.5">
            <Lightbulb className="h-5 w-5 text-neonPurple" /> AI Project Assistant
          </h3>

          <div className="glass-panel p-5 rounded-2xl border border-purple-500/10">
            <h4 className="text-xs font-bold text-white mb-2">Generate project ideas based on completed subjects</h4>
            <form onSubmit={handleGenerateRoadmap} className="flex gap-2">
              <input 
                type="text" 
                value={projectTopic}
                onChange={(e) => setProjectTopic(e.target.value)}
                placeholder="Enter completed topic (e.g. Relational Databases)"
                className="flex-1 px-3 py-2 text-xs glass-input"
                required
              />
              <button 
                type="submit" 
                disabled={isGenerating}
                className="px-4 py-2 bg-neonPurple hover:bg-purple-500 text-xs font-semibold rounded-lg text-white transition-all disabled:opacity-50"
              >
                {isGenerating ? "Mapping DDLs..." : "Generate Guide"}
              </button>
            </form>

            {projectRoadmap && (
              <div className="mt-6 pt-5 border-t border-glassBorder space-y-4">
                <div>
                  <span className="text-[9px] bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Recommended Project Spec
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2">{projectRoadmap.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {projectRoadmap.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Development Roadmap</span>
                  {projectRoadmap.steps.map((step, idx) => (
                    <div key={idx} className="p-3 bg-white/2 border border-glassBorder rounded-xl flex gap-3">
                      <div className="h-5 w-5 shrink-0 rounded bg-slate-800 flex items-center justify-center text-[10px] text-neonCyan font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{step.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{step.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default CareerHub;
