/* 
server/index.js
Entry point. Connects to MongoDB, registers routes, serves the
 static admin UI from client/, and starts listening.\
*/
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors    = require("cors");
const path    = require("path");
const { connectDb } = require("./db");

const taskRoutes  = require("./routes/tasks");
const nurseRoutes = require("./routes/nurses");
const adminRoutes = require("./routes/admin");
const roomRoutes  = require("./routes/rooms");   

const app  = express();
const server = http.createServer({ maxHeaderSize: 81920 }, app);
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    const headerSize = JSON.stringify(req.headers).length;
    console.log(`[${req.method}] ${req.url} — headers: ${headerSize} bytes`);
    if (headerSize > 8000) {
      console.log("LARGE HEADERS:", JSON.stringify(req.headers, null, 2));
    }
    next();
  });

// ── API routes ────────────────────────────────────────────────────────────
app.use("/api/tasks",  taskRoutes);
app.use("/api/nurses", nurseRoutes);
app.use("/api/admin",  adminRoutes);
app.use("/api/rooms",  roomRoutes);              

// ── Serve React build (production) ────────────────────────────────────────


// ── Start ─────────────────────────────────────────────────────────────────
(async () => {
    try {
        await connectDb();
        server.listen(PORT, () => {
            console.log(`NurseAssist server running → http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start:", err);
        process.exit(1);
    }
})();
