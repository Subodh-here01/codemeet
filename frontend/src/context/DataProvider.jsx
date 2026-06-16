import Peer from "peerjs";
import React, {
  useState,
  createContext,
  useEffect,
  useRef,
} from "react";
import { io } from "socket.io-client";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (token) {
      return localStorage.getItem("username") || "User";
    }
    return null;
  });
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState(() => {
    return sessionStorage.getItem("meet_status") || "";
  });
  const [roomId, setRoomId] = useState(() => {
    return sessionStorage.getItem("meet_roomId") || "";
  });
  const [peerId, setPeerId] = useState("");
  const peerInstance = useRef(null);

  useEffect(() => {
    if (status === "") {
      sessionStorage.removeItem("meet_status");
    } else {
      sessionStorage.setItem("meet_status", status);
    }
  }, [status]);

  useEffect(() => {
    if (roomId === "") {
      sessionStorage.removeItem("meet_roomId");
    } else {
      sessionStorage.setItem("meet_roomId", roomId);
    }
  }, [roomId]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
    });

    setSocket(socket);

    const savedStatus = sessionStorage.getItem("meet_status");
    const savedRoomId = sessionStorage.getItem("meet_roomId");
    const peerIdToUse = (savedStatus === "interviewer" && savedRoomId) ? savedRoomId : undefined;

    const peer = new Peer(peerIdToUse, {
      config: {
        iceServers: [
          { urls: "stun:openrelay.metered.ca:80" },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ],
      },
    });

    peer.on("open", (id) => {
      setPeerId(id);
    });

    peer.on("error", (err) => {
      console.error("DataProvider PeerJS error:", err);
    });

    peerInstance.current = peer;
  }, []);

  return (
    <DataContext.Provider
      value={{
        user,
        setUser,
        status,
        setStatus,
        roomId,
        setRoomId,
        peerInstance,
        peerId,
        setPeerId,
        socket,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
