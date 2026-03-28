import { useState, useEffect } from "react";
import axios from "axios";
import {
    Plus, Code, ChevronRight, ChevronDown, X, Sparkles, Check, Trash2, AlertCircle, CheckCircle, Download, Edit2, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CodeArena = () => {
    const [showModal, setShowModal] = useState(false);
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Management states
    const [expandedTestId, setExpandedTestId] = useState<number | null>(null);
    const [testResults, setTestResults] = useState<any[]>([]);
    const [editingTestId, setEditingTestId] = useState<number | null>(null);

    // Toast System
    const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

    const triggerToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type }), 2500);
    };

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

    const loadTestResults = async (testId: number) => {
        if (expandedTestId === testId) {
            setExpandedTestId(null);
            return;
        }
        const token = localStorage.getItem("token");
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/v1/code-tests/${testId}/results`, { headers: { Authorization: `Bearer ${token}` } });
            setTestResults(res.data);
            setExpandedTestId(testId);
        } catch (err) { triggerToast("Failed to load results", "error"); }
    };

    const handleExport = async (testId: number, title: string) => {
        const token = localStorage.getItem("token");
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/v1/code-tests/${testId}/export`, { 
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob' 
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title.replace(/\\s+/g, "_")}_results.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            triggerToast("Exported Successfully", "success");
        } catch (err) { triggerToast("Export failed", "error"); }
    };

    const handleDelete = async (testId: number) => {
        if (!confirm("Are you sure you want to delete this test?")) return;
        const token = localStorage.getItem("token");
        try {
            await axios.delete(`http://127.0.0.1:8000/api/v1/code-tests/${testId}`, { headers: { Authorization: `Bearer ${token}` } });
            triggerToast("Test deleted successfully", "success");
            fetchTests();
        } catch (err) { triggerToast("Failed to delete", "error"); }
    };

    const handleEdit = (test: any) => {
        setEditingTestId(test.id);
        setChallengeTitle(test.title);
        setPassKey(test.pass_key);
        setTimeLimit(test.time_limit);
        // Safely format problems for the cart: ensure test_cases is always a string
        const formattedProblems = (test.problems || []).map((p: any) => ({
            ...p,
            test_cases: typeof p.test_cases === 'string' ? p.test_cases : JSON.stringify(p.test_cases)
        }));
        setAddedProblems(formattedProblems);
        setShowModal(true);
    };

    // Γ£¿ AI GENERATION FUNCTION
    const handleAIGenerate = async () => {
        if (!probTitle) return triggerToast("Please enter a problem title first!", "error");
        setAiLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post("http://127.0.0.1:8000/api/v1/ai/generate", { title: probTitle }, { headers: { Authorization: `Bearer ${token}` } });

            setProbDesc(res.data.description);
            setTestCases(JSON.parse(res.data.test_cases));
            triggerToast("AI Data generated successfully", "success");
        } catch (err) {
            console.error(err);
            triggerToast("AI Generation failed.", "error");
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
        if (!probTitle || !probDesc) return triggerToast("Please fill problem details", "error");

        const newProblem = {
            title: probTitle,
            description: probDesc,
            difficulty,
            test_cases: JSON.stringify(testCases) // Store as String for Backend
        };

        setAddedProblems([...addedProblems, newProblem]);

        // Reset Problem Form
        setProbTitle(""); setProbDesc(""); setTestCases([{ input: "", output: "", hidden: false }]);
        triggerToast("Problem appended to cart", "success");
    };

    const removeProblem = (idx: number) => {
        setAddedProblems(addedProblems.filter((_, i) => i !== idx));
    };

    // --- FINAL SAVE ---
    const handleSaveChallenge = async () => {
        if (addedProblems.length === 0) return triggerToast("Please add at least one problem!", "error");
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const payload = {
                title: challengeTitle,
                pass_key: passKey,
                time_limit: timeLimit,
                problems: addedProblems // Send the list of problems
            };
            if (editingTestId) {
                await axios.put(`http://127.0.0.1:8000/api/v1/code-tests/${editingTestId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
                triggerToast("Challenge Updated Successfully!", "success");
            } else {
                await axios.post("http://127.0.0.1:8000/api/v1/code-tests", payload, { headers: { Authorization: `Bearer ${token}` } });
                triggerToast("Challenge Created Successfully!", "success");
            }
            setShowModal(false);
            fetchTests();
            
            // Reset All
            setEditingTestId(null); setChallengeTitle(""); setPassKey(""); setAddedProblems([]);
        } catch (err) {
            console.error(err);
            triggerToast("Failed to save challenge", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-white via-gray-50 to-gray-200">
            <div className="max-w-[1400px] w-full mx-auto px-6 py-12 flex flex-col gap-6 font-sans">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        {/* USER REQUEST: "Code Arena Architect" completely BLACK */}
                        <h1 className="text-4xl font-extrabold text-black tracking-tight drop-shadow-sm">Code Arena Architect</h1>
                        <p className="text-gray-600 font-bold mt-2">Create and manage coding challenges.</p>
                    </div>
                    <button onClick={() => { setEditingTestId(null); setChallengeTitle(""); setPassKey(""); setAddedProblems([]); setShowModal(true); }} className="bg-black hover:bg-gray-800 text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-gray-200"><Plus size={20} /> Create Challenge</button>
                </div>

                {/* Challenge List */}
                <div className="grid grid-cols-1 gap-5">
                    {tests.length === 0 ? (
                        <div className="bg-white/80 backdrop-blur-md p-16 rounded-3xl text-center border border-gray-200 shadow-sm text-gray-500">
                            <Code size={56} className="mx-auto mb-5 text-gray-300" />
                            <p className="font-extrabold text-xl text-black">No challenges created yet.</p>
                        </div>
                    ) : (
                        tests.map((test) => (
                            <div key={test.id} className="bg-white/90 backdrop-blur rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300">
                                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl border border-gray-300 flex items-center justify-center text-black shadow-sm"><Code size={32} /></div>
                                        <div>
                                            <h3 className="font-extrabold text-black text-xl mb-1">{test.title}</h3>
                                            <div className="flex gap-4 text-sm text-gray-600 mt-2 font-bold tracking-wide">
                                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"></span> {test.time_limit} mins</span>
                                                <span className="bg-gray-100 px-3 py-1 rounded-md text-xs font-mono text-black border border-gray-300 shadow-inner">Key: {test.pass_key}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => loadTestResults(test.id)} className="px-4 py-2 font-bold text-sm bg-gray-100 text-black hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors">
                                            <Users size={16} /> Results {expandedTestId === test.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                        <button onClick={() => handleEdit(test)} className="p-2 bg-white border border-gray-200 text-black hover:bg-black hover:text-white rounded-lg shadow-sm transition-colors" title="Edit Test">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleExport(test.id, test.title)} className="p-2 bg-white border border-gray-200 text-black hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-lg shadow-sm transition-colors" title="Export CSV">
                                            <Download size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(test.id)} className="p-2 bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white rounded-lg shadow-sm transition-colors" title="Delete Test">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                {expandedTestId === test.id && (
                                    <div className="border-t border-gray-100 bg-gray-50 p-6">
                                        <h4 className="font-bold text-black mb-4 uppercase tracking-widest text-xs">Student Completions</h4>
                                        {testResults.length === 0 ? (
                                            <p className="text-sm font-medium text-gray-500">No students have taken this test yet.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left font-medium text-gray-700">
                                                    <thead>
                                                        <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">
                                                            <th className="pb-3">Student Name</th>
                                                            <th className="pb-3">Score</th>
                                                            <th className="pb-3">Solved</th>
                                                            <th className="pb-3">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {testResults.map((r, i) => (
                                                            <tr key={i}>
                                                                <td className="py-3 font-bold text-black">{r.student_name}</td>
                                                                <td className="py-3">{r.score}%</td>
                                                                <td className="py-3">{r.problems_solved}</td>
                                                                <td className="py-3">
                                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${r.status === 'terminated' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                                                        {r.status || "Completed"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* CREATE MODAL */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 bg-white/40 z-[500] flex items-center justify-center backdrop-blur-md p-4">
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col">

                                {/* Header */}
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                    <div>
                                        <h2 className="text-xl font-bold text-black tracking-tight">Arena Studio</h2>
                                        <p className="text-xs font-medium text-gray-500 mt-1">Configure test details and add coding problems.</p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="bg-gray-50 border border-gray-200 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20} /></button>
                                </div>

                                <div className="p-8 space-y-8">
                                    {/* 1. Challenge Settings */}
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Challenge Settings</h3>
                                        <div className="grid grid-cols-3 gap-5">
                                            <div className="col-span-1">
                                                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Title</label>
                                                <input type="text" value={challengeTitle} onChange={(e) => setChallengeTitle(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-black transition-all font-bold text-black" placeholder="e.g. Mid-Term Coding Exam" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Pass Key</label>
                                                <input type="text" value={passKey} onChange={(e) => setPassKey(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-black transition-all font-mono font-bold text-gray-600" placeholder="Secret123" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Time Limit (Mins)</label>
                                                <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value))} className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-black transition-all font-bold text-black" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col lg:flex-row gap-8">
                                        {/* 2. Add Problem Form (Left Side) */}
                                        <div className="flex-1 space-y-5">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Add Problem ({addedProblems.length} added)</h3>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Algorithm Title</label>
                                                <input type="text" value={probTitle} onChange={(e) => setProbTitle(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-black font-bold text-black" placeholder="e.g. Fibonacci Series" />
                                            </div>

                                            {/* AI Magic Section */}
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Markdown Description</label>
                                                    <textarea value={probDesc} onChange={(e) => setProbDesc(e.target.value)} rows={4} className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-black font-medium text-black text-sm leading-relaxed" placeholder="Detailed problem statement..." />
                                                </div>
                                                <button
                                                    onClick={handleAIGenerate}
                                                    disabled={aiLoading}
                                                    className="mt-7 w-[130px] h-[110px] bg-black text-white rounded-xl font-bold flex flex-col items-center justify-center gap-2 hover:bg-gray-800 transition-all border border-black shadow-md"
                                                >
                                                    {aiLoading ? <span className="animate-spin text-2xl">ΓÜí</span> : <Sparkles size={24} />}
                                                    <span className="text-[10px] uppercase font-bold tracking-widest">{aiLoading ? "Thinking..." : "Auto-Fill with AI"}</span>
                                                </button>
                                            </div>

                                            {/* Test Cases */}
                                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                                <div className="flex justify-between items-center mb-4">
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">I/O Test Cases</label>
                                                    <button onClick={handleAddTestCase} className="text-[10px] font-bold text-gray-600 border border-gray-300 hover:bg-white px-2.5 py-1.5 rounded-lg transition-colors uppercase tracking-widest">+ Add Edge Case</button>
                                                </div>
                                                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {testCases.map((tc, idx) => (
                                                        <div key={idx} className="flex gap-3 items-center">
                                                            <span className="text-[10px] font-bold text-gray-400 w-4">#{idx + 1}</span>
                                                            <input type="text" placeholder="Stdin (Input)" value={tc.input} onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)} className="flex-1 p-2.5 text-xs font-mono font-bold text-black bg-white border border-gray-200 rounded-lg focus:border-black outline-none" />
                                                            <input type="text" placeholder="Stdout (Expected)" value={tc.output} onChange={(e) => handleTestCaseChange(idx, 'output', e.target.value)} className="flex-1 p-2.5 text-xs font-mono font-bold text-black bg-white border border-gray-200 rounded-lg focus:border-black outline-none" />
                                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2.5 rounded-lg border border-gray-200 hover:border-black transition-colors">
                                                                <input type="checkbox" checked={tc.hidden} onChange={(e) => handleTestCaseChange(idx, 'hidden', e.target.checked)} className="accent-black w-3.5 h-3.5" />
                                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hide</span>
                                                            </label>
                                                            {testCases.length > 1 && (
                                                                <button onClick={() => handleRemoveTestCase(idx)} className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors rounded-lg"><Trash2 size={16} /></button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <button onClick={addProblemToChallenge} className="w-full py-3.5 bg-white border-2 border-dashed border-gray-300 text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2 rounded-xl">
                                                Append to Challenge Cart &gt;
                                            </button>
                                        </div>

                                        {/* 3. Problem List Review (Right Side) */}
                                        <div className="w-full lg:w-[320px] lg:border-l border-gray-200 lg:pl-8 flex flex-col">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Constructed Payload</h3>
                                                <span className="ml-auto bg-gray-100 text-black px-2 py-0.5 rounded-md text-[10px] font-bold">{addedProblems.length} Items</span>
                                            </div>
                                            <div className="space-y-3 flex-1">
                                                {addedProblems.length === 0 ? (
                                                    <div className="text-[10px] font-bold uppercase tracking-widest leading-loose text-gray-400 text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                                        No algorithms attached.<br />Problems added from the constructor will stack here.
                                                    </div>
                                                ) : (
                                                    addedProblems.map((p, i) => (
                                                        <div key={i} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm group">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-bold text-black text-sm line-clamp-1 pr-2">{p.title}</h4>
                                                                <button onClick={() => removeProblem(i)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={16} /></button>
                                                            </div>
                                                            <p className="text-xs text-gray-500 font-medium line-clamp-2">{p.description}</p>
                                                            <div className="mt-3.5 pt-3 border-t border-gray-100 flex gap-2">
                                                                <span className="text-[10px] bg-gray-50 px-2 py-1 border border-gray-200 rounded text-gray-500 font-bold uppercase tracking-widest">{p.difficulty}</span>
                                                                <span className="text-[10px] bg-gray-50 px-2 py-1 border border-gray-200 rounded text-gray-500 font-bold uppercase tracking-widest font-mono">{(JSON.parse(p.test_cases)).length} Cases</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl">
                                    <button onClick={handleSaveChallenge} disabled={loading} className="px-8 py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-70 w-full sm:w-auto justify-center">
                                        {loading ? "Saving..." : <><Check size={16} /> Deploy Challenge Live</>}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* TOP-CENTER TOAST */}
                <AnimatePresence>
                    {toast.show && (
                        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none p-4 w-max">
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
                                exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3, ease: "easeInOut" } }}
                                className="bg-gray-900 border border-black px-6 py-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center gap-4 text-white pointer-events-auto"
                            >
                                <div className="flex items-center justify-center shrink-0">
                                    {toast.type === "success" ? <CheckCircle className="text-green-400" size={22} /> : <AlertCircle className="text-red-400" size={22} />}
                                </div>
                                <div className="pr-2">
                                    <h4 className="font-bold text-sm text-white mb-0.5 tracking-tight">
                                        {toast.type === "success" ? "System Notification" : "Action Required"}
                                    </h4>
                                    <p className="text-gray-300 font-medium text-xs leading-snug">{toast.msg}</p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CodeArena;