// src/utils/pyodideEnv.ts

declare global {
  interface Window {
    loadPyodide: any;
  }
}

let pyodideInstance: any = null;

export const loadPyodideEnv = async () => {
  // If it's already loaded, return the instance immediately
  if (pyodideInstance) return pyodideInstance;

  try {
    // Dynamically inject the Pyodide script into the HTML head
    if (!window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Initialize the Pyodide WebAssembly environment
    pyodideInstance = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
    });
    
    return pyodideInstance;
  } catch (error) {
    console.error("Failed to load Pyodide WebAssembly:", error);
    throw error;
  }
};

export const runPythonLocally = async (code: string) => {
  try {
    const pyodide = await loadPyodideEnv();
    
    // Redirect Python's standard output so we can capture print() statements
    pyodide.runPython(`
      import sys
      import io
      sys.stdout = io.StringIO()
    `);

    // Run the user's code
    pyodide.runPython(code);

    // Fetch the captured stdout back to JavaScript
    const output = pyodide.runPython("sys.stdout.getvalue()");
    
    return { success: true, output: output || "Execution complete. No output." };
  } catch (error: any) {
    // Catch syntax errors and runtime exceptions
    return { success: false, error: error.message || String(error) };
  }
};