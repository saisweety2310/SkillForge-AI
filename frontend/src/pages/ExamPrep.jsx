import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Sparkles, BookOpen, 
  HelpCircle, ChevronRight, CheckSquare, Loader2
} from 'lucide-react';
import { API_BASE } from '../App';

function ExamPrep({ twin, fetchTwin }) {
  const [documents, setDocuments] = useState([]);
  
  // Form State
  const [selectedDocId, setSelectedDocId] = useState('');
  const [university, setUniversity] = useState('Standard State University');
  const [subject, setSubject] = useState('');
  const [unit, setUnit] = useState(1);
  const [marks, setMarks] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMaterial, setGeneratedMaterial] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch(`${API_BASE}/documents`);
        if (res.ok) {
          const dData = await res.json();
          setDocuments(dData);
          if (dData.length > 0) {
            setSelectedDocId(dData[0].id);
            setSubject(dData[0].title);
          }
        }
      } catch (e) {
        console.log("Offline mode - using mock documents list.");
      }
    };
    fetchDocs();
  }, []);

  const handleGenerateExamPrep = async (e) => {
    e.preventDefault();
    if (!selectedDocId || isGenerating) return;

    setIsGenerating(true);
    const formData = new FormData();
    formData.append("document_id", selectedDocId);
    formData.append("university", university);
    formData.append("subject", subject);
    formData.append("unit", unit.toString());
    formData.append("marks", marks.toString());

    try {
      const res = await fetch(`${API_BASE}/exam/generate`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedMaterial(data.material);
        fetchTwin(); // update stats
      } else {
        alert("Failed to generate exam prep data.");
      }
    } catch (err) {
      alert("Error calling exam generator. Mocking material locally...");
      setGeneratedMaterial(`
# Mock Exam Prep: ${subject}
**University:** ${university} | **Unit:** ${unit} | **Target Marks:** ${marks} Marks

## Expected Exam Questions

### Question 1: Explain the components of an ER Schema and how they map to relational tables.
**Model Answer Structure:**
* **Introduction:** Entity Relationship mapping provides conceptual structure.
* **Core Components:** Entity Sets, Attributes (Primary, Composite, Derived), Relationships (Cardinality ratios 1:1, 1:N, N:M).
* **Mapping Rules:**
  1. Strong Entity maps to a standalone table.
  2. Multi-valued attributes decompose into separate child tables.
  3. M:N relationship becomes a junction table containing foreign key constraints.
* **Conclusion:** Relational mapping enforces schema integrity.

### Question 2: Compare 3NF and BCNF. Provide an example where a table is in 3NF but not in BCNF.
**Model Answer Structure:**
* **3NF Def:** Relational schema R is in 3NF if for every functional dependency X -> A, either X is a superkey or A is a prime attribute.
* **BCNF Def:** Relational schema R is in BCNF if for every functional dependency X -> A, X is a superkey.
* **Key Difference:** BCNF removes transitive dependencies involving prime attributes.

---

## Expected Viva (Oral Exam) Questions

1. **Q: Why do we decompose tables during normalization?**
   * *A:* To eliminate modification anomalies (Insert, Update, Delete) and reduce redundant storage bytes.
2. **Q: What is a candidate key?**
   * *A:* A minimal superkey. It uniquely identifies rows without containing redundant fields.
3. **Q: Can a table have multiple Foreign Keys?**
   * *A:* Yes. A table can hold as many foreign keys as required to model references to parent tables.
      `);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-neonCyan drop-shadow-neon" /> Exam Preparation Mode
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Generate university-specific mock questions, expectations, model answers, and expected Viva tests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Setup (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-cyan-500/10">
            <h3 className="text-base font-bold text-white mb-3">Configure Mock Paper</h3>
            <form onSubmit={handleGenerateExamPrep} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Reference Syllabus</label>
                <select 
                  value={selectedDocId}
                  onChange={(e) => {
                    setSelectedDocId(e.target.value);
                    const doc = documents.find(d => d.id === parseInt(e.target.value));
                    if (doc) setSubject(doc.title);
                  }}
                  className="w-full px-2.5 py-2 text-xs glass-input"
                  required
                >
                  {documents.length === 0 ? (
                    <option value="">No files uploaded</option>
                  ) : (
                    documents.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Target University</label>
                <input 
                  type="text" 
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs glass-input"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Subject Name</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs glass-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Syllabus Unit</label>
                  <select 
                    value={unit}
                    onChange={(e) => setUnit(parseInt(e.target.value))}
                    className="w-full px-2.5 py-2 text-xs glass-input"
                  >
                    {[1, 2, 3, 4, 5].map(u => (
                      <option key={u} value={u}>Unit {u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Question Weightage</label>
                  <select 
                    value={marks}
                    onChange={(e) => setMarks(parseInt(e.target.value))}
                    className="w-full px-2.5 py-2 text-xs glass-input"
                  >
                    <option value="2">2 Marks (Definitions)</option>
                    <option value="5">5 Marks (Short explainers)</option>
                    <option value="10">10 Marks (Detailed/Problems)</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isGenerating || documents.length === 0}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-xs font-semibold rounded-lg text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" /> Structuring model answers...
                  </>
                ) : "Assemble Expected Exam Kit"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Material Viewer (8 Cols) */}
        <div className="lg:col-span-8 glass-panel rounded-2xl flex flex-col overflow-hidden min-h-[400px]">
          {generatedMaterial ? (
            <div className="p-6 overflow-y-auto max-h-[70vh] text-xs text-slate-300 leading-relaxed space-y-4">
              {generatedMaterial.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-base font-extrabold text-white border-b border-glassBorder pb-2 pt-2">{line.replace('# ', '')}</h1>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-sm font-bold text-white pt-3 border-t border-glassBorder/10 mt-3">{line.replace('## ', '')}</h2>;
                } else if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-xs font-bold text-cyan-400 pt-2">{line.replace('### ', '')}</h3>;
                } else if (line.startsWith('- ') || line.startsWith('* ')) {
                  return <li key={i} className="ml-4 list-disc">{line.substring(2)}</li>;
                } else if (line.trim() === '') {
                  return <div key={i} className="h-2"></div>;
                } else {
                  return <p key={i}>{line}</p>;
                }
              })}
            </div>
          ) : (
            <div className="h-full flex-1 flex flex-col justify-center items-center p-6 text-center text-slate-500">
              <BookOpen className="h-12 w-12 mb-2" />
              <p className="text-xs">Select configurations on the sidebar to compile study sheets.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExamPrep;
