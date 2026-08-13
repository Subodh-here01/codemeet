import { useContext, useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { DataContext } from "../context/DataProvider";
import { useNavigate } from "react-router-dom";
import Notepad from "./Notepad";
import CodeEditor from "./CodeEditor";

function AudioVideoScreen() {
  const { roomId, setRoomId, peerInstance, status, setStatus, socket, setPeerId, user } = useContext(DataContext);
  const navigate = useNavigate();
  const remoteVideoRef = useRef(null);
  const currentUserVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const activeCallRef = useRef(null);
  const localStreamPromiseRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [streamError, setStreamError] = useState("");
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [showRoomId, setShowRoomId] = useState(false);
  const [remoteUsername, setRemoteUsername] = useState("Peer");
  const [pendingJoinRequest, setPendingJoinRequest] = useState(null);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach((track) => {
          track.enabled = !track.enabled;
        });
        setIsMuted(!audioTracks[0]?.enabled);
      } else {
        setIsMuted(!isMuted);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !isMuted });
        localStreamRef.current = stream;
        setStreamError("");
        setIsVideoOff(false);

        if (currentUserVideoRef.current) {
          currentUserVideoRef.current.srcObject = stream;
          currentUserVideoRef.current.play().catch((err) => console.error("Error playing local video:", err));
        }

        if (activeCallRef.current && activeCallRef.current.peerConnection) {
          const newTrack = stream.getVideoTracks()[0];
          const transceivers = activeCallRef.current.peerConnection.getTransceivers();
          const videoTransceiver = transceivers.find(t => t.receiver && t.receiver.track && t.receiver.track.kind === 'video');
          let videoSender = videoTransceiver ? videoTransceiver.sender : null;
          if (!videoSender) {
            const senders = activeCallRef.current.peerConnection.getSenders();
            videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
          }
          if (videoSender && newTrack) {
            await videoSender.replaceTrack(newTrack);
          }
        }
        return;
      } catch (err) {
        console.error("Failed to acquire stream in toggleVideo:", err);
        setStreamError(err.message || "Failed to access camera.");
        return;
      }
    }

    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0 && !isVideoOff) {
      const track = videoTracks[0];
      track.stop();
      localStreamRef.current.removeTrack(track);

      if (activeCallRef.current && activeCallRef.current.peerConnection) {
        try {
          const transceivers = activeCallRef.current.peerConnection.getTransceivers();
          const videoTransceiver = transceivers.find(t => t.receiver && t.receiver.track && t.receiver.track.kind === 'video');
          let videoSender = videoTransceiver ? videoTransceiver.sender : null;
          if (!videoSender) {
            const senders = activeCallRef.current.peerConnection.getSenders();
            videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
          }
          if (videoSender) {
            await videoSender.replaceTrack(null);
          }
        } catch (err) {
          console.error("Error replacing track with null:", err);
        }
      }
      setIsVideoOff(true);
    } else {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = tempStream.getVideoTracks()[0];

        localStreamRef.current.getVideoTracks().forEach((t) => {
          t.stop();
          localStreamRef.current.removeTrack(t);
        });

        localStreamRef.current.addTrack(newTrack);

        if (activeCallRef.current && activeCallRef.current.peerConnection) {
          try {
            const transceivers = activeCallRef.current.peerConnection.getTransceivers();
            const videoTransceiver = transceivers.find(t => t.receiver && t.receiver.track && t.receiver.track.kind === 'video');
            let videoSender = videoTransceiver ? videoTransceiver.sender : null;
            if (!videoSender) {
              const senders = activeCallRef.current.peerConnection.getSenders();
              videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
            }
            if (videoSender) {
              await videoSender.replaceTrack(newTrack);
            } else {
              activeCallRef.current.peerConnection.addTrack(newTrack, localStreamRef.current);
            }
          } catch (err) {
            console.error("Error replacing track with new track:", err);
          }
        }

        if (currentUserVideoRef.current) {
          currentUserVideoRef.current.srcObject = localStreamRef.current;
          currentUserVideoRef.current.play().catch((err) => {
            console.error("Error playing local video:", err);
          });
        }
        setIsVideoOff(false);
      } catch (err) {
        console.error("Failed to re-acquire camera stream:", err);
        setStreamError(err.message || "Failed to access camera.");
      }
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log("connected", socket.id);
      socket.emit("joinRoom", { room: roomId, status: status });
    };

    socket.on("connect", handleConnect);

    if (socket.connected) {
      handleConnect();
    }

    if (!peerInstance.current || peerInstance.current.destroyed) {
      const peerIdToUse = (status === "host" && roomId) ? roomId : undefined;
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
        console.error("AudioVideoScreen PeerJS error:", err);
      });
      peerInstance.current = peer;
    }

    const getLocalStream = async () => {
      try {
        let mediaStream = null;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (err) {
          console.warn("Failed to get video and audio, trying video-only...", err);
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          } catch (err2) {
            console.warn("Failed to get video-only, trying audio-only...", err2);
            try {
              mediaStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
              setIsVideoOff(true);
            } catch (err3) {
              if (err.name === "NotReadableError" || err.message?.includes("Could not start video source")) {
                throw new Error("Webcam is locked by another window/app (exclusive lock on Linux). Try turning off the camera in the other tab first.");
              }
              throw new Error("Could not access camera or microphone. Please check your browser permissions.");
            }
          }
        }

        localStreamRef.current = mediaStream;
        setStreamError("");

        mediaStream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted;
        });
        mediaStream.getVideoTracks().forEach((track) => {
          track.enabled = !isVideoOff;
        });

        if (currentUserVideoRef.current) {
          currentUserVideoRef.current.srcObject = mediaStream;
          currentUserVideoRef.current.play().catch((err) => {
            console.error("Error playing local video:", err);
          });
        }

        if (peerInstance.current && peerInstance.current.id) {
          socket.emit("peer-ready", {
            room: roomId,
            peerId: peerInstance.current.id,
            status,
            username: user,
          });
        }

        if (status === "guest") {
          initiateCall(roomId, mediaStream);
        }

        return mediaStream;
      } catch (err) {
        console.error("Failed to get local stream:", err);
        setStreamError(err.message || "Failed to access camera/microphone.");

        if (status === "guest") {
          initiateCall(roomId, new MediaStream());
        }
        return null;
      }
    };

    const initiateCall = (targetPeerId, stream) => {
      try {
        if (activeCallRef.current) {
          console.log("Closing existing call before initiating new call");
          activeCallRef.current.close();
        }

        console.log(`Calling peer: ${targetPeerId}`);
        const call = peerInstance.current.call(targetPeerId, stream, {
          metadata: { username: user }
        });
        activeCallRef.current = call;

        call.on("stream", (remoteStream) => {
          console.log("Remote stream received in initiateCall");
          setHasRemoteStream(true);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch((err) => {
              console.error("Error playing remote video:", err);
            });
          }
        });

        call.on("error", (err) => {
          console.error("Call error:", err);
        });
      } catch (err) {
        console.error("Failed to initiate call:", err);
      }
    };

    const handlePeerReady = async ({ peerId: readyPeerId, status: readyStatus, username: readyUsername }) => {
      console.log(`Peer ready event received: ${readyStatus} (${readyPeerId}) from ${readyUsername}`);
      if (readyUsername) {
        setRemoteUsername(readyUsername);
      }

      if (status === "guest" && readyStatus === "host") {
        let stream = localStreamRef.current;
        if (!stream && localStreamPromiseRef.current) {
          stream = await localStreamPromiseRef.current;
        }
        initiateCall(readyPeerId, stream || new MediaStream());
      }
    };

    socket.on("peer-ready", handlePeerReady);

    const handleIncomingCall = async (incomingCall) => {
      console.log("Receiving incoming call...");
      const callerUsername = incomingCall.options?.metadata?.username;
      if (callerUsername) {
        setRemoteUsername(callerUsername);
      }

      if (activeCallRef.current) {
        console.log("Closing existing call to answer new incoming call");
        activeCallRef.current.close();
      }
      activeCallRef.current = incomingCall;

      try {
        let stream = localStreamRef.current;
        if (!stream && localStreamPromiseRef.current) {
          console.log("Waiting for local stream before answering call...");
          stream = await localStreamPromiseRef.current;
        }

        incomingCall.answer(stream || new MediaStream());

        incomingCall.on("stream", (remoteStream) => {
          console.log("Remote stream received in handleIncomingCall");
          setHasRemoteStream(true);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch((err) => {
              console.error("Error playing remote video:", err);
            });
          }
        });
      } catch (err) {
        console.error("Error answering incoming call:", err);
        incomingCall.answer(new MediaStream());
      }
    };

    peerInstance.current.on("call", handleIncomingCall);

    const handlePeerOpen = (id) => {
      setPeerId(id);
      if (localStreamRef.current) {
        socket.emit("peer-ready", {
          room: roomId,
          peerId: id,
          status,
          username: user,
        });
      }
    };
    peerInstance.current.on("open", handlePeerOpen);

    const handleJoinRequest = ({ username, socketId }) => {
      if (status === "host") {
        setPendingJoinRequest({ username, socketId });
      }
    };
    socket.on("join-request", handleJoinRequest);

    const handleMeetingEnded = () => {
      alert("The meeting has been ended by the host.");
      setRoomId("");
      setStatus("");
      navigate("/");
    };
    socket.on("meeting-ended", handleMeetingEnded);

    localStreamPromiseRef.current = getLocalStream();

    return () => {
      socket.emit("leaveRoom", roomId);
      socket.off("connect", handleConnect);
      socket.off("peer-ready", handlePeerReady);
      socket.off("join-request", handleJoinRequest);
      socket.off("meeting-ended", handleMeetingEnded);
      setHasRemoteStream(false);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (activeCallRef.current) {
        activeCallRef.current.close();
      }
      if (peerInstance.current) {
        peerInstance.current.off("call", handleIncomingCall);
        peerInstance.current.off("open", handlePeerOpen);
      }
    };
  }, [roomId, status, peerInstance, socket, setPeerId, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      <header className="flex items-center justify-between px-12 py-4 border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/codemeet_logo.svg" alt="CodeMeet Logo" className="h-8 w-8 rounded-lg shadow-sm object-contain" />
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">CodeMeet</h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider -mt-0.5">Collaborative Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Room:</span>
            {showRoomId ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-400 select-all">{roomId}</span>
                <button
                  onClick={() => setShowRoomId(false)}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-2 py-0.5 rounded-lg border border-slate-700 transition-all"
                >
                  Hide
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowRoomId(true)}
                className="text-xs font-bold text-blue-400 hover:text-blue-350 bg-slate-850 hover:bg-slate-800 px-3 py-1 rounded-lg border border-slate-700/50 transition-all"
              >
                Show Room ID
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role:</span>
            <span className={`text-xs font-bold uppercase tracking-wider ${status === "host" ? "text-indigo-400" : "text-emerald-400"}`}>
              {status === "host" ? "Host" : "Guest"}
            </span>
          </div>
          <button
            onClick={() => {
              setRoomId("");
              setStatus("");
              navigate('/');
            }}
            className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 border border-slate-850 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
            title="Leave the room without ending the meeting"
          >
            Leave Room
          </button>
          {status === "host" && (
            <button
              onClick={() => {
                socket.emit("end-meeting", roomId);
                navigate('/');
              }}
              className="text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 border border-rose-900/40 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
              title="End the meeting for all participants"
            >
              End Meeting
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full gap-6">
        <div className="flex flex-col md:flex-row w-full gap-6 items-stretch min-h-[320px]">
          {/* User Video */}
          <div className="w-full md:w-1/3 flex flex-col">
            <span className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Your Camera</span>
            <div className="flex-1 relative rounded-2xl border border-slate-800/80 bg-slate-950/60 overflow-hidden shadow-xl aspect-video md:aspect-auto flex items-center justify-center min-h-[280px]">
              <video
                ref={currentUserVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />

              {streamError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-4 text-center z-10">
                  <div className="w-12 h-12 rounded-full bg-rose-950/50 flex items-center justify-center border border-rose-900/40 text-rose-400 mb-2">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="text-xs text-rose-400 font-bold tracking-wide uppercase mb-1">Stream Error</span>
                  <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">{streamError}</p>
                </div>
              )}

              {!streamError && isVideoOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-500 mb-2">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2 2V7a2 2 0 0 1 2-2h2" />
                      <path d="M10.68 10.68a2 2 0 0 1-2.83-2.83" />
                      <path d="m22 8-6 4 6 4V8Z" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold tracking-wide uppercase">Camera is off</span>
                </div>
              )}

              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/60 text-[10px] font-bold text-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wider z-20">
                {user || "You"} (You)
              </div>

              <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
                <button
                  onClick={toggleMute}
                  className={`p-2 rounded-xl border transition-all active:scale-95 ${isMuted
                    ? "bg-rose-500/25 border-rose-500/40 text-rose-400 hover:bg-rose-500/35"
                    : "bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {isMuted ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="1" x2="23" y1="1" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                      <path d="M15 9.34V5a3 3 0 0 0-5.94-.6" />
                      <path d="M17 14.89A7.12 7.12 0 0 0 19 11v-1" />
                      <path d="M5 10v1a7 7 0 0 0 8 6.92" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-2 rounded-xl border transition-all active:scale-95 ${isVideoOff
                    ? "bg-rose-500/25 border-rose-500/40 text-rose-400 hover:bg-rose-500/35"
                    : "bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                >
                  {isVideoOff ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
                      <path d="M10.68 10.68a2 2 0 0 1-2.83-2.83" />
                      <path d="m22 8-6 4 6 4V8Z" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 8-6 4 6 4V8Z" />
                      <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
                    </svg>
                  )}
                </button>
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
            <div className="flex-1 relative rounded-2xl border border-slate-800/80 bg-slate-950/60 overflow-hidden shadow-xl aspect-video md:aspect-auto flex items-center justify-center min-h-[280px]">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-indigo-950/90 backdrop-blur-md border border-indigo-900/60 text-[10px] font-bold text-indigo-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {remoteUsername}
              </div>
              {!hasRemoteStream && (
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

        <div className="flex-1 flex flex-col">
          <CodeEditor socket={socket} roomId={roomId} />
        </div>
      </main>

      {/* Host Approval Modal */}
      {pendingJoinRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm z-[100] p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm text-slate-100 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4 animate-bounce">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Join Request</h3>
            <p className="text-sm text-slate-300 mb-6">
              <span className="font-bold text-blue-400">{pendingJoinRequest.username}</span> wants to join the meeting room.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  socket.emit("deny-join", { guestSocketId: pendingJoinRequest.socketId });
                  setPendingJoinRequest(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                Deny
              </button>
              <button
                onClick={() => {
                  socket.emit("approve-join", { guestSocketId: pendingJoinRequest.socketId });
                  setPendingJoinRequest(null);
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
              >
                Allow Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioVideoScreen;
