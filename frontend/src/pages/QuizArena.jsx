import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, Sparkles, Send, HelpCircle, 
  Award, Play, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import { API_BASE } from '../App';

function QuizArena({ twin, fetchTwin }) {
  const [documents, setDocuments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  
  // Quiz Generator State
  const [selectedDocId, setSelectedDocId] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState('medium');
  const [quizQuestionsCount, setQuizQuestionsCount] = useState(5);
  const [quizTitle, setQuizTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Quiz Playing State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [submittedScore, setSubmittedScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debate State
  const [debates, setDebates] = useState([]);
  const [activeDebate, setActiveDebate] = useState(null);
  const [debateTopic, setDebateTopic] = useState('');
  const [isStartingDebate, setIsStartingDebate] = useState(false);
  const [debateInput, setDebateInput] = useState('');
  const [isDebateSending, setIsDebateSending] = useState(false);

  const debateEndRef = useRef(null);

  const loadArenaData = async () => {
    try {
      const docRes = await fetch(`${API_BASE}/documents`);
      if (docRes.ok) {
        const dData = await docRes.json();
        setDocuments(dData);
        if (dData.length > 0) setSelectedDocId(dData[0].id);
      }
      
      const qRes = await fetch(`${API_BASE}/quiz`);
      if (qRes.ok) {
        setQuizzes(await qRes.json());
      }

      const dRes = await fetch(`${API_BASE}/debate`);
      if (dRes.ok) {
        const dData = await dRes.json();
        setDebates(dData);
        if (dData.length > 0 && !activeDebate) {
          loadDebateDetail(dData[0].id);
        }
      }
    } catch (e) {
      // Mock Fallbacks
      const mockQuizzes = [
        {
          id: 1,
          title: "Introduction to RDBMS quiz",
          total_questions: 3,
          questions: JSON.stringify([
            {
              question: "Which NF eliminates Transitive Functional Dependency?",
              options: ["1NF", "2NF", "3NF", "BCNF"],
              answer: "3NF",
              type: "mcq",
              explanation: "3NF states that no non-prime attribute should transitionally depend on candidate keys."
            },
            {
              question: "A relation in BCNF is always in 3NF.",
              options: ["True", "False"],
              answer: "True",
              type: "true_false",
              explanation: "BCNF is a stricter form of 3NF, therefore all relations in BCNF satisfy 3NF rules."
            },
            {
              question: "SQL SELECT statements filter rows using which keyword?",
              options: [],
              answer: "WHERE",
              type: "blank",
              explanation: "The WHERE clause is used to filter records that meet specific query conditions."
            }
          ]),
          score: 3
        }
      ];
      setQuizzes(mockQuizzes);

      const mockDebates = [
        {
          id: 1,
          topic: "Relational SQL is superior to NoSQL document databases",
          history: JSON.stringify([
            { sender: 'ai', text: "Welcome to the AI Debate Arena. Defend why you believe relational SQL is superior to NoSQL. I will play Devil's advocate." }
          ])
        }
      ];
      setDebates(mockDebates);
      setActiveDebate(mockDebates[0]);
    }
  };

  useEffect(() => {
    loadArenaData();
  }, []);

  useEffect(() => {
    debateEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeDebate?.history]);

  // Quiz Handling
  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!selectedDocId || !quizTitle.trim() || isGenerating) return;

    setIsGenerating(true);
    const formData = new FormData();
    formData.append("title", quizTitle);
    formData.append("document_id", selectedDocId);
    formData.append("num_questions", quizQuestionsCount.toString());
    formData.append("difficulty", quizDifficulty);

    try {
      const res = await fetch(`${API_BASE}/quiz/generate`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const newQuiz = await res.json();
        setQuizzes(prev => [newQuiz, ...prev]);
        playQuiz(newQuiz);
        setQuizTitle('');
      } else {
        alert("Failed to generate quiz. Verify Gemini API details.");
      }
    } catch (err) {
      alert("Error generating quiz. Mocking locally...");
      const mockQuiz = {
        id: Date.now(),
        title: quizTitle,
        total_questions: quizQuestionsCount,
        questions: JSON.stringify([
          { question: "What is atomic data?", options: ["Un-decomposable values", "Multiple structures", "Null elements", "Array collections"], answer: "Un-decomposable values", type: "mcq", explanation: "Atomicity specifies that columns shouldn't contain nested multiple fields." }
        ]),
        score: null
      };
      setQuizzes(prev => [mockQuiz, ...prev]);
      playQuiz(mockQuiz);
      setQuizTitle('');
    } finally {
      setIsGenerating(false);
    }
  };

  const playQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setIsQuizSubmitted(false);
    setSubmittedScore(0);
  };

  const submitQuizAnswers = async () => {
    if (!activeQuiz || isSubmitting) return;

    setIsSubmitting(true);
    const qList = JSON.parse(activeQuiz.questions || "[]");
    
    // Calculate Score
    let score = 0;
    const reviewList = []; // details of concepts, correct, misconception
    
    qList.forEach((q, idx) => {
      const userAns = selectedAnswers[idx] || '';
      const isCorrect = userAns.trim().toLowerCase() === q.answer.trim().toLowerCase();
      if (isCorrect) score += 1;
      
      // Determine conceptual weakness
      reviewList.push({
        concept: q.question.substring(0, 30), // use partial Q text as concept name if unavailable
        is_correct: isCorrect,
        misconception: isCorrect ? null : `Answered: "${userAns}" instead of "${q.answer}". ${q.explanation}`
      });
    });

    try {
      const formData = new FormData();
      formData.append("score", score.toString());
      formData.append("review_results", JSON.stringify(reviewList));

      const res = await fetch(`${API_BASE}/quiz/${activeQuiz.id}/submit`, {
        method: "POST",
        body: formData
      });
      
      if (res.ok) {
        setIsQuizSubmitted(true);
        setSubmittedScore(score);
        fetchTwin(); // update stats
        setQuizzes(prev => prev.map(q => q.id === activeQuiz.id ? { ...q, score: score } : q));
      }
    } catch (e) {
      // Local demo submission
      setIsQuizSubmitted(true);
      setSubmittedScore(score);
      twin.xp += score * 20;
      fetchTwin();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debate Handling
  const handleStartDebate = async (e) => {
    e.preventDefault();
    if (!debateTopic.trim() || isStartingDebate) return;

    setIsStartingDebate(true);
    const formData = new FormData();
    formData.append("topic", debateTopic);

    try {
      const res = await fetch(`${API_BASE}/debate/create`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const newDebate = await res.json();
        setDebates(prev => [newDebate, ...prev]);
        setActiveDebate(newDebate);
        setDebateTopic('');
      } else {
        alert("Failed to start debate.");
      }
    } catch (e) {
      const mockD = {
        id: Date.now(),
        topic: debateTopic,
        history: JSON.stringify([
          { sender: 'ai', text: `Let's debate: "${debateTopic}". Play devil's advocate: defend your assumptions.` }
        ])
      };
      setDebates(prev => [mockD, ...prev]);
      setActiveDebate(mockD);
      setDebateTopic('');
    } finally {
      setIsStartingDebate(false);
    }
  };

  const loadDebateDetail = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/debate/${id}`);
      if (res.ok) {
        setActiveDebate(await res.json());
      }
    } catch (e) {}
  };

  const handleSendDebateMessage = async (e) => {
    e.preventDefault();
    if (!debateInput.trim() || !activeDebate || isDebateSending) return;

    const userVal = debateInput;
    setDebateInput('');
    setIsDebateSending(true);

    // Append locally immediately
    const currentHist = JSON.parse(activeDebate.history || "[]");
    const updatedHist = [...currentHist, { sender: 'user', text: userVal }];
    setActiveDebate(prev => ({ ...prev, history: JSON.stringify(updatedHist) }));

    try {
      const formData = new FormData();
      formData.append("user_message", userVal);
      const res = await fetch(`${API_BASE}/debate/${activeDebate.id}/message`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setActiveDebate(prev => ({ ...prev, history: JSON.stringify(data.history) }));
        fetchTwin(); // Reward XP
      }
    } catch (err) {
      setTimeout(() => {
        const newHist = [...updatedHist, { sender: 'ai', text: "[Demo Mode] I challenge your assertion. What about scalability and transaction guarantees? Relational models offer ACID properties that horizontal NoSQL nodes struggle with." }];
        setActiveDebate(prev => ({ ...prev, history: JSON.stringify(newHist) }));
      }, 1000);
    } finally {
      setIsDebateSending(false);
    }
  };

  const parsedQuestions = activeQuiz ? JSON.parse(activeQuiz.questions || "[]") : [];
  const parsedDebateHistory = activeDebate ? JSON.parse(activeDebate.history || "[]") : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[82vh] overflow-hidden">
      
      {/* Column 1: Quizzes Arena (6 Cols) */}
      <div className="lg:col-span-6 glass-panel rounded-xl flex flex-col overflow-hidden h-full">
        {activeQuiz ? (
          /* Active Quiz Player */
          <div className="p-5 flex flex-col h-full overflow-y-auto">
            <div className="flex justify-between items-center border-b border-glassBorder pb-3 mb-4">
              <div>
                <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-bold uppercase">
                  Active Adaptive Quiz
                </span>
                <h3 className="text-sm font-extrabold text-white mt-1">{activeQuiz.title}</h3>
              </div>
              <button 
                onClick={() => setActiveQuiz(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Quit Quiz
              </button>
            </div>

            {/* Quiz Progress */}
            {!isQuizSubmitted && (
              <div className="w-full bg-slate-800 h-1 rounded-full mb-6 overflow-hidden">
                <div 
                  className="h-full bg-neonCyan transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / activeQuiz.total_questions) * 100}%` }}
                ></div>
              </div>
            )}

            {/* Questions Player */}
            {parsedQuestions.length > 0 && currentQuestionIdx < parsedQuestions.length && (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    Question {currentQuestionIdx + 1} of {activeQuiz.total_questions}
                  </span>
                  <h4 className="text-sm font-semibold text-white mt-2 mb-6">
                    {parsedQuestions[currentQuestionIdx].question}
                  </h4>

                  {/* Options rendering */}
                  {parsedQuestions[currentQuestionIdx].options.length > 0 ? (
                    <div className="space-y-3 mb-6">
                      {parsedQuestions[currentQuestionIdx].options.map((opt) => {
                        const isSelected = selectedAnswers[currentQuestionIdx] === opt;
                        return (
                          <div 
                            key={opt}
                            onClick={() => !isQuizSubmitted && setSelectedAnswers(prev => ({ ...prev, [currentQuestionIdx]: opt }))}
                            className={`p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                              isSelected 
                                ? 'bg-purple-950/20 border-purple-500/50 text-white' 
                                : 'bg-white/3 border-glassBorder text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Free Text Input (blanks, coding, numerical) */
                    <input 
                      type="text" 
                      placeholder="Type your answer here..."
                      value={selectedAnswers[currentQuestionIdx] || ''}
                      onChange={(e) => !isQuizSubmitted && setSelectedAnswers(prev => ({ ...prev, [currentQuestionIdx]: e.target.value }))}
                      className="w-full p-3 mb-6 glass-input text-xs"
                      disabled={isQuizSubmitted}
                    />
                  )}

                  {/* Show explanation if submitted */}
                  {isQuizSubmitted && (
                    <div className="p-4 bg-slate-900 border border-glassBorder rounded-xl text-xs space-y-2">
                      <div className="flex items-center gap-2">
                        {selectedAnswers[currentQuestionIdx]?.trim().toLowerCase() === parsedQuestions[currentQuestionIdx].answer.trim().toLowerCase() ? (
                          <span className="flex items-center gap-1 text-green-400 font-bold"><CheckCircle2 className="h-4 w-4" /> Correct</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 font-bold"><XCircle className="h-4 w-4" /> Incorrect</span>
                        )}
                        <span className="text-slate-500">Correct Answer: {parsedQuestions[currentQuestionIdx].answer}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {parsedQuestions[currentQuestionIdx].explanation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-8 pt-4 border-t border-glassBorder flex justify-between">
                  <button 
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                    className="px-4 py-2 border border-glassBorder rounded-lg text-xs hover:bg-white/5 disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {currentQuestionIdx < parsedQuestions.length - 1 ? (
                    <button 
                      onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                      className="px-4 py-2 bg-slate-800 rounded-lg text-xs hover:bg-slate-700"
                    >
                      Next Question
                    </button>
                  ) : (
                    !isQuizSubmitted ? (
                      <button 
                        onClick={submitQuizAnswers}
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-neonCyan text-black font-bold rounded-lg text-xs hover:bg-cyan-500 flex items-center gap-2"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Quiz"}
                      </button>
                    ) : (
                      <div className="text-right">
                        <div className="text-xs font-bold text-white">Quiz Score: {submittedScore}/{activeQuiz.total_questions}</div>
                        <button 
                          onClick={() => setActiveQuiz(null)}
                          className="text-[10px] text-neonCyan underline mt-1 block"
                        >
                          Back to Hub
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Quiz Hub Layout */
          <div className="p-5 flex flex-col h-full overflow-hidden">
            {/* Creator Form */}
            <div className="border-b border-glassBorder pb-4 mb-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-neonCyan" /> Generate Adaptive Quiz
              </h3>
              <form onSubmit={handleGenerateQuiz} className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="Quiz Folder Title (e.g. Unit 3 Quiz)" 
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="col-span-2 px-3 py-2 text-xs glass-input"
                  required
                />
                <div>
                  <select 
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full px-2 py-2 text-xs glass-input"
                    required
                  >
                    <option value="">Select Syllabus Source</option>
                    {documents.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select 
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value)}
                    className="w-full px-2 py-2 text-xs glass-input"
                  >
                    <option value="easy">Easy (Concept definitions)</option>
                    <option value="medium">Medium (Applications)</option>
                    <option value="hard">Hard (Compilers & proofs)</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  disabled={isGenerating || documents.length === 0}
                  className="col-span-2 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-semibold rounded-lg text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Deploy Smart Quiz Arena (+30 XP)"}
                </button>
              </form>
            </div>

            {/* List of quizzes */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <h3 className="text-xs font-bold text-slate-400 mb-2">Quiz Volumes</h3>
              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {quizzes.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No quizzes created yet.</p>
                ) : (
                  quizzes.map((q) => (
                    <div key={q.id} className="p-3 bg-white/2 border border-glassBorder rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">{q.title}</h4>
                        <span className="text-[9px] text-slate-500">{q.total_questions} Questions</span>
                      </div>
                      {q.score !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-green-400">Score: {q.score}/{q.total_questions}</span>
                          <button 
                            onClick={() => playQuiz(q)}
                            className="px-2 py-1 bg-slate-800 text-[10px] text-slate-400 rounded hover:text-white"
                          >
                            Review
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => playQuiz(q)}
                          className="px-3 py-1 bg-neonCyan text-black text-[10px] font-bold rounded-lg hover:bg-cyan-500"
                        >
                          Start
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Column 2: AI Debate Partner (6 Cols) */}
      <div className="lg:col-span-6 glass-panel rounded-xl flex flex-col overflow-hidden h-full border border-purple-500/10">
        {/* Debate Header */}
        <div className="p-3.5 border-b border-glassBorder bg-purple-950/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neonPurple" />
            <div>
              <h3 className="text-xs font-bold text-white">AI Debate Partner</h3>
              <span className="text-[9px] text-purple-300 font-semibold uppercase tracking-wider">Play Devil's Advocate</span>
            </div>
          </div>
          <select 
            onChange={(e) => loadDebateDetail(parseInt(e.target.value))}
            className="px-2.5 py-1 text-[10px] glass-input bg-darkBg"
          >
            <option value="">Active Debates</option>
            {debates.map(d => (
              <option key={d.id} value={d.id}>{d.topic.substring(0, 30)}...</option>
            ))}
          </select>
        </div>

        {activeDebate ? (
          /* Active Debate Chat */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 bg-purple-950/15 border-b border-glassBorder text-[10px] text-purple-200">
              <strong>Topic:</strong> {activeDebate.topic}
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {parsedDebateHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-white/5 border border-glassBorder text-slate-200 rounded-tl-none border-purple-500/15'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isDebateSending && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-glassBorder text-slate-400 rounded-2xl rounded-tl-none px-3 py-2 text-xs flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-neonPurple" /> 
                    AI partner challenging assumptions...
                  </div>
                </div>
              )}
              <div ref={debateEndRef} />
            </div>

            <form onSubmit={handleSendDebateMessage} className="p-3 border-t border-glassBorder flex gap-2">
              <input 
                type="text" 
                placeholder="Defend your thesis..."
                value={debateInput}
                onChange={(e) => setDebateInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs glass-input"
                disabled={isDebateSending}
              />
              <button 
                type="submit" 
                className="p-2 bg-neonPurple hover:bg-purple-500 text-white rounded-lg transition-all disabled:opacity-50"
                disabled={!debateInput.trim() || isDebateSending}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          /* Debate Lobby */
          <div className="flex-1 p-6 flex flex-col justify-center items-center text-center">
            <h3 className="text-sm font-bold text-white mb-2">Create Debate Arena</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-sm">
              Type a thesis or subject concept. The AI will counter your arguments, helping you build core reasoning and clear up misconceptions.
            </p>
            
            <form onSubmit={handleStartDebate} className="w-full max-w-sm space-y-3">
              <input 
                type="text" 
                placeholder="e.g. Relational schemas are safer than document models" 
                value={debateTopic}
                onChange={(e) => setDebateTopic(e.target.value)}
                className="w-full px-3 py-2 text-xs glass-input"
                required
              />
              <button 
                type="submit" 
                disabled={isStartingDebate}
                className="w-full py-2 bg-neonPurple hover:bg-purple-500 text-xs font-semibold rounded-lg text-white transition-all disabled:opacity-50"
              >
                {isStartingDebate ? "Starting session..." : "Start Debate Partner (+15 XP)"}
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}

export default QuizArena;
