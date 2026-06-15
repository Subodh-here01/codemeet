import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";


function Notepad({ socket, roomId }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    // socket.emit("joinRoom", roomId);

    socket.on("recieve-text", (data) => {
      setValue(data);
    });

    return () => {
      socket.emit("leaveRoom", roomId);
      socket.disconnect();
    };
  }, [roomId]);

  const handleChange = (newValue) => {
    setValue(newValue);
    socket.emit("text-change", { room: roomId, data: newValue });
  };

  return (
    <div className="flex-1 mx-2 h-full flex flex-col p-2">
      <p className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Shared Interviewer Notes</p>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        className="flex-1 text-slate-100 overflow-hidden"
      />
    </div>
  );
}

export default Notepad;
