import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileText, Send, Loader2, BookOpen, 
  Trash2, BrainCircuit, BookMarked, Sparkles, FileBadge
} from 'lucide-react';
import { API_BASE } from '../App';

function Documents({ twin, fetchTwin }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('concepts'); // concepts, summary, cheatsheet
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // RAG Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
        if (data.length > 0 && !selectedDoc) {
          loadDocDetail(data[0].id);
        }
      }
    } catch (e) {
      // Mock Fallbacks
      const mockDocs = [
        { 
          id: 1, 
          title: "Introduction to DBMS", 
          filename: "dbms_basics.pdf", 
          upload_date: new Date().toISOString(),
          concepts: JSON.stringify([
            { concept: "ER Model", description: "Entity-Relationship model is a conceptual model of database systems.", formula: null, keywords: ["Entity", "Relationship", "Attribute"] },
            { concept: "Normalization", description: "The process of organizing data to reduce redundancy.", formula: "1NF / 2NF / 3NF Rules", keywords: ["Dependency", "Redundancy", "Decomposition"] },
            { concept: "SQL SELECT", description: "Syntax used to query tables.", formula: "SELECT column FROM table WHERE condition", keywords: ["SELECT", "FROM", "WHERE"] }
          ]),
          content: "Database Management Systems (DBMS) consist of software that manages databases. The ER Model maps out logical relationships. Normalization prevents update anomalies."
        }
      ];
      setDocuments(mockDocs);
      setSelectedDoc(mockDocs[0]);
    }
  };

  const loadDocDetail = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/documents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDoc(data);
        // Reset chat for new doc
        setChatMessages([
          { sender: 'ai', text: `Hi! I am your SkillForge Twin Tutor. I have fully indexed "${data.title}". Ask me any questions grounded specifically in this document.` }
        ]);
      }
    } catch (e) {
      console.log("Failed loading doc details");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !uploadTitle.strip) {
      if (!selectedFile || uploadTitle.trim() === '') return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("title", uploadTitle);
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setUploadTitle('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchDocuments();
        if (data.document_id) {
          loadDocDetail(data.document_id);
        }
        fetchTwin(); // Reward XP
      } else {
        alert("Upload failed. Verify key setup.");
      }
    } catch (err) {
      alert("Error uploading file. Backend offline? Mocking upload locally...");
      // Simulate locally
      const mockNew = {
        id: Date.now(),
        title: uploadTitle,
        filename: selectedFile.name,
        upload_date: new Date().toISOString(),
        concepts: JSON.stringify([
          { concept: "Imported Concept", description: "Extracted information from your document.", formula: null, keywords: ["Document", "AI"] }
        ]),
        content: "Content parsed from uploaded study material."
      };
      setDocuments(prev => [mockNew, ...prev]);
      setSelectedDoc(mockNew);
      setUploadTitle('');
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDoc = async (id) => {
    if (!window.confirm("Delete this document? This will remove indexed vector chunks.")) return;
    try {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        if (selectedDoc?.id === id) {
          setSelectedDoc(null);
        }
      }
    } catch (e) {
      setDocuments(prev => prev.filter(d => d.id !== id));
      setSelectedDoc(null);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatSending) return;

    const userMsg = inputMessage;
    setInputMessage('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsChatSending(true);

    try {
      const formData = new FormData();
      formData.append("question", userMsg);
      formData.append("document_id", selectedDoc?.id || '');
      formData.append("chat_history", JSON.stringify(chatMessages.slice(-6)));

      const res = await fetch(`${API_BASE}/tutor/chat`, {
        method: "POST",
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'ai', text: data.answer }]);
        fetchTwin(); // Adds study time metrics
      } else {
        setChatMessages(prev => [...prev, { sender: 'ai', text: "Error fetching response from the AI Tutor." }]);
      }
    } catch (e) {
      // Mock chat reply
      setTimeout(() => {
        setChatMessages(prev => [...prev, { 
          sender: 'ai', 
          text: `[Offline Demo Mode] You asked: "${userMsg}". Here is a simulated response grounded in your DBMS study materials. To connect live, make sure the API key is active and server is running.` 
        }]);
      }, 1000);
    } finally {
      setIsChatSending(false);
    }
  };

  const getParsedConcepts = () => {
    if (!selectedDoc) return [];
    try {
      return JSON.parse(selectedDoc.concepts);
    } catch (e) {
      return [];
    }
  };

  const concepts = getParsedConcepts();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[82vh] overflow-hidden">
      
      {/* Column 1: Document Hub List & Upload (4 Cols) */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-y-auto pr-1">
        
        {/* Upload Panel */}
        <div className="glass-panel p-4 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Upload className="h-4 w-4 text-neonPurple" /> Smart Upload (PDF, PPT, DOCX)
          </h3>
          <form onSubmit={handleUploadSubmit} className="space-y-3">
            <input 
              type="text" 
              placeholder="Module or Subject Title (e.g., DBMS Unit 1)" 
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs glass-input"
              required
            />
            <div className="border border-dashed border-slate-700 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500/30 transition-all" onClick={() => fileInputRef.current?.click()}>
              <FileText className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <span className="text-[10px] text-slate-400">
                {selectedFile ? selectedFile.name : "Select study materials (Max 15MB)"}
              </span>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="hidden"
                accept=".pdf,.docx,.pptx,.ppt,.txt"
              />
            </div>
            <button 
              type="submit" 
              disabled={isUploading}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 text-white transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" /> Ingesting & Embedding...
                </>
              ) : "Process Study Material (+50 XP)"}
            </button>
          </form>
        </div>

        {/* Document List */}
        <div className="glass-panel p-4 rounded-xl flex-1 flex flex-col min-h-[250px] overflow-hidden">
          <h3 className="text-sm font-bold text-white mb-3">Indexed Reference Syllabi</h3>
          <div className="space-y-2 overflow-y-auto flex-1">
            {documents.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No documents uploaded yet.</p>
            ) : (
              documents.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => loadDocDetail(doc.id)}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    selectedDoc?.id === doc.id 
                      ? 'bg-purple-950/20 border-purple-500/40 text-white' 
                      : 'bg-white/2 border-glassBorder text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className={`h-5 w-5 shrink-0 ${selectedDoc?.id === doc.id ? 'text-neonPurple' : 'text-slate-500'}`} />
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold truncate text-white">{doc.title}</div>
                      <div className="text-[9px] text-slate-500 truncate">{doc.filename}</div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                    className="p-1 text-slate-500 hover:text-red-400 rounded transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Column 2: Document Intelligence Tabs (4 Cols) */}
      <div className="lg:col-span-4 glass-panel rounded-xl flex flex-col overflow-hidden h-full">
        {selectedDoc ? (
          <>
            {/* Header Tabs */}
            <div className="flex border-b border-glassBorder text-xs font-medium">
              {[
                { id: 'concepts', label: 'Extracts', icon: BookOpen },
                { id: 'summary', label: 'Research Assist', icon: FileBadge },
                { id: 'cheatsheet', label: 'Cheat Sheet', icon: BookMarked }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab = setActiveSubTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 border-b-2 transition-all ${
                    activeSubTab === tab.id 
                      ? 'border-neonPurple text-white bg-purple-950/5' 
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Inner scroll container */}
            <div className="p-4 flex-1 overflow-y-auto">
              {activeSubTab === 'concepts' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-neonCyan uppercase tracking-wider">Extracted Core Concepts</h4>
                  {concepts.length === 0 ? (
                    <p className="text-xs text-slate-500">No concepts extracted.</p>
                  ) : (
                    concepts.map((c, i) => (
                      <div key={i} className="p-3 bg-white/2 border border-glassBorder rounded-lg space-y-1.5">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-white">{c.concept}</span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-semibold uppercase">Concept</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{c.description}</p>
                        {c.formula && (
                          <div className="p-2 bg-slate-950 rounded border border-glassBorder text-[10px] font-mono text-cyan-400">
                            {c.formula}
                          </div>
                        )}
                        {c.keywords && c.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {c.keywords.map((kw, idx) => (
                              <span key={idx} className="text-[9px] bg-purple-950/30 text-purple-300 px-1.5 py-0.5 rounded-full">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSubTab === 'summary' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neonPurple uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Paper Research Summary
                  </h4>
                  <div className="p-4 bg-purple-950/10 border border-purple-500/15 rounded-xl text-xs leading-relaxed text-slate-300 space-y-3">
                    <p className="font-semibold text-white">Target Summary Mode:</p>
                    <p>
                      This mode analyzes complex formulations, academic context, and structural claims inside your document. It simplifies academic syntax into structured briefs.
                    </p>
                    <div className="h-[1px] bg-glassBorder"></div>
                    <p className="font-semibold text-white">Core Document Context:</p>
                    <p className="italic">
                      "{selectedDoc.content.substring(0, 400)}..."
                    </p>
                    <div className="p-2.5 bg-slate-900 border border-glassBorder rounded text-[10px] text-slate-400">
                      <strong>AI Context mapping:</strong> Links key chapters to standard curricula, noting dependencies in databases, normalization models, and index files.
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'cheatsheet' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neonPink uppercase tracking-wider">Quick Formula Sheet</h4>
                  <div className="space-y-2">
                    {concepts.filter(c => c.formula).length === 0 ? (
                      <p className="text-xs text-slate-500">No explicit formulas or queries found in extracted definitions.</p>
                    ) : (
                      concepts.filter(c => c.formula).map((c, i) => (
                        <div key={i} className="p-3 bg-slate-950 border border-glassBorder rounded-lg">
                          <div className="text-xs font-bold text-white mb-1">{c.concept}</div>
                          <div className="font-mono text-xs text-pink-400 p-2 bg-black/40 rounded border border-pink-500/10">
                            {c.formula}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col justify-center items-center p-6 text-center text-slate-500">
            <BookOpen className="h-10 w-10 mb-2" />
            <p className="text-xs">Select or upload a document to view AI Intelligence.</p>
          </div>
        )}
      </div>

      {/* Column 3: RAG Chat Arena (4 Cols) */}
      <div className="lg:col-span-4 glass-panel rounded-xl flex flex-col overflow-hidden h-full">
        {selectedDoc ? (
          <>
            {/* Chat Header */}
            <div className="p-3.5 border-b border-glassBorder flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-neonCyan" />
              <div>
                <h3 className="text-xs font-bold text-white">Grounded AI Tutor Chat</h3>
                <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider">RAG Mode Activated</span>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-white/5 border border-glassBorder text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatSending && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-glassBorder text-slate-400 rounded-2xl rounded-tl-none px-3 py-2 text-xs flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-neonCyan" /> 
                    Querying local vector SQLite...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-glassBorder flex gap-2">
              <input 
                type="text" 
                placeholder={`Ask about: ${selectedDoc.title}`} 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 px-3 py-2 text-xs glass-input"
                disabled={isChatSending}
              />
              <button 
                type="submit" 
                className="p-2 rounded-lg bg-neonCyan hover:bg-cyan-500 text-black transition-all disabled:opacity-50"
                disabled={!inputMessage.trim() || isChatSending}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col justify-center items-center p-6 text-center text-slate-500">
            <BrainCircuit className="h-10 w-10 mb-2" />
            <p className="text-xs">Grounded Tutor activates once a syllabus document is selected.</p>
          </div>
        )}
      </div>

    </div>
  );
}

export default Documents;
