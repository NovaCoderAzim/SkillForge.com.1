import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, Code, ChevronRight, X, Sparkles, Check, Trash2, Edit 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CodeArena = () => {
  const [showModal, setShowModal] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // --- CHALLENGE SETTINGS (Global) ---
  const [challengeTitle, setChallengeTitle] = useState("");
  const [passKey, setPassKey] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);

  // --- CURRENT PROBLEM STATE ---
  const [probTitle, setProbTitle] = useState("");
  const [probDesc, setProbDesc] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [testCases, setTestCases] = useState([{ input: "", output: "", hidden: false }]);
  const [aiLoading, setAiLoading] = useState(false);

  // --- PROBLEM LIST (Shopping Cart) ---
  const [addedProblems, setAddedProblems] = useState<any[]>([]);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/v1/code-tests", { headers: { Authorization: `Bearer ${token}` } });
      setTests(res.data);
    } catch (err) { console.error(err); }
  };

  // Γ£¿ AI GENERATION FUNCTION
  const handleAIGenerate = async () => {
    if (!probTitle) return alert("Please enter a problem title first!");
    setAiLoading(true);
    try {
        const token = localStorage.getItem("token");
        const res = await axios.post("http://127.0.0.1:8000/api/v1/ai/generate", { title: probTitle }, { headers: { Authorization: `Bearer ${token}` } });
        
        setProbDesc(res.data.description);
        setTestCases(JSON.parse(res.data.test_cases));
    } catch (err) {
        console.error(err);
        alert("AI Generation failed.");
    } finally {
        setAiLoading(false);
    }
  };

  // --- PROBLEM MANAGEMENT ---
  const handleAddTestCase = () => setTestCases([...testCases, { input: "", output: "", hidden: false }]);
  
  const handleTestCaseChange = (index: number, field: string, value: any) => {
    const newCases = [...testCases];
    // @ts-ignore
    newCases[index][field] = value;
    setTestCases(newCases);
  };

  const handleRemoveTestCase = (index: number) => setTestCases(testCases.filter((_, i) => i !== index));

  const addProblemToChallenge = () => {
    if(!probTitle || !probDesc) return alert("Please fill problem details");
    
    const newProblem = {
        title: probTitle,
        description: probDesc,
        difficulty,
        test_cases: JSON.stringify(testCases) // Store as String for Backend
    };

    setAddedProblems([...addedProblems, newProblem]);
    
    // Reset Problem Form
    setProbTitle(""); setProbDesc(""); setTestCases([{ input: "", output: "", hidden: false }]);
  };

  const removeProblem = (idx: number) => {
    setAddedProblems(addedProblems.filter((_, i) => i !== idx));
  };

  // --- FINAL SAVE ---
  const handleSaveChallenge = async () => {
    if(addedProblems.length === 0) return alert("Please add at least one problem!");
    setLoading(true);
    try {
        const token = localStorage.getItem("token");
        const payload = {
            title: challengeTitle,
            pass_key: passKey,
            time_limit: timeLimit,
            problems: addedProblems // Send the list of problems
        };
        await axios.post("http://127.0.0.1:8000/api/v1/code-tests", payload, { headers: { Authorization: `Bearer ${token}` } });
        setShowModal(false);
        fetchTests();
        alert("Challenge Created Successfully!");
        // Reset All
        setChallengeTitle(""); setPassKey(""); setAddedProblems([]);
    } catch (err) {
        console.error(err);
        alert("Failed to create challenge");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
        <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-extrabold text-slate-800">Code Arena</h1><p className="text-slate-500">Create and manage coding challenges.</p></div>
            <button onClick={() => setShowModal(true)} className="bg-[#005EB8] hover:bg-[#004a94] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200"><Plus size={20} /> Create Challenge</button>
        </div>

        {/* Challenge List */}
        <div className="grid grid-cols-1 gap-4">
            {tests.length === 0 ? (
                <div className="bg-slate-50 p-12 rounded-2xl text-center border-2 border-dashed border-slate-200 text-slate-400">
                    <Code size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No challenges created yet.</p>
                </div>
            ) : (
                tests.map((test) => (
                    <div key={test.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#005EB8]"><Code size={28} /></div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{test.title}</h3>
                                <div className="flex gap-4 text-sm text-slate-500 mt-1 font-medium">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full"></span> {test.time_limit} mins</span>
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono text-slate-600 border border-slate-200">Key: {test.pass_key}</span>
                                </div>
                            </div>
                        </div>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-[#005EB8]"><ChevronRight /></button>
                    </div>
                ))
            )}
        </div>

        {/* CREATE MODAL */}
        <AnimatePresence>
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col">
                        
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Define New Challenge</h2>
                                <p className="text-xs text-slate-500 mt-1">Configure test details and add coding problems.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="bg-slate-50 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            {/* 1. Challenge Settings */}
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-4">Challenge Settings</h3>
                                <div className="grid grid-cols-3 gap-5">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Title</label>
                                        <input type="text" value={challengeTitle} onChange={(e) => setChallengeTitle(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-700" placeholder="e.g. Mid-Term Coding Exam" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Pass Key</label>
                                        <input type="text" value={passKey} onChange={(e) => setPassKey(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-slate-600" placeholder="Secret123" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Time Limit (Mins)</label>
                                        <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value))} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-8">
                                {/* 2. Add Problem Form (Left Side) */}
                                <div className="flex-1 space-y-5">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Add Problem ({addedProblems.length} added)</h3>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Problem Title</label>
                                        <input type="text" value={probTitle} onChange={(e) => setProbTitle(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Fibonacci Series" />
                                    </div>

                                    {/* AI Magic Section */}
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                            <textarea value={probDesc} onChange={(e) => setProbDesc(e.target.value)} rows={4} className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed" placeholder="Detailed problem statement..." />
                                        </div>
                                        <button 
                                            onClick={handleAIGenerate} 
                                            disabled={aiLoading}
                                            className="mt-7 w-[120px] h-[110px] bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
                                        >
                                            {aiLoading ? <span className="animate-spin text-2xl">ΓÜí</span> : <Sparkles size={28} />}
                                            <span className="text-[10px] uppercase tracking-wider">{aiLoading ? "Thinking..." : "AI Auto-Fill"}</span>
                                        </button>
                                    </div>

                                    {/* Test Cases */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Test Cases</label>
                                            <button onClick={handleAddTestCase} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors">+ Add Case</button>
                                        </div>
                                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                            {testCases.map((tc, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <span className="text-[10px] font-bold text-slate-400 w-4">#{idx+1}</span>
                                                    <input type="text" placeholder="Input" value={tc.input} onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)} className="flex-1 p-2 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none" />
                                                    <input type="text" placeholder="Output" value={tc.output} onChange={(e) => handleTestCaseChange(idx, 'output', e.target.value)} className="flex-1 p-2 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none" />
                                                    <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1.5 rounded border border-slate-200 hover:border-slate-300">
                                                        <input type="checkbox" checked={tc.hidden} onChange={(e) => handleTestCaseChange(idx, 'hidden', e.target.checked)} className="accent-blue-600" />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Hide</span>
                                                    </label>
                                                    {testCases.length > 1 && (
                                                        <button onClick={() => handleRemoveTestCase(idx)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button onClick={addProblemToChallenge} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                                        <Plus size={18} /> Add Problem to Challenge
                                    </button>
                                </div>

                                {/* 3. Problem List Review (Right Side) */}
                                <div className="w-[300px] border-l border-slate-100 pl-8">
                                    <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-4">Added Problems</h3>
                                    <div className="space-y-3">
                                        {addedProblems.length === 0 ? (
                                            <div className="text-sm text-slate-400 italic text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                No problems added yet.
                                            </div>
                                        ) : (
                                            addedProblems.map((p, i) => (
                                                <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm group">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{p.title}</h4>
                                                        <button onClick={() => removeProblem(i)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                                                    <div className="mt-2 flex gap-2">
                                                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{(JSON.parse(p.test_cases)).length} Cases</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl">
                            <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                            <button onClick={handleSaveChallenge} disabled={loading} className="px-8 py-3 bg-[#87C232] text-white rounded-xl font-bold hover:bg-[#76a82b] flex items-center gap-2 shadow-lg shadow-green-100 transition-all active:scale-95 disabled:opacity-70">
                                {loading ? "Saving..." : <><Check size={18} /> Save Complete Challenge</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default CodeArena;
