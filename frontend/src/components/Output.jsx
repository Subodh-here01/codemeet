import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

function Output({ language, version, value, socket, roomId }) {
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);

  // Map languages to Judge0 language IDs
  const languageMap = {
    c: 50,
    cpp: 54,
    java: 62,
    python: 71,
    javascript: 63,
    typescript: 74,
  };

  const requiresInput = (code, lang) => {
    if (!code) return false;
    const lowerCode = code.toLowerCase();
    switch (lang) {
      case "c":
        return lowerCode.includes("scanf") || lowerCode.includes("getchar") || lowerCode.includes("gets") || lowerCode.includes("fgets");
      case "cpp":
        return lowerCode.includes("cin") || lowerCode.includes("getline");
      case "java":
        return lowerCode.includes("scanner") || lowerCode.includes("system.in") || lowerCode.includes("bufferedreader") || lowerCode.includes("readline");
      case "python":
        return lowerCode.includes("input(") || lowerCode.includes("sys.stdin");
      case "javascript":
      case "typescript":
        return lowerCode.includes("prompt") || lowerCode.includes("readline");
      default:
        return false;
    }
  };

  const handleRun = async (bypassPrompt = false) => {
    if (!value.trim()) {
      setOutput("Please write some code first");
      return;
    }

    if (!bypassPrompt && requiresInput(value, language) && !input.trim()) {
      setShowPrompt(true);
      return;
    }

    setShowPrompt(false);
    setLoading(true);
    setError("");
    
    try {
      console.log("Sending code execution request to backend");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/execute/code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          version,
          code: value,
          input,
        }),
      });

      const data = await res.json();
      console.log("Response from backend:", data);

      if (!res.ok) {
        throw new Error(data.error || `Execution failed: ${res.statusText}`);
      }

      setOutput(data.output || "(No output)");
      socket.emit("output-change", {
        room: roomId,
        data: data.output || "(No output)",
      });
    } catch (error) {
      console.error("Error executing code:", error);
      const errorMessage = `Error: ${error.message}`;
      setError(errorMessage);
      setOutput(errorMessage);
      socket.emit("output-change", {
        room: roomId,
        data: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  function handleChange(event) {
    const newValue = event.target.value;
    setInput(newValue);
    socket.emit("input-change", { room: roomId, data: newValue });
  }

  useEffect(() => {
    if (!socket) return;

    socket.on("recieve-input", (data) => {
      setInput(data);
    });

    socket.on("recieve-output", (data) => {
      setOutput(data);
    });

    return () => {
      socket.off("recieve-input");
      socket.off("recieve-output");
    };
  }, [socket, roomId]);

  return (
    <div className="flex flex-col w-full py-4 px-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Execution Panel</h3>
        <button
          className="text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 px-5 py-2 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          onClick={handleRun}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Running...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4 text-white fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Run Code</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Stdin Input</label>
          <textarea
            className="h-20 w-full outline-none border border-slate-700 rounded-xl shadow-lg p-3 bg-slate-900 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all text-sm font-mono"
            value={input}
            onChange={handleChange}
            placeholder="Provide standard input (stdin) for your program here..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Console Output</label>
          <div className="h-40 w-full border border-slate-700 rounded-xl shadow-lg bg-slate-950 p-3 overflow-auto font-mono text-sm text-slate-200">
            {error ? (
              <span className="text-rose-400 whitespace-pre-wrap">{output}</span>
            ) : output ? (
              <span className="text-emerald-400 whitespace-pre-wrap">{output}</span>
            ) : (
              <span className="text-slate-500 italic">No output yet. Click 'Run Code' above to execute.</span>
            )}
          </div>
        </div>
      </div>

      {showPrompt && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl p-6 shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-100 mb-2">Input Required</h3>
            <p className="text-xs text-slate-400 mb-4">
              Your code contains input statements (e.g. scanf, cin, input). Please provide the standard input (stdin) for execution:
            </p>
            <textarea
              className="h-28 w-full outline-none border border-slate-700 rounded-xl p-3 bg-slate-950 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all text-sm font-mono mb-4"
              value={input}
              onChange={handleChange}
              placeholder="Enter stdin input here..."
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPrompt(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 border border-slate-700 hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRun(true)}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-500/20 transition-all"
              >
                Run Code
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Output;
