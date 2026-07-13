import React, { useState, useEffect } from 'react';
import { 
  FileText, BookOpen, Volume2, VolumeX, Sparkles, 
  HelpCircle, ChevronRight, Play, Square, Loader2
} from 'lucide-react';
import { API_BASE } from '../App';

function Notes({ twin, fetchTwin }) {
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  
  // Generator State
  const [selectedDocId, setSelectedDocId] = useState('');
  const [noteStyle, setNoteStyle] = useState('detailed');
  const [noteTitle, setNoteTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Audio State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechUtterance, setSpeechUtterance] = useState(null);

  const fetchNotesAndDocs = async () => {
    try {
      const docsRes = await fetch(`${API_BASE}/documents`);
      if (docsRes.ok) {
        const dData = await docsRes.json();
        setDocuments(dData);
        if (dData.length > 0) setSelectedDocId(dData[0].id);
      }
      
      const notesRes = await fetch(`${API_BASE}/notes`);
      if (notesRes.ok) {
        const nData = await notesRes.json();
        setNotes(nData);
        if (nData.length > 0 && !selectedNote) setSelectedNote(nData[0]);
      }
    } catch (e) {
      // Mock Fallbacks
      const mockNotes = [
        {
          id: 1,
          title: "Quick Revision: Relational Algebra",
          style: "quick",
          content: "# Relational Algebra Cheat Sheet\n\nRelational algebra is a procedural query language containing a set of operations that take one or two relations as input and produce a new relation as output.\n\n## Fundamental Operations\n- **Select (σ)**: Filters rows based on a condition. Example: `σ_salary > 50000 (Employee)`\n- **Project (π)**: Selects specific columns. Example: `π_name, email (Employee)`\n- **Union (∪)**: Combines rows from two relation schemas (must be union-compatible).\n- **Set Difference (-)**: Returns rows in relation A but not in B.\n- **Cartesian Product (×)**: Combines tuples from two relations into all possible combinations.\n- **Rename (ρ)**: Renames a relation or columns.\n\n## Joins\n- **Natural Join (⋈)**: Combines tuples with matching values on common attributes.",
          created_at: new Date().toISOString()
        }
      ];
      setNotes(mockNotes);
      setSelectedNote(mockNotes[0]);
    }
  };

  useEffect(() => {
    fetchNotesAndDocs();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedDocId || !noteTitle.trim() || isGenerating) return;

    setIsGenerating(true);
    const formData = new FormData();
    formData.append("title", noteTitle);
    formData.append("style", noteStyle);
    formData.append("document_id", selectedDocId);

    try {
      const res = await fetch(`${API_BASE}/notes/generate`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes(prev => [newNote, ...prev]);
        setSelectedNote(newNote);
        setNoteTitle('');
        fetchTwin(); // Reward XP
      } else {
        alert("Failed to generate notes. Make sure Gemini key is active.");
      }
    } catch (err) {
      alert("Error generating notes. Mocking generation...");
      const mockNewNote = {
        id: Date.now(),
        title: noteTitle,
        style: noteStyle,
        content: `# ${noteTitle}\n\nThis is a mock note generated for demo mode.\n\nStyle: ${noteStyle}\n\n* Database management concepts are structured logically.\n* Primary Keys guarantee uniqueness.\n* Foreign Keys maintain referential integrity.`,
        created_at: new Date().toISOString()
      };
      setNotes(prev => [mockNewNote, ...prev]);
      setSelectedNote(mockNewNote);
      setNoteTitle('');
    } finally {
      setIsGenerating(false);
    }
  };

  // Voice Learning (Text to Speech)
  const speakNotes = () => {
    if (!selectedNote) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    // Clean markdown headings/symbols for cleaner voice synthesis
    const cleanText = selectedNote.content
      .replace(/[#*`_-]/g, '')
      .substring(0, 1200); // Limit speech length for testing

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    
    setSpeechUtterance(utterance);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const stylesMeta = {
    quick: "1-Page Revision Summary",
    detailed: "Complete In-depth explanation",
    bullet: "Bullet exam keynotes",
    story: "Analogies & story-based explanation",
    beginner: "Beginner simplified mode",
    advanced: "Deep tech, advanced concepts"
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[82vh] overflow-hidden">
      
      {/* Sidebar: Generator Form & List of Saved Notes (4 Cols) */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-y-auto pr-1">
        
        {/* Note Builder */}
        <div className="glass-panel p-4 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-neonPurple" /> Forge Study Notes
          </h3>
          <form onSubmit={handleGenerate} className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Reference Syllabus</label>
              <select 
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
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
              <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Note Style</label>
              <select 
                value={noteStyle}
                onChange={(e) => setNoteStyle(e.target.value)}
                className="w-full px-2.5 py-2 text-xs glass-input"
              >
                <option value="detailed">Detailed Chapter Explanation</option>
                <option value="quick">Quick Revision Cheat Sheet</option>
                <option value="bullet">Exam Revision Bullet Points</option>
                <option value="story">Story Mode (Relatable Examples)</option>
                <option value="beginner">Beginner Mode (Simple Terms)</option>
                <option value="advanced">Advanced Mode (Technical Depth)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Notes Folder Name</label>
              <input 
                type="text" 
                placeholder="e.g. Relational Algebra Notes" 
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full px-2.5 py-2 text-xs glass-input"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isGenerating || documents.length === 0}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold rounded-lg text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" /> Structuring mindmaps...
                </>
              ) : "Synthesize AI Notes (+30 XP)"}
            </button>
          </form>
        </div>

        {/* Saved Notes list */}
        <div className="glass-panel p-4 rounded-xl flex-1 flex flex-col min-h-[250px] overflow-hidden">
          <h3 className="text-sm font-bold text-white mb-3">Saved Study Volumes</h3>
          <div className="space-y-2 overflow-y-auto flex-1">
            {notes.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No notes generated yet.</p>
            ) : (
              notes.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => setSelectedNote(n)}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    selectedNote?.id === n.id 
                      ? 'bg-purple-950/20 border-purple-500/40 text-white' 
                      : 'bg-white/2 border-glassBorder text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className={`h-5 w-5 shrink-0 ${selectedNote?.id === n.id ? 'text-neonPurple' : 'text-slate-500'}`} />
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold truncate text-white">{n.title}</div>
                      <div className="text-[9px] text-slate-500 truncate">{stylesMeta[n.style] || n.style}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Main Content Pane: Notes Viewer with Audio Controls (8 Cols) */}
      <div className="lg:col-span-8 glass-panel rounded-xl flex flex-col overflow-hidden h-full">
        {selectedNote ? (
          <>
            {/* Viewer Header with Audio controls */}
            <div className="p-4 border-b border-glassBorder flex justify-between items-center bg-white/2">
              <div>
                <span className="text-[9px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-bold uppercase">
                  {selectedNote.style} style
                </span>
                <h2 className="text-base font-extrabold text-white mt-1">{selectedNote.title}</h2>
              </div>
              
              {/* Voice controls */}
              <button 
                onClick={speakNotes}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isPlayingAudio 
                    ? 'bg-red-500/25 border border-red-500/35 text-red-400' 
                    : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-red-400" /> Stop Listening
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" /> Listen to Notes
                  </>
                )}
              </button>
            </div>

            {/* Document Viewer Markdown-rendered */}
            <div className="flex-1 p-6 overflow-y-auto prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed space-y-4">
              {/* Custom parser for markdown headings to make it look beautiful */}
              {selectedNote.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-lg font-bold text-white border-b border-glassBorder pb-2 pt-2">{line.replace('# ', '')}</h1>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-sm font-bold text-white pt-2">{line.replace('## ', '')}</h2>;
                } else if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-xs font-bold text-purple-300 pt-1">{line.replace('### ', '')}</h3>;
                } else if (line.startsWith('- ') || line.startsWith('* ')) {
                  return <li key={i} className="ml-4 list-disc">{line.substring(2)}</li>;
                } else if (line.trim() === '') {
                  return <div key={i} className="h-2"></div>;
                } else {
                  return <p key={i}>{line}</p>;
                }
              })}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col justify-center items-center p-6 text-center text-slate-500">
            <BookOpen className="h-12 w-12 mb-2" />
            <p className="text-xs">Forge notes on the sidebar to build your personal learning library.</p>
          </div>
        )}
      </div>

    </div>
  );
}

export default Notes;
