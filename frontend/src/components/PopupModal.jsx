import React, { useContext, useState, useEffect } from "react";
import { DataContext } from "../context/DataProvider";
import { FaCopy } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function PopupModal() {
  const { setStatus, peerId, roomId, setRoomId } = useContext(DataContext);
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && peerId) {
      setRoomId(peerId);
    }
  }, [isOpen, peerId, setRoomId]);

  const openModal = () => {
    setStatus("interviewer");
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);
  const closeModalAndJoin = () => {
    setIsOpen(false);
    navigate("/room");
  };

  return (
    <div>
      <button
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 transition-all text-base"
        onClick={openModal}
      >
        Start an Interview
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md text-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold tracking-tight uppercase text-slate-200">Interview Room Ready</h2>
              <button
                className="text-slate-400 hover:text-slate-200 text-2xl transition-all"
                onClick={closeModal}
              >
                &times;
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Share this Room ID with candidate</p>
            <div className="mb-6 flex items-center justify-between bg-slate-950 border border-slate-850 p-3 rounded-xl">
              <p className="text-lg font-mono font-bold text-blue-400 select-all">
                {roomId.length ? roomId : "Generating ID..."}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                }}
                className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-900 rounded-lg transition-all"
                title="Copy Room ID"
              >
                <FaCopy className="text-base" />
              </button>
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
                Start Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PopupModal;
