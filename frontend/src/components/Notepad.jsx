import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

function Notepad({ socket, roomId }) {
  const [value, setValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!socket) return;

    // Request notes synchronization on mount
    socket.emit("request-notes-sync", roomId);

    socket.on("recieve-text", (data) => {
      setValue(data);
    });

    socket.on("request-notes-sync", () => {
      socket.emit("sync-notes", { room: roomId, data: valueRef.current });
    });

    socket.on("sync-notes", (data) => {
      setValue(data);
    });

    return () => {
      socket.off("recieve-text");
      socket.off("request-notes-sync");
      socket.off("sync-notes");
    };
  }, [roomId, socket]);

  const handleChange = (newValue) => {
    setValue(newValue);
    socket.emit("text-change", { room: roomId, data: newValue });
  };

  const content = (
    <div className={isExpanded ? "w-[50vw] h-[75vh] bg-slate-900 border border-slate-700/60 rounded-3xl p-6 shadow-2xl flex flex-col relative text-slate-100 ql-expanded-notes" : "flex-grow flex flex-col h-full"}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
        <p className={isExpanded ? "text-sm font-semibold text-slate-200 uppercase tracking-wider" : "text-xs font-semibold text-slate-400 uppercase tracking-wider"}>
          {isExpanded ? "Shared Interviewer Notes (Focus Mode)" : "Shared Interviewer Notes"}
        </p>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all active:scale-95"
          title={isExpanded ? "Close Focus Mode" : "Expand Notes (Focus Mode)"}
        >
          {isExpanded ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          )}
        </button>
      </div>

      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        preserveWhitespace={true}
        className="flex-1 text-slate-100 overflow-hidden"
      />
    </div>
  );

  if (isExpanded) {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        {content}
      </div>,
      document.body
    );
  }

  return content;
}

export default Notepad;
