import { useState, useEffect } from "react";
import axios from "axios";

import { 
  Play, CheckCircle, XCircle, AlertTriangle, 
  ChevronLeft, ChevronRight, Clock, RefreshCw 
} from "lucide-react";

// --- ⚙️ JUDGE0 API CONFIG ---
// ⚠️ GET A FREE KEY HERE: https://rapidapi.com/judge0-official/api/judge0-ce
const JUDGE0_API_KEY = "YOUR_RAPID_API_KEY_HERE"; 
const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions";

export const CodeTestPreview = ({ lesson }: { lesson: any }) => {
  // Parsing the stored JSON config from the backend
  const config = lesson.test_config ? (typeof lesson.test_config === "string" ? JSON.parse(lesson.test_config) : lesson.test_config) : { difficulty: "Easy", timeLimit: 1000, testCases: [] };
  
  // State
  const [code, setCode] = useState("// Write your code here (Node.js)...\n// Use console.log() to print output\n\nfunction solution(input) {\n  const [a, b] = input.split(' ');\n  console.log(parseInt(a) + parseInt(b));\n}\n\n// Reading stdin for Judge0\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8');\nif (input) solution(input);");
  const [consoleOutput, setConsoleOutput] = useState("Output will appear here after running your code...");
  const [activeTab, setActiveTab] = useState<"input" | "expected">("input");
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  // 🏃 RUN CODE (Single Execution)
  const runCode = async () => {
    if (!config.testCases.length) return alert("No test cases defined.");
    setIsRunning(true);
    setConsoleOutput("Compiling & Executing...");

    const currentCase = config.testCases[activeCaseIndex];
    
    try {
      const result = await executeJudge0(code, currentCase.input);
      setConsoleOutput(result.stdout || result.stderr || result.compile_output || "No output");
    } catch (err: any) {
      setConsoleOutput(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // 🧪 RUN ALL TESTS (Batch Execution)
  const runAllTests = async () => {
    setIsRunning(true);
    setConsoleOutput("Running all test cases...");
    const results = [];

    for (let i = 0; i < config.testCases.length; i++) {
      const tc = config.testCases[i];
      try {
        const res = await executeJudge0(code, tc.input);
        const actual = (res.stdout || "").trim();
        const expected = (tc.output || "").trim();
        const passed = actual === expected;
        results.push({ passed, actual, expected, input: tc.input });
      } catch (err) {
        results.push({ passed: false, actual: "Error", expected: tc.output });
      }
    }
    setTestResults(results);
    setIsRunning(false);
    setConsoleOutput(`Execution Complete. Passed: ${results.filter((r:any) => r.passed).length}/${results.length}`);
  };

  // 🔌 JUDGE0 API HELPER
  const executeJudge0 = async (sourceCode: string, stdin: string) => {
    // 1. Submit Code
    const options = {
      method: 'POST',
      url: JUDGE0_URL,
      params: { base64_encoded: 'true', fields: '*' },
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      data: {
        language_id: 63, // 63 = Node.js, 71 = Python, 62 = Java
        source_code: btoa(sourceCode),
        stdin: btoa(stdin)
      }
    };

    const subRes = await axios.request(options);
    const token = subRes.data.token;

    // 2. Poll for Results
    return new Promise<any>((resolve, reject) => {
        const checkStatus = async () => {
            try {
                const res = await axios.get(`${JUDGE0_URL}/${token}`, {
                    params: { base64_encoded: 'true', fields: '*' },
                    headers: { 'X-RapidAPI-Key': JUDGE0_API_KEY, 'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com' }
                });
                
                if (res.data.status.id <= 2) { // Processing
                    setTimeout(checkStatus, 1000);
                } else { // Finished
                    resolve({
                        stdout: res.data.stdout ? atob(res.data.stdout) : null,
                        stderr: res.data.stderr ? atob(res.data.stderr) : null,
                        compile_output: res.data.compile_output ? atob(res.data.compile_output) : null
                    });
                }
            } catch (err) { reject(err); }
        };
        checkStatus();
    });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", height: "100%", gap: "16px", padding: "16px", background: "#F1F5F9", fontFamily: "'Inter', sans-serif" }}>
      
      {/* 🟦 TOP LEFT: PROBLEM DESCRIPTION */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0" }}>{lesson.title}</h2>
            <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: config.difficulty === "Easy" ? "#16a34a" : config.difficulty === "Medium" ? "#eab308" : "#dc2626", background: "#f0fdf4", padding: "2px 8px", borderRadius: "12px", border: "1px solid currentColor" }}>{config.difficulty.toUpperCase()}</span>
                <span style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}><Clock size={11} /> {config.timeLimit}ms</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6", marginBottom: "24px", whiteSpace: "pre-wrap" }}>
           {lesson.instructions || "No description provided."}
        </div>

        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
           <h4 style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", margin: "0 0 8px 0" }}>TEST CASE {activeCaseIndex + 1}</h4>
           <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
             <button onClick={() => setActiveTab("input")} style={activeTab === "input" ? activeTabStyle : inactiveTabStyle}>Input</button>
             <button onClick={() => setActiveTab("expected")} style={activeTab === "expected" ? activeTabStyle : inactiveTabStyle}>Expected Output</button>
           </div>
           <div style={{ fontFamily: "monospace", fontSize: "13px", color: "#1e293b", background: "white", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", minHeight: "40px" }}>
              {config.testCases[activeCaseIndex] ? (activeTab === "input" ? config.testCases[activeCaseIndex].input : config.testCases[activeCaseIndex].output) : "No test case"}
           </div>
        </div>
      </div>

      {/* ⬛ TOP RIGHT: OUTPUT CONSOLE */}
      <div style={{ ...cardStyle, background: "#1e1e1e", color: "#e2e8f0", display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
            TERMINAL OUTPUT
            {isRunning && <RefreshCw size={14} className="spin" />}
        </h3>
        <div style={{ flex: 1, fontFamily: "'Fira Code', monospace", fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-wrap", overflowY: "auto", color: consoleOutput.includes("Error") ? "#ef4444" : "#4ade80" }}>
            {consoleOutput}
        </div>
      </div>

      {/* 💻 BOTTOM LEFT: CODE EDITOR */}
      <div style={{ ...cardStyle, padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: "#f1f5f9", padding: "8px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>JAVASCRIPT (Node)</span>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>main.js</span>
        </div>
        <textarea 
            value={code} 
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
            style={{ flex: 1, width: "100%", border: "none", padding: "16px", background: "#0f172a", color: "#e2e8f0", fontFamily: "'Fira Code', monospace", fontSize: "14px", lineHeight: "1.6", resize: "none", outline: "none" }} 
        />
      </div>

      {/* 🎛️ BOTTOM RIGHT: TEST CONTROLS */}
      <div style={{ ...cardStyle, display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>Test Results</h3>
        
        <div style={{ flex: 1, overflowY: "auto", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {testResults.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "20px", fontSize: "13px" }}>Run tests to see results</div>
            ) : (
                testResults.map((res, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", background: res.passed ? "#f0fdf4" : "#fef2f2", borderRadius: "8px", border: `1px solid ${res.passed ? "#bbf7d0" : "#fecaca"}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {res.passed ? <CheckCircle size={16} color="#16a34a" /> : <XCircle size={16} color="#dc2626" />}
                            <span style={{ fontSize: "13px", fontWeight: "600", color: res.passed ? "#15803d" : "#b91c1c" }}>Case {idx + 1}</span>
                        </div>
                        {!res.passed && <span style={{ fontSize: "11px", color: "#dc2626" }}>Exp: {res.expected.substring(0, 10)}...</span>}
                    </div>
                ))
            )}
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
            <button onClick={runCode} disabled={isRunning} style={{ ...btnStyle, background: "white", color: "#334155", border: "1px solid #cbd5e1" }}>
               {isRunning ? "..." : <><Play size={14} /> Run Code</>}
            </button>
            <button onClick={runAllTests} disabled={isRunning} style={{ ...btnStyle, background: "#005EB8", color: "white", flex: 1 }}>
               {isRunning ? "Running Tests..." : <><CheckCircle size={14} /> Submit & Test</>}
            </button>
        </div>
      </div>
    </div>
  );
};

// Styles
const cardStyle = { background: "white", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", padding: "20px", overflow: "hidden" };
const activeTabStyle = { padding: "6px 12px", fontSize: "12px", fontWeight: "600", color: "#005EB8", background: "#eff6ff", border: "none", borderRadius: "6px", cursor: "pointer" };
const inactiveTabStyle = { padding: "6px 12px", fontSize: "12px", fontWeight: "500", color: "#64748b", background: "none", border: "none", cursor: "pointer" };
const btnStyle = { padding: "10px 16px", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "opacity 0.2s", border: "none" };