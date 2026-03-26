import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Compass, Award, Settings, LogOut,
  PlayCircle, ShoppingBag, User, Download, Clock,
  CreditCard, X, Lock, Save, CheckCircle, AlertCircle,
  Code, Play, Terminal, Monitor, AlertTriangle, Eye, EyeOff,
  ChevronRight, Menu, Zap, Cpu, Bell, Search, LayoutDashboard,
  CheckSquare, FileText, HelpCircle, Lightbulb, Trophy,
  TrendingUp, Activity, Cloud, Layers
} from "lucide-react";
import { GlassToast } from "./components/GlassToast";

// ✅ AI IMPORTS (Proctoring)
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";
import "@tensorflow/tfjs-backend-webgl";

// ✅ LOCAL PYTHON EXECUTION
import { runPythonLocally } from './utils/pyodideEnv';
const API_BASE_URL = "http://127.0.0.1:8000/api/v1";
// --- TYPES ---
interface Course { id: number; title: string; description: string; price: number; image_url: string; instructor_id: number; }
interface CodeTest { id: number; title: string; time_limit: number; problems: any[]; completed?: boolean; }

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Navigation & Profile State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activityTab, setActivityTab] = useState("assignments");

  const userData = { name: "Student", email: "student@skillforge.com", initials: "ST" };

  // Modal & Settings
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [processing, setProcessing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // --- CODE ARENA STATES ---
  const [codeTests, setCodeTests] = useState<CodeTest[]>([]);
  const [activeTest, setActiveTest] = useState<CodeTest | null>(null);
  const [passKeyInput, setPassKeyInput] = useState("");
  const [showPassKeyModal, setShowPassKeyModal] = useState<number | null>(null);

  // --- PROCTORING & IDE STATES ---
  const [timeLeft, setTimeLeft] = useState(0);
  const [fullScreenWarns, setFullScreenWarns] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [faceStatus, setFaceStatus] = useState<"ok" | "missing" | "multiple">("ok");

  // Problem & Code State
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [solutions, setSolutions] = useState<{ [key: number]: string }>({});
  const [userCode, setUserCode] = useState("");
  const [language, setLanguage] = useState(71);

  const [consoleOutput, setConsoleOutput] = useState("Ready to execute...");
  const [executionStatus, setExecutionStatus] = useState("idle");

  const videoRef = useRef<HTMLVideoElement>(null);

  const languages = [
    { id: 71, name: "Python (3.8.1)", value: "python" },
    { id: 62, name: "Java (OpenJDK 13)", value: "java" },
    { id: 54, name: "C++ (GCC 9.2.0)", value: "cpp" },
    { id: 63, name: "JavaScript (Node.js)", value: "javascript" },
  ];

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // ============================================================================
  // 🔄 DATA FETCHING & PROCTORING EFFECTS
  // ============================================================================

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "instructor") { navigate("/dashboard"); return; }
    fetchData();
    fetchCodeTests();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const allRes = await axios.get(`${API_BASE_URL}/courses`, config);
      const myRes = await axios.get(`${API_BASE_URL}/my-courses`, config);

      const myCourseIds = new Set(myRes.data.map((c: Course) => c.id));
      setAvailableCourses(allRes.data.filter((c: Course) => !myCourseIds.has(c.id)));
      setEnrolledCourses(myRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) { localStorage.clear(); navigate("/"); }
    } finally { setLoading(false); }
  };

  const fetchCodeTests = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_BASE_URL}/code-tests`, { headers: { Authorization: `Bearer ${token}` } });
      setCodeTests(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    let aiInterval: any;
    if (activeTest) {
      const savedWarns = localStorage.getItem(`warns_${activeTest.id}`);
      if (savedWarns) setFullScreenWarns(parseInt(savedWarns));

      const savedSolutions = localStorage.getItem(`sols_${activeTest.id}`);
      if (savedSolutions) {
        const parsed = JSON.parse(savedSolutions);
        setSolutions(parsed);
        setUserCode(parsed[0] || "# Write your solution here...");
      } else {
        setUserCode("# Write your solution here...");
      }

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { submitTest(); return 0; }
          return prev - 1;
        });
      }, 1000);

      const handleFullScreenChange = () => {
        if (!document.fullscreenElement) {
          setIsFullScreen(false);
          setFullScreenWarns(prev => {
            const newCount = prev + 1;
            localStorage.setItem(`warns_${activeTest.id}`, newCount.toString());
            if (newCount > 2) {
              submitTest();
              triggerToast("🛑 TEST TERMINATED: Full-screen violation limit exceeded.", "error");
            }
            return newCount;
          });
        } else {
          setIsFullScreen(true);
        }
      };
      document.addEventListener("fullscreenchange", handleFullScreenChange);

      const setupAI = async () => {
        try {
          await tf.setBackend('webgl');
          const loadedModel = await blazeface.load();
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.onloadeddata = () => {
                aiInterval = setInterval(async () => {
                  if (videoRef.current && videoRef.current.readyState === 4) {
                    const predictions = await loadedModel.estimateFaces(videoRef.current, false);
                    if (predictions.length === 0) setFaceStatus("missing");
                    else if (predictions.length > 1) setFaceStatus("multiple");
                    else setFaceStatus("ok");
                  }
                }, 1000);
              };
            }
          }
        } catch (err) { console.error("AI Init Failed", err); }
      };
      setupAI();

      return () => {
        clearInterval(timer);
        clearInterval(aiInterval);
        document.removeEventListener("fullscreenchange", handleFullScreenChange);
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [activeTest]);

  // ============================================================================
  // ⚡ HYBRID EXECUTION LOGIC (The "Anti-Cheese" Rules)
  // ============================================================================

  const handleRun = async () => {
    setExecutionStatus("running");
    setConsoleOutput("Processing...");

    // 🟢 CASE 1: PYTHON (Run Locally via Pyodide)
    if (language === 71) {
      setConsoleOutput("🔹 Running Local Check (Pyodide)...");
      const localResult = await runPythonLocally(userCode);

      if (localResult.success) {
        setExecutionStatus("success");
        setConsoleOutput(`✅ Output:\n${localResult.output}\n\n(Click 'Submit' to grade against hidden test cases)`);
        triggerToast("Executed Successfully (Local)", "success");
      } else {
        setExecutionStatus("error");
        setConsoleOutput(`❌ Local Syntax/Runtime Error:\n${localResult.error}`);
        triggerToast("Syntax Error", "error");
      }
      return; // STOP HERE. Do not hit AWS.
    }

    // 🔴 CASE 2: C++ / JAVA (Run on Server - Dry Run Only)
    setConsoleOutput("🚀 Compiling on Server (Dry Run)...");
    try {
      const currentProb = activeTest?.problems[currentProblemIndex];
      let sampleCases: any[] = [];

      try {
        const allCases = typeof currentProb?.test_cases === 'string' ? JSON.parse(currentProb.test_cases) : currentProb?.test_cases;
        // ONLY SEND ONE PUBLIC CASE for "Run"
        sampleCases = (allCases && allCases.length > 0) ? [allCases[0]] : [];
      } catch (e) { }

      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE_URL}/execute`, {
        source_code: userCode,
        language_id: language,
        test_cases: sampleCases
      }, { headers: { Authorization: `Bearer ${token}` } });

      const report = res.data.stats ? res.data : res.data.data;

      if (report.error || (report.results && report.results.some((r: any) => r.status !== 'Passed'))) {
        setExecutionStatus("error");
        const fail = report.results?.find((r: any) => r.status !== "Passed");
        setConsoleOutput(fail ? `❌ DRY RUN FAILED:\nExpected: ${fail.expected}\nActual: ${fail.actual}` : `❌ Error: ${report.error}`);
      } else {
        setExecutionStatus("success");
        setConsoleOutput(`✅ Dry Run Passed!\nOutput: ${report.results?.[0]?.output || "Success"}\n\n(Click 'Submit' to grade all cases)`);
      }
    } catch (err: any) {
      setExecutionStatus("error");
      setConsoleOutput("System Error: " + (err.response?.data?.error || err.message));
    }
  };

  const submitTest = async () => {
    if (!activeTest) return;
    setExecutionStatus("running");
    setConsoleOutput("🚀 Submitting to Official Grader...");
    const token = localStorage.getItem("token");

    try {
      const currentProb = activeTest?.problems[currentProblemIndex];
      let cases = [];
      try {
        const rawCases = currentProb?.test_cases;
        cases = typeof rawCases === 'string' ? JSON.parse(rawCases) : rawCases;

        // STRICT VALIDATION: Ensure test cases exist
        if (!cases || cases.length === 0) {
          setExecutionStatus("error");
          setConsoleOutput("❌ Error: No test cases found to grade against.");
          return;
        }
      } catch (e) {
        setExecutionStatus("error");
        setConsoleOutput("❌ Error: Invalid Test Case Format.");
        return;
      }

      // SEND ALL CASES TO AWS
      const res = await axios.post(`${API_BASE_URL}/execute`, {
        source_code: userCode,
        language_id: language,
        test_cases: cases
      }, { headers: { Authorization: `Bearer ${token}` } });

      let report = res.data;
      if (report.body && typeof report.body === 'string') report = JSON.parse(report.body);

      if (report.error) {
        setExecutionStatus("error");
        setConsoleOutput(`❌ SERVER ERROR:\n\n${report.error}`);
        return;
      }

      // STRICT SUCCESS VALIDATION (The "Anti-Cheese" Rule)
      const passedCount = report.stats?.passed || 0;
      const totalCount = report.stats?.total || 0;

      if (totalCount > 0 && passedCount === totalCount) {
        setExecutionStatus("success");
        setConsoleOutput(`🎉 SUCCESS! All ${totalCount} Test Cases Passed.\nRuntime: ${report.stats.runtime_ms}ms`);
        triggerToast("Problem Solved!", "success");

        // Save Progress internally
        handleSave(true);

        // If this was the last action, submit entire test to DB
        const timeSpent = Math.floor((activeTest.time_limit * 60 - timeLeft) / 60);
        await axios.post(`${API_BASE_URL}/code-tests/submit`, {
          test_id: activeTest.id,
          score: 100,
          problems_solved: Object.keys(solutions).length + 1,
          time_taken: `${timeSpent} mins`
        }, { headers: { Authorization: `Bearer ${token}` } });

      } else {
        setExecutionStatus("error");
        const fail = report.results?.find((r: any) => r.status !== "Passed");
        if (fail) {
          setConsoleOutput(`❌ TEST FAILED (Case ${fail.id + 1})\n\nInput: ${fail.input}\nExpected: ${fail.expected}\nActual: ${fail.actual}`);
        } else {
          setConsoleOutput("❌ Unknown Error: Output did not match expected results.");
        }
        triggerToast("Hidden Test Cases Failed", "error");
      }
    } catch (err: any) {
      setExecutionStatus("error");
      setConsoleOutput("System Error: " + (err.response?.data?.error || err.message));
    }
  };

  // ============================================================================
  // 🛠️ UTILITY HANDLERS
  // ============================================================================

  const handleStartTest = async () => {
    const token = localStorage.getItem("token");
    try {
      const formData = new FormData(); formData.append("pass_key", passKeyInput);
      const res = await axios.post(`${API_BASE_URL}/code-tests/${showPassKeyModal}/start`, formData, { headers: { Authorization: `Bearer ${token}` } });
      const prevWarns = localStorage.getItem(`warns_${res.data.id}`);
      if (prevWarns && parseInt(prevWarns) > 2) { triggerToast("⛔ You have been disqualified from this test.", "error"); return; }
      setActiveTest(res.data);
      setTimeLeft(res.data.time_limit * 60);
      setShowPassKeyModal(null);
      if (document.documentElement.requestFullscreen) { document.documentElement.requestFullscreen().catch((e) => console.log("Enable full screen")); }
    } catch (err) { triggerToast("Invalid Pass Key", "error"); }
  };

  const handleSave = (silent = false) => {
    if (!activeTest) return;
    const newSolutions = { ...solutions, [currentProblemIndex]: userCode };
    setSolutions(newSolutions);
    localStorage.setItem(`sols_${activeTest.id}`, JSON.stringify(newSolutions));
    if (!silent) triggerToast("✅ Code Saved! You can move to other questions.", "success");
  };

  const switchQuestion = (index: number) => {
    handleSave(true);
    setCurrentProblemIndex(index);
    setUserCode(solutions[index] || "# Write your solution here...");
    setConsoleOutput("Ready to execute...");
    setExecutionStatus("idle");
  };

  const returnToFullScreen = () => {
    document.documentElement.requestFullscreen();
    setIsFullScreen(true);
  };

  const handleDownloadCertificate = async (id: number, title: string) => {
    setDownloadingId(id);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/generate-pdf/${id}`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate-${title.replace(/\s+/g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      triggerToast("Certificate Downloaded Successfully!");
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        triggerToast("Instructor hasn't finalized this course yet. Check back soon!", "error");
      } else {
        triggerToast("Failed to generate certificate.", "error");
      }
    } finally { setDownloadingId(null); }
  };

  const openEnrollModal = (course: Course) => { setSelectedCourse(course); setShowModal(true); };
  const handlePayment = async (courseId: number, price: number) => { /* Razorpay Logic */ triggerToast("Payment Portal Triggered", "success"); };
  const handleTrialParams = async () => { if (!selectedCourse) return; setProcessing(true); try { const token = localStorage.getItem("token"); await axios.post(`${API_BASE_URL}/enroll/${selectedCourse.id}`, { type: "trial" }, { headers: { Authorization: `Bearer ${token}` } }); triggerToast("Trial Activated!"); setShowModal(false); setActiveTab("learning"); fetchData(); } catch (e) { triggerToast("Error", "error"); } finally { setProcessing(false); } };
  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  // ============================================================================
  // 🎨 UI COMPONENTS (SkillForge Theme)
  // ============================================================================

  const NavItem = ({ label, active, onClick, icon }: any) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${active ? "bg-black text-white shadow-md" : "text-gray-500 hover:text-black hover:bg-gray-100"}`}
    >
      {icon} {label}
    </button>
  );

  // --- 🔴 FULL SCREEN PROCTORING VIEW (ACTIVE TEST) ---
  if (activeTest) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden">

        {/* Test Header */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-black font-extrabold text-lg tracking-tight">
              <div className="w-6 h-6 bg-black flex items-center justify-center rounded-[4px]"><Layers className="text-white" size={12} strokeWidth={2.5} /></div>
              SkillForge <span className="text-gray-400 font-normal">Arena</span>
            </div>
            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
            <h3 className="text-sm font-bold text-gray-700 hidden md:block">{activeTest.title}</h3>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
            {activeTest.problems.map((_, idx) => (
              <button key={idx} onClick={() => switchQuestion(idx)} className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${idx === currentProblemIndex ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"}`}>
                Q{idx + 1}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-4 py-1.5 rounded-full border font-mono text-sm font-bold flex items-center gap-2 ${timeLeft < 300 ? "bg-red-50 border-red-200 text-red-600 animate-pulse" : "bg-white border-gray-200 text-black shadow-sm"}`}>
              <Clock size={14} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </div>
            <button onClick={submitTest} className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-full text-xs font-bold transition-colors shadow-lg">Submit Test</button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden p-4 gap-4">

          {/* Left Panel: Problem & Camera */}
          <div className="w-[35%] flex flex-col gap-4">
            <div className="flex-1 bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-black text-black tracking-tight">{activeTest.problems[currentProblemIndex]?.title}</h2>
                <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-3 py-1 rounded-full border border-gray-200 uppercase tracking-widest">Problem {currentProblemIndex + 1}</span>
              </div>
              <div className="prose prose-sm text-gray-600 leading-relaxed mb-8 whitespace-pre-wrap font-medium">
                {activeTest.problems[currentProblemIndex]?.description || "No description available."}
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-xs font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2"><Code size={14} /> Test Cases</h4>
                {JSON.parse(activeTest.problems[currentProblemIndex]?.test_cases || "[]").length > 0 && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 mb-2">INPUT</div>
                      <code className="block bg-white border border-gray-200 p-3 rounded-lg text-sm font-mono text-black shadow-sm">{JSON.parse(activeTest.problems[currentProblemIndex].test_cases)[0].input}</code>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 mb-2">EXPECTED OUTPUT</div>
                      <code className="block bg-white border border-gray-200 p-3 rounded-lg text-sm font-mono text-black shadow-sm">{JSON.parse(activeTest.problems[currentProblemIndex].test_cases)[0].output}</code>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Proctoring Cam */}
            <div className="h-[220px] shrink-0 bg-black rounded-[1.5rem] border border-gray-800 shadow-xl overflow-hidden relative group">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-full text-[10px] font-black text-white flex items-center gap-2 shadow-lg backdrop-blur-md ${faceStatus === "ok" ? "bg-green-500/80 border border-green-400" : "bg-red-500/80 border border-red-400 animate-pulse"}`}>
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  {faceStatus === "ok" ? "AI PROCTORING ACTIVE" : "FACE NOT DETECTED"}
                </div>
              </div>
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1] opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Right Panel: Editor & Terminal */}
          <div className="w-[65%] flex flex-col gap-4">

            <div className="flex-[2] bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 flex flex-col overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 h-14 flex items-center justify-between px-6">
                <div className="flex items-center gap-2 text-sm font-black text-black tracking-tight">
                  <Terminal size={16} /> Code Editor
                </div>
                <select value={language} onChange={(e) => setLanguage(parseInt(e.target.value))} className="bg-white border border-gray-300 text-sm font-bold text-black rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-black cursor-pointer shadow-sm">
                  {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="flex-1 pt-4 pb-2 bg-white">
                <Editor height="100%" defaultLanguage="python" language={languages.find(l => l.id === language)?.value} theme="light" value={userCode} onChange={(val) => setUserCode(val || "")} options={{ minimap: { enabled: false }, fontSize: 15, scrollBeyondLastLine: false, padding: { top: 10 }, fontFamily: "'JetBrains Mono', monospace" }} />
              </div>
            </div>

            <div className="flex-[1] flex flex-col gap-4">
              <div className="flex-1 bg-[#0A0A0A] rounded-[1.5rem] shadow-2xl border border-gray-800 flex flex-col overflow-hidden">
                <div className="bg-[#111] h-10 flex items-center px-6 border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest gap-2">
                  <Monitor size={14} /> Terminal Output
                </div>
                <div className={`flex-1 p-6 font-mono text-sm overflow-y-auto whitespace-pre-wrap leading-relaxed ${executionStatus === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                  {consoleOutput}
                </div>
              </div>

              <div className="h-14 flex gap-4">
                <button onClick={() => handleSave()} className="w-1/4 bg-white border border-gray-300 hover:bg-gray-50 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                  <Save size={18} /> Save
                </button>
                <button onClick={handleRun} disabled={executionStatus === "running"} className="flex-1 bg-gray-100 hover:bg-gray-200 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 border border-gray-300 shadow-sm">
                  {executionStatus === "running" ? <Cpu className="animate-spin" size={18} /> : <Play size={18} />} Run Code
                </button>
                <button onClick={submitTest} disabled={executionStatus === "running"} className="flex-1 bg-black hover:bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-xl shadow-black/10">
                  <Cloud size={18} /> Submit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Proctoring Violation Overlay */}
        {!isFullScreen && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-center p-8">
            <AlertTriangle size={80} className="text-red-500 mb-8 animate-bounce" />
            <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">Test Interrupted</h1>
            <p className="text-gray-400 max-w-lg mb-10 text-lg leading-relaxed">
              You have exited full-screen mode. This is a strict proctoring violation. Your action has been recorded.
            </p>
            <div className="bg-red-500/10 text-red-500 px-8 py-4 rounded-2xl font-mono font-bold mb-10 border border-red-500/30 text-2xl shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              Remaining Warnings: {2 - fullScreenWarns}
            </div>
            <button onClick={returnToFullScreen} className="bg-white text-black hover:bg-gray-200 px-10 py-5 rounded-full font-black tracking-wide transition-all shadow-xl flex items-center gap-3 text-lg">
              <Monitor size={24} /> RETURN TO FULL SCREEN
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // 🟢 MAIN DASHBOARD VIEW (Light Glassmorphic Bento Box)
  // ============================================================================

  return (
    <div className="min-h-screen bg-[#f4f4f5] font-sans text-black selection:bg-black selection:text-white relative overflow-x-hidden pb-20">

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-gray-200/50 rounded-full blur-[150px] pointer-events-none" />

      {/* 1. TOP NAVIGATION BAR */}
      <header className="fixed top-0 left-0 w-full h-20 bg-white/70 backdrop-blur-xl border-b border-gray-200 z-50 flex items-center justify-between px-6 md:px-10 shadow-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("home")}>
          <div className="w-8 h-8 bg-black flex items-center justify-center rounded-[6px] shadow-md">
            <Layers className="text-white" size={18} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black tracking-tight text-black">Skill<span className="text-gray-500">Forge</span></span>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-full border border-gray-200">
          <NavItem icon={<LayoutDashboard size={16} />} label="Home" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
          <NavItem icon={<BookOpen size={16} />} label="My Courses" active={activeTab === "learning"} onClick={() => setActiveTab("learning")} />
          <NavItem icon={<Code size={16} />} label="Code Arena" active={activeTab === "test"} onClick={() => setActiveTab("test")} />
          <NavItem icon={<Award size={16} />} label="Certificates" active={activeTab === "certificates"} onClick={() => setActiveTab("certificates")} />
          <NavItem icon={<Compass size={16} />} label="Explore" active={activeTab === "explore"} onClick={() => setActiveTab("explore")} />
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-5">
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-gray-500 hover:text-black transition-colors">
            <Bell size={22} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <div className="relative">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 pl-2 pr-4 py-1.5 bg-white border border-gray-200 rounded-full hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-black flex items-center justify-center font-bold text-xs">{userData.initials}</div>
              <span className="text-sm font-bold hidden md:block">{userData.name}</span>
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50">
                  <div className="mb-4 border-b border-gray-100 pb-4 px-2">
                    <p className="font-black text-black">{userData.name}</p>
                    <p className="text-xs text-gray-500 font-medium truncate">{userData.email}</p>
                  </div>
                  <button onClick={() => { setActiveTab("settings"); setShowProfileMenu(false); }} className="flex items-center gap-3 w-full p-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-black font-bold text-sm transition-colors mb-1"><Settings size={18} /> Account Settings</button>
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl text-red-500 hover:bg-red-50 font-bold text-sm transition-colors"><LogOut size={18} /> Sign Out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto pt-32 px-6 relative z-10">

        {/* TAB: HOME (BENTO GRID) */}
        {activeTab === "home" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col gap-6">

            <div className="mb-4">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black">Forge Your Future, {userData.name}!</h1>
              <p className="text-gray-500 font-medium mt-2">Welcome back to your learning hub.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">

              {/* BENTO 1: My Courses (Large) */}
              <div className="md:col-span-2 lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-xl flex items-center gap-2"><BookOpen size={20} /> Active Courses</h3>
                  <button onClick={() => setActiveTab("learning")} className="text-xs font-bold bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">View All</button>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide flex-1">
                  {enrolledCourses.slice(0, 3).map((c, i) => (
                    <div key={i} className="min-w-[160px] bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between group">
                      <div className="flex items-center justify-center mb-4">
                        {/* Custom Circular Progress SVG */}
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200" />
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="175" strokeDashoffset={175 - (175 * 75) / 100} className="text-black" />
                          </svg>
                          <span className="absolute text-xs font-black">75%</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <h4 className="font-bold text-sm truncate mb-1">{c.title}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase bg-white px-2 py-0.5 rounded border border-gray-200">Intermediate</span>
                      </div>
                      <button onClick={() => navigate(`/course/${c.id}/player`)} className="w-full mt-4 bg-black text-white text-xs font-bold py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Resume</button>
                    </div>
                  ))}
                  {enrolledCourses.length === 0 && (
                    <div className="w-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                      <Compass size={32} className="mb-2" />
                      <p className="text-sm font-bold">No active courses. Start exploring!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* BENTO 2: Performance Hub */}
              <div className="md:col-span-1 lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row gap-8">
                <div className="flex-1 flex flex-col">
                  <h3 className="font-black text-xl mb-4 flex items-center gap-2"><TrendingUp size={20} /> Performance Hub</h3>
                  <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 p-4 relative overflow-hidden flex items-end">
                    {/* Fake Graph SVG */}
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full absolute bottom-0 left-0 opacity-20">
                      <path d="M0 40 L0 30 Q 20 10, 40 25 T 80 15 L 100 5 L 100 40 Z" fill="black" />
                    </svg>
                    <div className="relative z-10 w-full flex justify-between text-[10px] font-bold text-gray-400 border-t border-gray-200 pt-2">
                      <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 justify-center md:w-48">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div><p className="text-xs font-bold text-gray-500">Avg Solved</p><p className="text-xl font-black">68%</p></div>
                    <CheckCircle size={24} className="text-green-500" />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div><p className="text-xs font-bold text-gray-500">Skill Badges</p><p className="text-xl font-black">4</p></div>
                    <Award size={24} className="text-black" />
                  </div>
                </div>
              </div>

              {/* BENTO 3: Code Arena Focus */}
              <div className="md:col-span-1 lg:col-span-1 bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
                <h3 className="font-black text-lg mb-2 flex items-center gap-2"><Code size={18} /> Code Arena Focus</h3>
                <p className="text-xs text-gray-500 font-medium mb-4">Next available challenges</p>
                <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between group">
                      <div>
                        <h4 className="font-bold text-sm text-gray-800">Challenge {i}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mt-1">
                          <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">Diff: {i * 2}</span>
                          <span className="flex items-center gap-1"><Clock size={10} /> 15m</span>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab("test")} className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Solve</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* BENTO 4: Campus Leaderboard */}
              <div className="md:col-span-1 lg:col-span-1 bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
                <h3 className="font-black text-lg mb-2 flex items-center gap-2"><Trophy size={18} /> Campus Rank</h3>
                <p className="text-xs text-gray-500 font-medium mb-4">Global gamification standings</p>
                <div className="space-y-4">
                  {[
                    { name: "Saram", score: 6560, me: false },
                    { name: "Mattvn", score: 4380, me: false },
                    { name: userData.name, score: 3100, me: true }
                  ].map((s, i) => (
                    <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${s.me ? 'bg-gray-100 border border-gray-200' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-gray-400 w-4">{i + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">{s.name.charAt(0)}</div>
                        <span className={`text-sm font-bold ${s.me ? 'text-black' : 'text-gray-600'}`}>{s.name}</span>
                      </div>
                      <span className="text-sm font-black">{s.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BENTO 5: My Activity Hub */}
              <div className="md:col-span-2 lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
                <h3 className="font-black text-xl mb-4 flex items-center gap-2"><Activity size={20} /> My Activity Hub</h3>
                <div className="flex gap-4 mb-4 border-b border-gray-200 pb-2">
                  <button onClick={() => setActivityTab("assignments")} className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activityTab === "assignments" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"}`}>Assignments</button>
                  <button onClick={() => setActivityTab("quizzes")} className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activityTab === "quizzes" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"}`}>Quiz Results</button>
                </div>
                <div className="flex-1">
                  {activityTab === "assignments" && (
                    <table className="w-full text-left text-sm">
                      <thead><tr className="text-gray-400 font-bold border-b border-gray-100"><th className="pb-2">Task</th><th className="pb-2">Status</th><th className="pb-2">Deadline</th></tr></thead>
                      <tbody>
                        <tr className="border-b border-gray-50"><td className="py-3 font-bold text-gray-800">DS Assignment 1</td><td><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Solved</span></td><td className="text-gray-500 font-medium">14 May 2026</td></tr>
                        <tr><td className="py-3 font-bold text-gray-800">Algo Quiz 2</td><td><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">Pending</span></td><td className="text-gray-500 font-medium">16 May 2026</td></tr>
                      </tbody>
                    </table>
                  )}
                  {activityTab === "quizzes" && <p className="text-sm text-gray-500 py-4 font-medium">No recent quiz results to display.</p>}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB: MY COURSES */}
        {activeTab === "learning" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20">
            <h2 className="text-3xl font-black mb-8">My Enrolled Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {enrolledCourses.map(c => (
                <div key={c.id} className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-lg hover:shadow-xl transition-shadow group flex flex-col h-full">
                  <div className="h-40 bg-gray-100 rounded-xl mb-6 overflow-hidden relative border border-gray-200">
                    {c.image_url ? <img src={c.image_url} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><BookOpen size={40} /></div>}
                    <div className="absolute top-3 right-3 bg-black text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Active</div>
                  </div>
                  <h3 className="text-xl font-black mb-2 leading-tight">{c.title}</h3>
                  <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-2 flex-1">{c.description || "Course description goes here."}</p>
                  <button onClick={() => navigate(`/course/${c.id}/player`)} className="w-full bg-black text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
                    <PlayCircle size={18} /> Resume Journey
                  </button>
                </div>
              ))}
              {enrolledCourses.length === 0 && <p className="col-span-full text-center text-gray-500 font-bold py-20">You are not enrolled in any courses yet.</p>}
            </div>
          </motion.div>
        )}

        {/* TAB: CODE ARENA */}
        {activeTab === "test" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20">
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black mb-2">SkillForge Arena</h2>
                <p className="text-gray-500 font-medium">Proctored challenges and assessments.</p>
              </div>
            </div>

            <div className="space-y-4">
              {codeTests.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-12 text-center shadow-sm">
                  <Terminal size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-lg font-bold text-gray-500">No active challenges available right now.</p>
                </div>
              ) : (
                codeTests.map(test => (
                  <div key={test.id} className="bg-white/80 backdrop-blur-xl border border-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-xl font-black mb-2">{test.title}</h3>
                      <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Clock size={14} /> {test.time_limit} Mins</span>
                        <span className="flex items-center gap-1"><Code size={14} /> Standard</span>
                      </div>
                    </div>
                    <button onClick={() => setShowPassKeyModal(test.id)} className="bg-black text-white px-8 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg whitespace-nowrap">
                      Enter Arena
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* TAB: CERTIFICATES */}
        {activeTab === "certificates" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20">
            <div className="mb-8">
              <h2 className="text-3xl font-black mb-2">My Certifications</h2>
              <p className="text-gray-500 font-medium">Track your completed courses and claim your rewards.</p>
            </div>

            <div className="space-y-4">
              {enrolledCourses.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-12 text-center shadow-sm">
                  <Award size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-lg font-bold text-gray-500">You haven't enrolled in any courses yet.</p>
                </div>
              ) : (
                enrolledCourses.map((course: any) => {
                  // Check if progress is 100
                  const isComplete = course.progress === 100;

                  return (
                    <div key={course.id} className="bg-white/80 backdrop-blur-xl border border-white rounded-[1.5rem] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                          {course.image_url ? <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" /> : <BookOpen size={24} className="m-auto mt-4 text-gray-300" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-gray-900">{course.title}</h3>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-black'}`} style={{ width: `${course.progress || 0}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-gray-500">{course.progress || 0}% Complete</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => isComplete && handleDownloadCertificate(course.id, course.title)}
                        disabled={!isComplete}
                        className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all min-w-[200px] ${isComplete ? 'bg-green-500 text-white hover:bg-green-600 shadow-md' : 'bg-red-50 text-red-400 border border-red-100 cursor-not-allowed'}`}
                      >
                        {isComplete ? <><Unlock size={18} /> Claim Certificate</> : <><Lock size={18} /> Locked</>}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}

        {/* TAB: EXPLORE COURSES */}
        {activeTab === "explore" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20">
            <h2 className="text-3xl font-black mb-8">Explore Catalog</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableCourses.map(c => (
                <div key={c.id} className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
                  <div className="h-40 bg-gray-100 rounded-xl mb-6 overflow-hidden border border-gray-200 flex items-center justify-center text-gray-300">
                    {c.image_url ? <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" /> : <BookOpen size={40} />}
                  </div>
                  <h3 className="text-xl font-black mb-2 leading-tight">{c.title}</h3>
                  <div className="flex justify-between items-center mt-auto pt-4">
                    <span className="text-2xl font-black">₹{c.price}</span>
                    <button onClick={() => openEnrollModal(c)} className="bg-black text-white font-bold py-2 px-5 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
                      <ShoppingBag size={16} /> Enroll
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto pb-20">
            <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-10 shadow-lg">
              <h2 className="text-2xl font-black mb-2">Account Settings</h2>
              <p className="text-gray-500 font-medium mb-8">Manage your security and preferences.</p>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setSavingSettings(true);
                  const token = localStorage.getItem("token");
                  await axios.post(`${API_BASE_URL}/user/change-password`, { new_password: newPassword }, { headers: { Authorization: `Bearer ${token}` } });
                  triggerToast("Password Updated Successfully!", "success");
                  setNewPassword("");
                } catch (err) {
                  triggerToast("Failed to update password.", "error");
                } finally {
                  setSavingSettings(false);
                }
              }}>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                  <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" />
                </div>
                <button type="submit" disabled={savingSettings} className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 disabled:opacity-70 transition-colors">
                  {savingSettings ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </motion.div>
        )}

      </main>

      {/* ============================================================================
          MODALS & TOASTS
      ============================================================================ */}

      {/* PassKey Modal */}
      <AnimatePresence>
        {showPassKeyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white p-10 rounded-[2rem] w-full max-w-md shadow-2xl text-center border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><Lock size={24} className="text-black" /></div>
              <h3 className="text-2xl font-black mb-2">Arena Access Key</h3>
              <p className="text-gray-500 text-sm font-medium mb-8">This assessment is protected. Enter the key provided by your instructor.</p>
              <input type="password" value={passKeyInput} onChange={e => setPassKeyInput(e.target.value)} placeholder="Enter key..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-center font-mono text-xl tracking-widest font-bold focus:outline-none focus:border-black mb-6" />
              <div className="flex gap-3">
                <button onClick={() => setShowPassKeyModal(null)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                <button onClick={handleStartTest} className="flex-1 py-4 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-colors">Verify & Start</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enrollment Modal */}
      <AnimatePresence>
        {showModal && selectedCourse && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white p-10 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-gray-100 relative">
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-600" /></button>

              <h2 className="text-3xl font-black mb-2 pr-10">{selectedCourse.title}</h2>
              <p className="text-gray-500 font-medium mb-8">Unlock full lifetime access to this course.</p>

              {/* Trial Banner */}
              <div className="border border-green-200 bg-green-50 rounded-2xl p-6 relative mb-8">
                <div className="absolute -top-3 right-6 bg-green-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">Recommended</div>
                <div className="flex items-center gap-3 mb-3 text-green-800"> <Clock size={20} /> <h3 className="text-lg font-black">7-Day Free Trial</h3> </div>
                <p className="text-sm text-green-700 font-medium mb-6 leading-relaxed">Experience the full curriculum, interactive IDE, and auto-grading with zero commitment.</p>
                <button onClick={handleTrialParams} disabled={processing} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all disabled:opacity-70">
                  {processing ? "Activating..." : "Start Free Trial"}
                </button>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-gray-200"></div><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span><div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <button onClick={() => handlePayment(selectedCourse.id, selectedCourse.price)} className="w-full py-4 rounded-xl border-2 border-black font-black text-black flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all">
                <CreditCard size={20} /> Buy Lifetime Access (₹{selectedCourse.price})
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLASSMORPHIC TOAST */}
      <GlassToast toast={{ show: toast.show, msg: toast.message || '', type: toast.type as "success" | "error", id: 0 }} />

    </div>
  );
};

export default StudentDashboard;