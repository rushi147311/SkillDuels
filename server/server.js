const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes"); 
const dashboardRoutes = require("./routes/dashboardRoutes");

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SkillDuels API is running",
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes); 
app.use("/api/dashboard", dashboardRoutes);
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on("join_match_room", (roomCode) => {
    socket.join(roomCode);
    console.log(`User ${socket.id} joined match room: ${roomCode}`);
  });
  socket.on("submit_live_answer", (data) => {
    const { roomCode, score, playerId } = data;
    socket.to(roomCode).emit("opponent_score_update", { playerId, score });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});