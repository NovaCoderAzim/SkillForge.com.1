// src/utils/pyodideEnv.ts
// ═══════════════════════════════════════════════════════════════
// Pyodide WebAssembly Python Runner
// KEY FIX: Mock sys.stdin with the sample input lines so that
//   student code using input() does NOT trigger OSError [Errno 29]
//   (which happens when the browser has no real stdin to read).
// ═══════════════════════════════════════════════════════════════

declare global {
  interface Window {
    loadPyodide: any;
  }
}

let pyodideInstance: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

// ─────────────────────────────────────────────────────────────
// Singleton loader – only downloads Pyodide WASM once per page
// ─────────────────────────────────────────────────────────────
export const loadPyodideEnv = async (): Promise<any> => {
  if (pyodideInstance) return pyodideInstance;

  // Prevent concurrent loads
  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = (async () => {
    try {
      if (!window.loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          // pinning to a stable Pyodide release
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      pyodideInstance = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
        // Suppress the giant stdout banner automatically shown by Pyodide
        stdout: () => { },
        stderr: () => { },
      });

      return pyodideInstance;
    } catch (error) {
      pyodideLoadingPromise = null; // Allow retry on failure
      console.error('Failed to load Pyodide WebAssembly:', error);
      throw error;
    }
  })();

  pyodideInstance = await pyodideLoadingPromise;
  return pyodideInstance;
};

// ─────────────────────────────────────────────────────────────
// Main execution function
//  @param code       – Python source code string from the editor
//  @param stdinData  – The sample input to feed to input() calls
//                      (provide the test-case "input" field here)
// ─────────────────────────────────────────────────────────────
export const runPythonLocally = async (
  code: string,
  stdinData: string = ''
): Promise<{ success: boolean; output: string; error: string }> => {
  try {
    const pyodide = await loadPyodideEnv();

    // 1. Build a safe wrapper that:
    //    - Redirects stdout/stderr so we can capture print()
    //    - Mocks sys.stdin with the provided sample input lines
    //      so that input() / sys.stdin.read() work without I/O errors
    const setupCode = `
import sys, io

# ── Capture stdout ──────────────────────────────────────────
_captured_stdout = io.StringIO()
sys.stdout = _captured_stdout

# ── Mock stdin with the provided sample input ──────────────
# Each input() call pops the next line from this buffer.
_stdin_data = ${JSON.stringify(stdinData)}
sys.stdin = io.StringIO(_stdin_data)

# ── Swallow stderr so errors reach JS cleanly ──────────────
_captured_stderr = io.StringIO()
sys.stderr = _captured_stderr
`;

    pyodide.runPython(setupCode);

    // 2. Execute the student's code
    pyodide.runPython(code);

    // 3. Collect output
    const output: string = pyodide.runPython('_captured_stdout.getvalue()');
    const errOutput: string = pyodide.runPython('_captured_stderr.getvalue()');

    return {
      success: true,
      output: output || errOutput || 'Execution complete — no output.',
      error: '',
    };
  } catch (error: any) {
    // Pyodide raises PythonError for runtime / syntax errors
    const message: string =
      error?.message || String(error) || 'Unknown Pyodide error';

    return {
      success: false,
      output: '',
      // Strip the internal JS stack — show only the Python traceback
      error: message.split('\n  File "<exec>"')[0] || message,
    };
  }
};