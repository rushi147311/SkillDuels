const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
<<<<<<< HEAD

dotenv.config();
=======
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const roomHandler = require("./socket/roomHandler");
>>>>>>> 613b185 (Merged server.js with auth and socket setup)

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

<<<<<<< HEAD
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
=======
// Routes
app.use("/api/auth", authRoutes);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
>>>>>>> 613b185 (Merged server.js with auth and socket setup)

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  roomHandler(io, socket);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});