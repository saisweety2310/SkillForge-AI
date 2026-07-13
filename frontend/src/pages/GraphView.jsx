import React, { useState } from 'react';
import { Network, Sparkles, BookOpen, Link, ArrowRight, BrainCircuit } from 'lucide-react';

function GraphView() {
  const [selectedNode, setSelectedNode] = useState({
    id: "dbms",
    label: "DBMS",
    desc: "Database Management System: software designed to store, retrieve, define, and manage data.",
    linking: "Connects to operating systems file systems and disk allocation blocks.",
    category: "Root Core",
    resources: ["DBMS Basics Tutorial", "Intro to Relational Databases"],
    quizzes: "DBMS Fundamental Quiz"
  });

  const nodes = [
    // Layer 1 (Root)
    { id: "dbms", label: "DBMS", x: 250, y: 50, category: "Root Core", desc: "Database Management System: software designed to store, retrieve, define, and manage data.", linking: "Connects to Operating Systems (file storage, disk structures).", resources: ["DBMS Basics Video", "Course Lecture Notes 1"], quizzes: "Unit 1 Trivia" },
    
    // Layer 2
    { id: "er", label: "ER Diagram", x: 90, y: 150, category: "Design Model", desc: "Entity-Relationship model representing logical database structure diagrammatically.", linking: "Connects to Software Engineering UML design mapping.", resources: ["ER Modelling Guide", "Cardinality Tutorial"], quizzes: "ER Design Lab" },
    { id: "sql", label: "SQL Queries", x: 250, y: 150, category: "Language Syntax", desc: "Structured Query Language: queries used to manage relational database schemas.", linking: "Connects to Discrete Mathematics (Set Theory & Predicate Calculus).", resources: ["SQL SELECT Cheatsheet", "SQL Joins Visualizer"], quizzes: "SQL Queries Exam Prep" },
    { id: "norm", label: "Normalization", x: 410, y: 150, category: "Schema Design", desc: "Process of structuring tables to eliminate data redundancy and anomalies.", linking: "Connects to Abstract Algebra (Functional Dependencies).", resources: ["1NF, 2NF, 3NF Walkthrough", "Normalization Rules"], quizzes: "Schema Normalization Test" },
    
    // Layer 3 (ER Children)
    { id: "entity", label: "Entity", x: 40, y: 250, category: "Design Model", desc: "A real-world object distinguishable from other objects (e.g. Student, Course).", linking: "Maps to Object-Oriented Classes in programming languages.", resources: ["Entity Sets Briefing"], quizzes: "Attributes & Entities Quiz" },
    { id: "attr", label: "Attribute", x: 90, y: 280, category: "Design Model", desc: "Properties or traits of an entity (e.g., student ID, age).", linking: "Maps directly to fields or instance variables in programming.", resources: ["Key attributes guide"], quizzes: "Attributes Quiz" },
    { id: "rel", label: "Relationship", x: 140, y: 250, category: "Design Model", desc: "Associations between entities, defined by cardinality (1:1, 1:N, M:N).", linking: "Connects to Graphs and Networks theory.", resources: ["Cardinality Constraints doc"], quizzes: "Relationship Battles" },
    
    // Layer 3 (SQL Children)
    { id: "select", label: "SELECT", x: 200, y: 250, category: "Language Syntax", desc: "Syntax mapping to Relational Projection and Selection filters.", linking: "Connects to linear searches and data filtering filters.", resources: ["SQL Filters guide"], quizzes: "Basic Selection Quiz" },
    { id: "join", label: "JOIN", x: 250, y: 280, category: "Language Syntax", desc: "Combines columns from one or more tables based on a shared attribute.", linking: "Connects to Hash Joins & Cartesian joins in compiler optimization.", resources: ["Visual JOIN guide"], quizzes: "Joins & Unions Practice" },
    { id: "group", label: "GROUP BY", x: 300, y: 250, category: "Language Syntax", desc: "Aggregates matching rows based on shared values (e.g. SUM, COUNT).", linking: "Connects to MapReduce logic in big data processing pipelines.", resources: ["SQL Aggregates Video"], quizzes: "Grouping Exam Prep" },

    // Layer 3 (Norm Children)
    { id: "1nf", label: "1NF", x: 360, y: 250, category: "Schema Design", desc: "First Normal Form: Requires atomic values (no nested tables or multi-values).", linking: "Connects to standard array and vector flattening procedures.", resources: ["Atomicity & 1NF guide"], quizzes: "First Normal Form Test" },
    { id: "2nf", label: "2NF", x: 410, y: 280, category: "Schema Design", desc: "Second Normal Form: 1NF + no partial functional dependencies on candidate keys.", linking: "Connects to Key-Value partitioning databases.", resources: ["Candidate Keys review"], quizzes: "Partial Dependencies Quiz" },
    { id: "3nf", label: "3NF", x: 460, y: 250, category: "Schema Design", desc: "Third Normal Form: 2NF + no transitive functional dependencies.", linking: "Connects to transitive reductions in Directed Acyclic Graphs (DAGs).", resources: ["Transitive Dependency video"], quizzes: "Advanced Schema Normalization" }
  ];

  const connections = [
    { from: "dbms", to: "er" },
    { from: "dbms", to: "sql" },
    { from: "dbms", to: "norm" },
    { from: "er", to: "entity" },
    { from: "er", to: "attr" },
    { from: "er", to: "rel" },
    { from: "sql", to: "select" },
    { from: "sql", to: "join" },
    { from: "sql", to: "group" },
    { from: "norm", to: "1nf" },
    { from: "norm", to: "2nf" },
    { from: "norm", to: "3nf" }
  ];

  const findNode = (id) => nodes.find(n => n.id === id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Network className="h-7 w-7 text-neonPurple drop-shadow-neon" /> Interactive Knowledge Graph
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Explore concept dependencies. Clicking nodes reveals definitions, resources, and cross-subject connections.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graph Canvas Panel (8 Cols) */}
        <div className="lg:col-span-8 glass-panel p-4 rounded-2xl flex justify-center items-center overflow-hidden min-h-[450px]">
          <svg viewBox="0 0 500 340" className="w-full h-auto select-none">
            {/* Draw Connection Lines */}
            {connections.map((conn, idx) => {
              const start = findNode(conn.from);
              const end = findNode(conn.to);
              if (!start || !end) return null;
              
              const isHighlighted = selectedNode.id === start.id || selectedNode.id === end.id;
              
              return (
                <line
                  key={idx}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={isHighlighted ? "#a855f7" : "#334155"}
                  strokeWidth={isHighlighted ? 1.5 : 0.8}
                  strokeDasharray={isHighlighted ? "none" : "2,2"}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNode.id === node.id;
              
              return (
                <g 
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer"
                >
                  {/* Glowing Outline for Selected */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={16}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      className="animate-ping duration-1500 opacity-30"
                    />
                  )}
                  {/* Inner Node circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 10 : 8}
                    fill={isSelected ? "#a855f7" : "#1e1b4b"}
                    stroke={isSelected ? "#ec4899" : "#a855f7"}
                    strokeWidth={1.5}
                    className="transition-all duration-300 hover:fill-purple-500"
                  />
                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y + (isSelected ? 22 : 18)}
                    textAnchor="middle"
                    fill={isSelected ? "#fff" : "#94a3b8"}
                    fontSize={isSelected ? 9 : 8}
                    fontWeight={isSelected ? "bold" : "normal"}
                    className="transition-all duration-300"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Metadata & Connected Nodes Detail (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-2xl flex-1 border border-purple-500/20">
            <span className="text-[9px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              {selectedNode.category}
            </span>
            <h2 className="text-xl font-bold text-white mt-1.5 mb-3">{selectedNode.label}</h2>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-neonPurple" /> Conceptual Mapping
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {selectedNode.desc}
                </p>
              </div>

              {/* Cross-Subject Concept Linking */}
              <div className="p-3 bg-purple-950/20 border border-purple-500/15 rounded-xl">
                <h4 className="text-[10px] text-neonPink font-bold uppercase tracking-wider flex items-center gap-1">
                  <Link className="h-3.5 w-3.5 text-neonPink" /> Cross-Subject Link
                </h4>
                <p className="text-[11px] text-purple-200 mt-1 leading-relaxed">
                  {selectedNode.linking}
                </p>
              </div>

              {/* Resources list */}
              <div>
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Connected Syllabi Resources</h4>
                <div className="space-y-1.5">
                  {selectedNode.resources.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer bg-white/2 p-2 rounded-lg border border-glassBorder">
                      <ArrowRight className="h-3 w-3 text-neonCyan" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Quiz Target */}
              <div className="pt-2 border-t border-glassBorder">
                <div className="flex justify-between items-center bg-cyan-950/10 border border-cyan-500/15 p-2.5 rounded-lg text-xs text-cyan-400">
                  <div className="flex items-center gap-1.5">
                    <BrainCircuit className="h-4.5 w-4.5" />
                    <span>Practice Quiz available</span>
                  </div>
                  <span className="text-[10px] font-bold underline cursor-pointer hover:text-white">Start</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default GraphView;
