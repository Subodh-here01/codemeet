import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import Editor, { DiffEditor, useMonaco, loader } from "@monaco-editor/react";
import LanguageDropdown from "./LanguageDropdown";
import Output from "./Output";

const BOILERPLATES = {
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n     System.out.println("Hello World");\n    }\n}`,
  python: `def main():\n    print("Hello World")\n\nif __name__ == "__main__":\n    main()`,
  javascript: `function main() {\n    console.log("Hello World");\n}\n\nmain();`,
  typescript: `function main(): void {\n    console.log("Hello World");\n}\n\nmain();`,
};

function CodeEditor({ socket, roomId }) {
  const [language, setLanguage] = useState("c");
  const [value, setValue] = useState(() => BOILERPLATES["c"]);
  const [version, setVersion] = useState("10.2.0");
  const [isExpanded, setIsExpanded] = useState(false);

  const editorRef = useRef(null);
  const valueRef = useRef(value);
  const languageRef = useRef(language);
  const versionRef = useRef(version);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  const handleLanguageChange = (newLanguage, newVersion) => {
    setLanguage(newLanguage);
    setVersion(newVersion);
    const template = BOILERPLATES[newLanguage] || "";
    setValue(template);
    if (socket) {
      socket.emit("message", { room: roomId, data: template });
      socket.emit("change-language", {
        room: roomId,
        data: { language: newLanguage, version: newVersion },
      });
    }
  };

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
    editor.focus();
  }

  function handleEditorChange(value, event) {
    setValue(value);
    socket.emit("message", { room: roomId, data: value });
  }

  useEffect(() => {
    if (!socket) return;

    // Request current code state from any existing peer in the room
    socket.emit("request-code-sync", roomId);

    socket.on("recieve-message", (data) => {
      setValue(data);
    });

    socket.on("recieve-language", ({ language, version }) => {
      setLanguage(language);
      setVersion(version);
    });

    socket.on("request-code-sync", () => {
      socket.emit("sync-code", {
        room: roomId,
        code: valueRef.current,
        language: languageRef.current,
        version: versionRef.current,
      });
    });

    socket.on("sync-code", ({ code, language, version }) => {
      setValue(code);
      setLanguage(language);
      setVersion(version);
    });

    socket.on("welcome", (s) => {
      console.log(s);
    });

    return () => {
      socket.off("recieve-message");
      socket.off("recieve-language");
      socket.off("request-code-sync");
      socket.off("sync-code");
      socket.off("welcome");
    };
  }, [socket, roomId]);

  const handleCardClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 px-12 pb-12 mt-6">
      {/* Editor Panel Card */}
      <div
        className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-2xl p-5 shadow-2xl backdrop-blur-sm flex flex-col transition-all duration-300"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3.5 w-3.5 items-center justify-center relative">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Interactive Code Editor</h2>
          </div>
          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Language:</span>
              <LanguageDropdown
                onLanguageChange={handleLanguageChange}
                lang={language}
                ver={version}
              />
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750 transition-all active:scale-95"
              title="Expand Editor (Focus Mode)"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            </button>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-slate-850 shadow-inner">
          <Editor
            height="50vh"
            theme="vs-dark"
            width="100%"
            language={language}
            value={value}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', Consolas, Monaco, 'Courier New', monospace",
              cursorBlinking: "smooth",
              lineNumbersMinChars: 3,
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>
      </div>

      {/* Expanded Focus Mode Modal (50% of the screen and centered) */}
      {isExpanded && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-[50vw] h-[75vh] bg-slate-900 border border-slate-700/60 rounded-3xl p-6 shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-3.5 w-3.5 items-center justify-center relative">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Interactive Code Editor (Focus Mode)</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Language:</span>
                  <LanguageDropdown
                    langSetter={setLanguage}
                    verSetter={setVersion}
                    socket={socket}
                    lang={language}
                    ver={version}
                    roomId={roomId}
                  />
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-95"
                  title="Close Focus Mode"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden border border-slate-850 shadow-inner">
              <Editor
                height="100%"
                theme="vs-dark"
                width="100%"
                language={language}
                value={value}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'Fira Code', Consolas, Monaco, 'Courier New', monospace",
                  cursorBlinking: "smooth",
                  lineNumbersMinChars: 3,
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Output Panel Card */}
      <div className="w-full lg:w-[450px] bg-slate-900/50 border border-slate-700/50 rounded-2xl p-5 shadow-2xl backdrop-blur-sm flex flex-col">
        <Output
          version={version}
          language={language}
          value={value}
          socket={socket}
          roomId={roomId}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
