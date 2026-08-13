import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectdb from "./db/connectDb.js";
import cookieParser from "cookie-parser";
import auth from "./routes/auth.js";
import execute from "./routes/execute.js"; // Real Piston executor (requires Docker)

dotenv.config();

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
  CLIENT_URL,
  "https://codemeet-subodh-kumars-projects-79cf1a01.vercel.app",
  "https://codemeet-git-main-subodh-kumars-projects-79cf1a01.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
   origin: [
  CLIENT_URL,
  "https://codemeet-subodh-kumars-projects-79cf1a01.vercel.app",
  "https://codemeet-git-main-subodh-kumars-projects-79cf1a01.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

connectdb();

app.use("/api", auth);
app.use("/api/execute", execute);

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on("joinRoom", (data) => {
    const room = typeof data === "string" ? data : data.room;
    const status = typeof data === "object" ? data.status : undefined;
    socket.join(room);
    socket.room = room;
    if (status) {
      socket.status = status;
    }
    console.log(`User ${socket.id} joined room ${room} as ${status || "unknown"}`);
  });

  socket.on("request-join", ({ room, username }) => {
    const clients = io.sockets.adapter.rooms.get(room);
    const numClients = clients ? clients.size : 0;
    if (numClients >= 2) {
      socket.emit("join-full");
      console.log(`User ${username} (${socket.id}) blocked from room ${room} because it is full.`);
      return;
    }
    socket.to(room).emit("join-request", { username, socketId: socket.id });
    console.log(`User ${username} (${socket.id}) requested to join room ${room}`);
  });

  socket.on("approve-join", ({ guestSocketId }) => {
    io.to(guestSocketId).emit("join-approved");
    console.log(`Join approved for guest socket ${guestSocketId}`);
  });

  socket.on("deny-join", ({ guestSocketId }) => {
    io.to(guestSocketId).emit("join-denied");
    console.log(`Join denied for guest socket ${guestSocketId}`);
  });

  socket.on("end-meeting", (room) => {
    socket.to(room).emit("meeting-ended");
    console.log(`Meeting in room ${room} ended explicitly by host`);
  });

  socket.on("peer-ready", ({ room, peerId, status }) => {
    socket.to(room).emit("peer-ready", { peerId, status });
    socket.room = room;
    socket.status = status;
    console.log(`Peer ready in room ${room}: ${status} (${peerId})`);
  });

  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    console.log(`User ${socket.id} left room ${room}`);
    if (socket.status === "interviewer") {
      console.log(`Interviewer ${socket.id} left room ${room}, ending meeting`);
      io.to(room).emit("meeting-ended");
    }
  });

  socket.on("message", ({ room, data }) => {
    socket.to(room).emit("recieve-message", data);
  });

  socket.on("display-code", ({ room, data }) => {
    socket.to(room).emit("recieve-code", data);
  });

  socket.on("input-change", ({ room, data }) => {
    socket.to(room).emit("recieve-input", data);
  });

  socket.on("output-change", ({ room, data }) => {
    socket.to(room).emit("recieve-output", data);
  });

  socket.on("change-language", ({ room, data }) => {
    socket.to(room).emit("recieve-language", data);
  });

  socket.on("text-change", ({ room, data }) => {
    socket.to(room).emit("recieve-text", data);
  });

  socket.on("request-code-sync", (room) => {
    socket.to(room).emit("request-code-sync");
  });

  socket.on("sync-code", ({ room, code, language, version }) => {
    socket.to(room).emit("sync-code", { code, language, version });
  });

  socket.on("request-notes-sync", (room) => {
    socket.to(room).emit("request-notes-sync");
  });

  socket.on("sync-notes", ({ room, data }) => {
    socket.to(room).emit("sync-notes", data);
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
    if (socket.room && socket.status === "interviewer") {
      console.log(`Interviewer ${socket.id} disconnected from room ${socket.room}, ending meeting`);
      io.to(socket.room).emit("meeting-ended");
    }
  });
});

app.get("/", (req, res) => {
  res.send("Backend running");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});