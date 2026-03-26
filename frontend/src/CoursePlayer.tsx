import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Editor from "@monaco-editor/react";
import Plyr from "plyr-react";
import "plyr/dist/plyr.css";
import { motion, AnimatePresence } from "framer-motion";
import { GlassToast } from "./components/GlassToast";

import {
  PlayCircle, FileText, ChevronLeft, Menu, Code, HelpCircle,
  UploadCloud, CheckCircle, ChevronDown, ChevronRight, Lock,
  Unlock, Award, Play, Save, Monitor, Cpu, ExternalLink, AlertCircle
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

// --- 💻 COMPONENT: PROFESSIONAL CODE ARENA ---
const CodeCompiler = ({ lesson }: { lesson: any }) => {
  const problems = useMemo(() => {
    try {
      if (!lesson.test_config) return [];
      let parsed = JSON.parse(lesson.test_config);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      return parsed.problems || [];
    } catch (e) {
      return [];
    }
  }, [lesson.test_config]);

  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const activeProblem = problems[activeProblemIndex] || { title: "No Problem Configured", description: "Instructor needs to update this test.", testCases: [] };

  const [code, setCode] = useState("# Write your solution here...\nprint('Hello SkillForge')");
  const [output, setOutput] = useState("Ready to execute...");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(71);

  const languages = [
    { id: 71, name: "Python", value: "python" },
    { id: 62, name: "Java", value: "java" },
    { id: 54, name: "C++", value: "cpp" },
    { id: 63, name: "JavaScript", value: "javascript" },
  ];

  const runCode = async () => {
    setLoading(true); setOutput("Compiling & Executing...");
    try {
      const res = await axios.post(`${API_BASE_URL}/execute`, {
        source_code: code, language_id: language,
        stdin: activeProblem.testCases?.[0]?.input || ""
      });
      if (res.data.stdout) setOutput(res.data.stdout);
      else if (res.data.stderr) setOutput(`Error:\n${res.data.stderr}`);
      else if (res.data.compile_output) setOutput(`Compile Error:\n${res.data.compile_output}`);
      else setOutput("Execution finished with no output.");
    } catch (err) { setOutput("❌ Execution Failed."); }
    finally { setLoading(false); }
  };

  if (!problems.length) return <div className="flex items-center justify-center h-full text-slate-400 font-bold">⚠️ No coding problems found.</div>;

  return (
    <div className="flex h-full gap-6 font-sans w-full max-w-[1600px] mx-auto p-4 md:p-8">
      {/* LEFT PANEL: Problems */}
      <div className="w-[35%] flex flex-col gap-4">
        <div className="flex-1 bg-white/80 backdrop-blur-2xl rounded-3xl border border-slate-200/60 p-8 overflow-y-auto shadow-sm">
          <div className="flex gap-2 mb-6 border-b border-slate-100 pb-4 overflow-x-auto">
            {problems.map((_: any, idx: number) => (
              <button key={idx} onClick={() => { setActiveProblemIndex(idx); setOutput("Ready to execute..."); }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeProblemIndex === idx ? "bg-black text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"}`}
              >Problem {idx + 1}</button>
            ))}
          </div>
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-black text-slate-900 m-0 tracking-tight">{activeProblem.title}</h2>
            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">{activeProblem.difficulty || "Medium"}</span>
          </div>
          <div className="prose prose-sm text-slate-600 mb-8 whitespace-pre-wrap font-medium leading-relaxed">{activeProblem.description || "No description provided."}</div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Test Cases</h3>
          <div className="space-y-4">
            {activeProblem.testCases?.map((tc: any, i: number) => (
              <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Input:</div>
                <div className="font-mono text-xs bg-white text-slate-700 p-3.5 rounded-xl border border-slate-200 mb-4 shadow-sm">{tc.input}</div>
                <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Expected Output:</div>
                <div className="font-mono text-xs bg-white text-slate-700 p-3.5 rounded-xl border border-slate-200 shadow-sm">{tc.output}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Editor */}
      <div className="w-[65%] flex flex-col gap-4">
        <div className="flex-[2.5] flex flex-col bg-white/80 backdrop-blur-2xl rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm">
          <div className="bg-slate-50 border-b border-slate-200/60 p-3 flex justify-between items-center px-6 h-16">
            <div className="flex items-center gap-3 text-slate-700 font-bold text-sm"><Code size={18} /> Editor</div>
            <select className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-black shadow-sm" value={language} onChange={(e) => setLanguage(parseInt(e.target.value))}>
              {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="flex-1 p-3">
            <Editor height="100%" defaultLanguage="python" language={languages.find(l => l.id === language)?.value} theme="light" value={code} onChange={(val) => setCode(val || "")} options={{ minimap: { enabled: false }, fontSize: 15, scrollBeyondLastLine: false, roundedSelection: true, padding: { top: 20 }, cursorBlinking: "smooth" }} />
          </div>
        </div>

        {/* Terminal & Actions */}
        <div className="flex-[1.5] flex flex-col gap-4">
          <div className="flex-[1.3] flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-800">
            <div className="bg-slate-950 text-slate-400 px-6 py-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border-b border-slate-800"><Monitor size={16} /> Terminal Output</div>
            <div className="flex-1 p-6 font-mono text-sm text-emerald-400 overflow-y-auto whitespace-pre-wrap leading-relaxed">{output}</div>
          </div>
          <div className="flex-[0.2] flex gap-4 h-16">
            <button onClick={() => alert("✅ Code Saved!")} className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm"><Save size={18} /> Save Progress</button>
            {/* GREEN ACTION BUTTON */}
            <button onClick={runCode} disabled={loading} className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-70 shadow-lg shadow-emerald-500/20">{loading ? <Cpu size={20} className="animate-spin" /> : <Play size={20} className="fill-white" />} {loading ? "Running..." : "Execute Code"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PLAYER COMPONENT ---
const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [isMarking, setIsMarking] = useState(false);

  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const [showPendingCertModal, setShowPendingCertModal] = useState(false);
  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type }), 4000);
  };

  // 🎯 THE BULLETPROOF YOUTUBE OVERRIDE (Untouched logic)
  const plyrOptions = useMemo(() => ({
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume'],
    youtube: {
      noCookie: true,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      disablekb: 1
    },
  }), []);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/courses/${courseId}/player`, { headers: { Authorization: `Bearer ${token}` } });
        setCourse(res.data);
        setCompletedLessons(res.data.completed_lessons || []);
        if (res.data.modules?.[0]) {
          setExpandedModules([res.data.modules[0].id]);
          if (res.data.modules[0].lessons?.length > 0) setActiveLesson(res.data.modules[0].lessons[0]);
        }
      } catch (err) { console.error(err); }
    };
    fetchCourse();
  }, [courseId]);

  const toggleModule = (moduleId: number) => setExpandedModules(prev => prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]);

  const handleMarkComplete = async () => {
    if (!activeLesson || completedLessons.includes(activeLesson.id)) return;
    setIsMarking(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/progress/toggle`, { lesson_id: activeLesson.id }, { headers: { Authorization: `Bearer ${token}` } });
      setCompletedLessons(prev => [...prev, activeLesson.id]);
    } catch (err) { console.error(err); } finally { setIsMarking(false); }
  };

  const isModuleComplete = (module: any) => module.lessons && module.lessons.length > 0 && module.lessons.every((l: any) => completedLessons.includes(l.id));
  const isCourseComplete = useMemo(() => {
    if (!course || !course.modules) return false;
    let total = 0, completed = 0;
    course.modules.forEach((m: any) => m.lessons.forEach((l: any) => { total++; if (completedLessons.includes(l.id)) completed++; }));
    return total > 0 && completed === total;
  }, [course, completedLessons]);

  const handleDownloadCertificate = async () => {
    if (!isCourseComplete) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/generate-pdf/${courseId}`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `${course.title.replace(/\s+/g, "_")}_Certificate.pdf`);
      document.body.appendChild(link); link.click();
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        setShowPendingCertModal(true);
      } else {
        triggerToast("Failed to generate certificate at this time.", "error");
      }
    }
  };

  const getEmbedUrl = (url: string) => url ? (url.includes("docs.google.com/forms") ? url.replace(/\/viewform.*/, "/viewform?embedded=true").replace(/\/view.*/, "/viewform?embedded=true") : url.replace("/view", "/preview")) : "";
  const getYoutubeId = (url: string) => { const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/); return (match && match[2].length === 11) ? match[2] : null; };

  const renderContent = () => {
    if (!activeLesson) return <div className="flex items-center justify-center h-full text-slate-400 font-bold tracking-widest uppercase">Select a lesson to begin</div>;
    const isDone = completedLessons.includes(activeLesson.id);

    return (
      <div className="flex flex-col h-full bg-transparent">
        {/* CENTER STAGE: Content Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center w-full p-8 md:p-12">

          {activeLesson.type === "note" && (
            <div className="w-full h-full max-w-6xl rounded-[2rem] overflow-hidden shadow-xl border border-slate-200/60 bg-white/50 backdrop-blur-xl mx-auto p-2">
              <iframe src={getEmbedUrl(activeLesson.url)} className="w-full h-full rounded-[1.5rem] border-0 bg-white" />
            </div>
          )}

          {activeLesson.type === "quiz" && (
            <div className="w-full h-full max-w-6xl rounded-[2rem] overflow-hidden shadow-xl border border-slate-200/60 bg-white/50 backdrop-blur-xl mx-auto p-2">
              <iframe src={getEmbedUrl(activeLesson.url)} className="w-full h-full rounded-[1.5rem] border-0 bg-white" />
            </div>
          )}

          {(activeLesson.type === "video" || activeLesson.type === "live_class") && (
            <div className="w-full flex flex-col items-center justify-center h-full">
              <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 bg-black relative">

                {/* 🛡️ FORCEFIELD & CROP MAGIC (Untouched logic) */}
                <style>{`
                  .plyr__video-embed iframe { 
                    top: -50% !important; 
                    height: 200% !important; 
                    pointer-events: none !important; 
                  }
                  :root { --plyr-color-main: #ffffff; }
                  .plyr__control--overlaid { background: rgba(255,255,255,0.1) !important; backdrop-filter: blur(10px); color: white !important; border: 1px solid rgba(255,255,255,0.2); }
                  .plyr__control--overlaid:hover { background: rgba(255,255,255,0.2) !important; }
                `}</style>

                {getYoutubeId(activeLesson.url) ? (
                  <Plyr
                    source={{
                      type: "video",
                      sources: [{ src: getYoutubeId(activeLesson.url) || "", provider: "youtube" }]
                    }}
                    options={plyrOptions}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 font-bold tracking-widest uppercase">Invalid Video Source</div>
                )}
              </div>
            </div>
          )}

          {activeLesson.type === "code_test" && <div className="w-full h-full"><CodeCompiler lesson={activeLesson} /></div>}

          {activeLesson.type === "assignment" && (
            <div className="flex flex-col items-center justify-center h-full text-center w-full max-w-3xl mx-auto">
              <div className="bg-white/80 backdrop-blur-3xl border border-slate-200/60 p-16 rounded-[3rem] w-full shadow-xl">
                <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-sm">
                  <UploadCloud size={40} className="text-slate-800" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">{activeLesson.title}</h2>
                <p className="text-slate-500 mb-12 leading-relaxed whitespace-pre-wrap font-medium text-lg">{activeLesson.instructions || "Access the assignment details via the secure link below."}</p>
                <a href={activeLesson.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-3 bg-black text-white px-10 py-5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg w-full text-lg">
                  Access Assignment Files <ExternalLink size={20} />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="h-28 bg-white/90 backdrop-blur-2xl border-t border-slate-200/60 flex items-center justify-between px-8 md:px-14 shrink-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
          <div>
            <h3 className="text-slate-900 font-black text-2xl tracking-tight mb-1">{activeLesson.title}</h3>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">{activeLesson.type}</p>
          </div>

          {/* GREEN ACTION BUTTON */}
          <button
            onClick={handleMarkComplete} disabled={isDone || isMarking}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all text-sm ${isDone ? 'bg-green-50 border border-green-200 text-green-600 cursor-default' : 'bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-emerald-500/20 active:scale-95'}`}
          >
            {isDone ? <><CheckCircle size={20} /> Module Completed</> : <><CheckCircle size={20} /> Mark as Complete</>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-[#f8fafc] text-slate-900 selection:bg-emerald-500 selection:text-white relative">

      {/* 🎨 THEME: Bright, Crisp Glass Background Ornaments */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white rounded-full blur-[150px] pointer-events-none opacity-80" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-slate-200/50 rounded-full blur-[180px] pointer-events-none" />

      {/* LEFT SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 380, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="flex flex-col h-full bg-white/80 backdrop-blur-3xl border-r border-slate-200/60 z-30 shrink-0 relative shadow-2xl">

            {/* Sidebar Header */}
            <div className="pt-8 pb-4 px-8 shrink-0">
              <button onClick={() => navigate("/student-dashboard")} className="flex items-center justify-center gap-3 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm bg-white border border-slate-200 px-5 py-3 rounded-2xl w-fit shadow-sm hover:bg-slate-50">
                <ChevronLeft size={18} /> Exit Player
              </button>
            </div>

            {/* Modules List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {course?.modules.map((module: any, idx: number) => {
                const isExpanded = expandedModules.includes(module.id);
                const moduleComplete = isModuleComplete(module);

                return (
                  <div key={module.id} className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm">
                    <button onClick={() => toggleModule(module.id)} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="text-left flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase {idx + 1}</span>
                          {moduleComplete && <CheckCircle size={14} className="text-emerald-500" />}
                        </div>
                        <div className={`text-base font-black tracking-tight ${moduleComplete ? 'text-slate-400' : 'text-slate-900'}`}>{module.title}</div>
                      </div>
                      {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50/50 border-t border-slate-100">
                          <div className="p-3 space-y-1.5">
                            {module.lessons.map((lesson: any) => {
                              const isActive = activeLesson?.id === lesson.id;
                              const isLessonDone = completedLessons.includes(lesson.id);

                              return (
                                <button key={lesson.id} onClick={() => setActiveLesson(lesson)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-200 text-slate-900' : 'hover:bg-slate-100 border border-transparent text-slate-500'}`}>
                                  <div className={`${isActive ? 'text-slate-900' : isLessonDone ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {isLessonDone ? <CheckCircle size={18} /> : lesson.type === "video" ? <PlayCircle size={18} /> : lesson.type === "note" ? <FileText size={18} /> : lesson.type === "quiz" ? <HelpCircle size={18} /> : <UploadCloud size={18} />}
                                  </div>
                                  <div className={`text-sm text-left truncate flex-1 font-bold ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>{lesson.title}</div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* THE CERTIFICATE GATE */}
            <div className="p-8 shrink-0 bg-white border-t border-slate-200/60">
              <div className={`relative overflow-hidden rounded-3xl p-6 border ${isCourseComplete ? 'border-green-200 bg-green-50 shadow-sm' : 'border-slate-100 bg-slate-50'} transition-all`}>
                <div className="relative z-10">
                  <h4 className={`font-black mb-2 flex items-center gap-3 text-base ${isCourseComplete ? "text-green-700" : "text-slate-700"}`}>
                    <Award size={20} /> Course Certificate
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold mb-6 uppercase tracking-widest">
                    {isCourseComplete ? "UNLOCKED & READY" : "COMPLETE ALL MODULES"}
                  </p>
                  {/* GREEN CLAIM BUTTON */}
                  <button onClick={handleDownloadCertificate} disabled={!isCourseComplete}
                    className={`w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-3 transition-all ${isCourseComplete ? 'bg-[#10b981] text-white hover:bg-[#059669] shadow-md shadow-emerald-500/20' : 'bg-white border border-slate-200 text-slate-400 cursor-not-allowed shadow-sm'}`}
                  >
                    {isCourseComplete ? <><Unlock size={18} /> Claim Certificate</> : <><Lock size={18} /> Locked</>}
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* RIGHT MAIN VIEW */}
      <div className="flex-1 flex flex-col relative z-20">
        <div className="absolute top-8 left-8 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 bg-white/80 backdrop-blur-2xl rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white transition-colors shadow-sm">
            <Menu size={20} />
          </button>
        </div>
        <div className="flex-1 h-full pt-0">{renderContent()}</div>
      </div>

      {/* PENDING CERTIFICATE MODAL */}
      <AnimatePresence>
        {showPendingCertModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 relative text-center"
            >
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={32} className="text-amber-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
                Instructor Review Pending
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                Congratulations on finishing the modules! Your instructor is currently reviewing and finalizing the course materials. Your official certificate will be unlocked automatically once the course is fully finalized.
              </p>
              <button
                onClick={() => setShowPendingCertModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-95"
              >
                Got it, I'll wait!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GLASSMORPHIC TOAST */}
      <GlassToast toast={{ show: toast.show, msg: toast.msg, type: toast.type as "success" | "error", id: 0 }} />
    </div>
  );
};

export default CoursePlayer;