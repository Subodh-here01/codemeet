import React, { useContext, useState, useEffect } from "react";
import { DataContext } from "../context/DataProvider";
import { useNavigate } from "react-router-dom";

function InputModal() {
  const { setStatus, setRoomId, roomId, socket, user } = useContext(DataContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const openModal = () => {
    setIsOpen(true);
    setErrorMsg("");
    setIsWaiting(false);
  };
  
  const closeModal = () => {
    setIsOpen(false);
    setIsWaiting(false);
    setErrorMsg("");
  };

  const closeModalAndJoin = () => {
    if (!roomId || !roomId.trim()) {
      setErrorMsg("Please enter a valid Room ID.");
      return;
    }
    setIsWaiting(true);
    setErrorMsg("");
    setStatus("guest");

    // Send join request to the host
    socket.emit("request-join", { room: roomId, username: user || "Guest User" });
  };

  useEffect(() => {
    if (!socket) return;

    const handleApproved = () => {
      setIsWaiting(false);
      setIsOpen(false);
      navigate("/room");
    };

    const handleDenied = () => {
      setIsWaiting(false);
      setErrorMsg("The host has declined your request to join the meeting.");
    };

    const handleFull = () => {
      setIsWaiting(false);
      setErrorMsg("This meeting room is already full (maximum 2 participants).");
    };

    socket.on("join-approved", handleApproved);
    socket.on("join-denied", handleDenied);
    socket.on("join-full", handleFull);

    return () => {
      socket.off("join-approved", handleApproved);
      socket.off("join-denied", handleDenied);
      socket.off("join-full", handleFull);
    };
  }, [socket, navigate]);

  return (
    <div>
      <button
        className="bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold px-6 py-3 rounded-xl shadow-lg active:scale-95 transition-all text-base"
        onClick={openModal}
      >
        Join Meeting Room
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md text-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold tracking-tight uppercase text-slate-200">
                {isWaiting ? "Waiting for Approval" : "Join Room"}
              </h2>
              {!isWaiting && (
                <button
                  className="text-slate-400 hover:text-slate-200 text-2xl transition-all"
                  onClick={closeModal}
                >
                  &times;
                </button>
              )}
            </div>

            {isWaiting ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-semibold text-slate-300 mb-1">Waiting for host approval...</p>
                <p className="text-xs text-slate-500">The host of room <span className="font-mono text-blue-400 font-bold">{roomId}</span> has been notified.</p>
                <button
                  className="mt-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs transition-all"
                  onClick={() => setIsWaiting(false)}
                >
                  Cancel Request
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Enter Room ID</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-700/60 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold font-mono"
                    placeholder="Paste Room ID here..."
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                  {errorMsg && (
                    <p className="text-rose-400 text-xs mt-2 font-semibold">{errorMsg}</p>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95"
                    onClick={closeModalAndJoin}
                  >
                    Join Meeting
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InputModal;
