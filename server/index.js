// server/index.js
// Entry point. Connects to MongoDB, registers routes, serves the
// static admin UI from client/, and starts listening.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDb } = require("./db");

const taskRoutes = require("./routes/tasks");
const nurseRoutes = require("./routes/nurses");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── API routes ────────────────────────────────────────────────────────────
app.use("/api/tasks", taskRoutes);
app.use("/api/nurses", nurseRoutes);
app.use("/api/admin", adminRoutes);

// ── Serve admin dashboard ─────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../client")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`NurseAssist Admin running → http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
})();
