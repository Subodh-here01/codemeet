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
    origin: [CLIENT_URL, "http://localhost:5174", "http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:5174", "http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

connectdb();

app.use("/api", auth);
app.use("/api/execute", execute);

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });

  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    console.log(`User ${socket.id} left room ${room}`);
  });

  socket.on("message", ({ room, data }) => {
    io.to(room).emit("recieve-message", data);
  });

  socket.on("display-code", ({ room, data }) => {
    io.to(room).emit("recieve-code", data);
  });

  socket.on("input-change", ({ room, data }) => {
    io.to(room).emit("recieve-input", data);
  });

  socket.on("output-change", ({ room, data }) => {
    io.to(room).emit("recieve-output", data);
  });

  socket.on("change-language", ({ room, data }) => {
    io.to(room).emit("recieve-language", data);
  });

  socket.on("text-change", ({ room, data }) => {
    io.to(room).emit("recieve-text", data);
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
  });
});

app.get("/", (req, res) => {
  res.send("Backend running");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});