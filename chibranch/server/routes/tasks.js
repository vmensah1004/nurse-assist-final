// server/routes/tasks.js
// Handles all task-related API endpoints.
//
// Collections used: tasks
//
// Task document shape:
// {
//   _id: ObjectId,
//   type: "routine" | "time-sensitive" | "medical-emergency",
//   room: String,
//   title: String,
//   description: String,
//   status: "pending" | "in-progress" | "completed",
//   assignedTo: ObjectId | null,   ← references nurses._id
//   submittedAt: Date,
//   completedAt: Date | null
// }

const { Router } = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../db");

const router = Router();

// GET /api/tasks — list all tasks, optional ?status= filter
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const tasks = await db
      .collection("tasks")
      .find(filter)
      .sort({ submittedAt: -1 })
      .toArray();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id — single task
router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const task = await db
      .collection("tasks")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks — create a new task
router.post("/", async (req, res) => {
  try {
    const db = getDb();
    const { type, room, title, description } = req.body;
    if (!type || !room || !title)
      return res.status(400).json({ error: "type, room, and title are required" });

    const doc = {
      type,
      room,
      title,
      description: description || "",
      status: "pending",
      assignedTo: null,
      submittedAt: new Date(),
      completedAt: null,
    };
    const result = await db.collection("tasks").insertOne(doc);
    res.status(201).json({ insertedId: result.insertedId, ...doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/assign — assign a task to a nurse and mark in-progress
router.patch("/:id/assign", async (req, res) => {
  try {
    const db = getDb();
    const { nurseId } = req.body;
    if (!nurseId) return res.status(400).json({ error: "nurseId is required" });

    const result = await db.collection("tasks").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { assignedTo: new ObjectId(nurseId), status: "in-progress" } }
    );
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Task not found" });
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/complete — mark a task as completed
router.patch("/:id/complete", async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection("tasks").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: "completed", completedAt: new Date() } }
    );
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Task not found" });
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    const db = getDb();
    const result = await db
      .collection("tasks")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Task not found" });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
