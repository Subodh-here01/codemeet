import React, { useEffect, useRef, useState } from "react";
import Editor, { DiffEditor, useMonaco, loader } from "@monaco-editor/react";
import LanguageDropdown from "./LanguageDropdown";
import Output from "./Output";

function CodeEditor({ socket, roomId }) {
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("c");
  const [version, setVersion] = useState("10.2.0");

  const editorRef = useRef(null);

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
    editor.focus();
  }

  function handleEditorChange(value, event) {
    setValue(value);
    socket.emit("message", { room: roomId, data: value });
  }

  useEffect(() => {
    socket.on("recieve-message", (data) => {
      setValue(data);
    });

    socket.on("recieve-language", ({ language, version }) => {
      setLanguage(language);
      setVersion(version);
    });

    socket.on("welcome", (s) => {
      console.log(s);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6 px-12 pb-12 mt-6">
      {/* Editor Panel Card */}
      <div className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-2xl p-5 shadow-2xl backdrop-blur-sm flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3.5 w-3.5 items-center justify-center relative">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Interactive Code Editor</h2>
          </div>
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
