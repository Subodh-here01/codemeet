import { useContext, useEffect, useRef } from "react";
import Peer from "peerjs";
import { DataContext } from "../context/DataProvider";
import Notepad from "./Notepad";
import CodeEditor from "./CodeEditor";

function AudioVideoScreen() {
  const { roomId, peerInstance, status, socket } = useContext(DataContext);
  const remoteVideoRef = useRef(null);
  const currentUserVideoRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("connected", socket.id);
    });

    socket.emit("joinRoom", roomId);

    if (!peerInstance.current) {
      peerInstance.current = new Peer();
    }

    let localStream = null;

    // Request local camera and microphone stream immediately on mount for both roles
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        localStream = mediaStream;
        if (currentUserVideoRef.current) {
          currentUserVideoRef.current.srcObject = mediaStream;
          currentUserVideoRef.current.play().catch((err) => {
            console.error("Error playing local video:", err);
          });
        }

        // If this user is the interviewee, initiate the call to the interviewer (roomId)
        if (status === "interviewee") {
          const call = peerInstance.current.call(roomId, mediaStream);
          call.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play().catch((err) => {
                console.error("Error playing remote video:", err);
              });
            }
          });
        }
      })
      .catch((err) => {
        console.error("Failed to get local stream", err);
      });

    // Listen for incoming calls (interviewer answers interviewee)
    const handleIncomingCall = (incomingCall) => {
      if (localStream) {
        incomingCall.answer(localStream);
        incomingCall.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch((err) => {
              console.error("Error playing remote video:", err);
            });
          }
        });
      } else {
        // Fallback: if local stream wasn't ready yet, request it and answer
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((mediaStream) => {
            localStream = mediaStream;
            if (currentUserVideoRef.current) {
              currentUserVideoRef.current.srcObject = mediaStream;
              currentUserVideoRef.current.play().catch((err) => {
                console.error("Error playing local video:", err);
              });
            }
            incomingCall.answer(mediaStream);
            incomingCall.on("stream", (remoteStream) => {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
                remoteVideoRef.current.play().catch((err) => {
                  console.error("Error playing remote video:", err);
                });
              }
            });
          })
          .catch((err) => {
            console.error("Failed to get local stream during incoming call:", err);
          });
      }
    };

    peerInstance.current.on("call", handleIncomingCall);

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerInstance.current) {
        peerInstance.current.off("call", handleIncomingCall);
        peerInstance.current.destroy();
        peerInstance.current = null;
      }
    };
  }, [roomId, status, peerInstance, socket]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      {/* Header / Navbar */}
      <header className="flex items-center justify-between px-12 py-4 border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">CodeMeet</h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider -mt-0.5">Collaborative Interview</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Room:</span>
            <span className="text-xs font-mono font-bold text-blue-400 select-all">{roomId}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role:</span>
            <span className={`text-xs font-bold uppercase tracking-wider ${status === "interviewer" ? "text-indigo-400" : "text-emerald-400"}`}>
              {status}
            </span>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900/50 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/50 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
          >
            Leave Room
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full gap-6">
        {/* Top Section: Videos and Notepad */}
        <div className="flex flex-col md:flex-row w-full gap-6 items-stretch min-h-[260px]">
          {/* User Video */}
          <div className="w-full md:w-1/3 flex flex-col">
            <span className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Your Camera</span>
            <div className="flex-1 relative rounded-2xl border border-slate-800/80 bg-slate-950/60 overflow-hidden shadow-xl aspect-video md:aspect-auto flex items-center justify-center min-h-[200px]">
              <video
                ref={currentUserVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {/* Overlay Badge */}
              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/60 text-[10px] font-bold text-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                You (Local)
              </div>
            </div>
          </div>

          {/* Notepad */}
          <div className="w-full md:w-1/3 flex flex-col bg-slate-900/30 border border-slate-800/60 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
            <Notepad socket={socket} roomId={roomId} />
          </div>

          {/* Remote Video */}
          <div className="w-full md:w-1/3 flex flex-col">
            <span className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Peer Camera</span>
            <div className="flex-1 relative rounded-2xl border border-slate-800/80 bg-slate-950/60 overflow-hidden shadow-xl aspect-video md:aspect-auto flex items-center justify-center min-h-[200px]">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Overlay Badge */}
              <div className="absolute bottom-3 left-3 bg-indigo-950/90 backdrop-blur-md border border-indigo-900/60 text-[10px] font-bold text-indigo-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Peer (Remote)
              </div>
              {/* Placeholder when video is not active */}
              {(!remoteVideoRef.current || !remoteVideoRef.current.srcObject) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-400 animate-pulse mb-2">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold tracking-wide uppercase">Waiting for peer stream...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Code Editor */}
        <div className="flex-1 flex flex-col">
          <CodeEditor socket={socket} roomId={roomId} />
        </div>
      </main>
    </div>
  );
}

export default AudioVideoScreen;
