//server/routes/tasks.js
//Handles all task-related queries
//

const { Router } = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../db");

const router = Router();

//GET /api/tasks — list all tasks, optional ?status= ?type= ?highlighted= filters
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type)   filter.type   = req.query.type;
    if (req.query.highlighted === "true") filter.highlighted = true;
    const tasks = await db.collection("tasks")
      .find(filter)
      .sort({ submittedAt: -1 })
      .toArray();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//GET /api/tasks/:id — single task
router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const task = await db.collection("tasks")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//POST /api/tasks — create a new task (used by patient portal and admin)
router.post("/", async (req, res) => {
  try {
    const db = getDb();
    const { type, room, title, description, assignedTo, assignedRole, patientName } = req.body;
    if (!type || !room || !title)
      return res.status(400).json({ error: "type, room, and title are required" });

    const doc = {
      type,
      room,
      title,
      description:  description  || "",
      patientName:  patientName  || "",   // stored so nurse view can display submitter
      assignedTo:   assignedTo   ? new ObjectId(assignedTo) : null,
      assignedRole: assignedRole || "",
      status:       "pending",
      highlighted:  false,
      pingedAt:     null,
      submittedAt:  new Date(),
      completedAt:  null,
    };
    const result = await db.collection("tasks").insertOne(doc);
    res.status(201).json({ insertedId: result.insertedId, ...doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//PATCH /api/tasks/:id — general field update
router.patch("/:id", async (req, res) => {
  try {
    const db = getDb();
    const $set = { ...req.body };
    if ($set.assignedTo) $set.assignedTo = new ObjectId($set.assignedTo);
    const result = await db.collection("tasks").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set }
    );
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Task not found" });
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//PATCH /api/tasks/:id/assign — assign task to a nurse, mark in-progress
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

//PATCH /api/tasks/:id/complete — mark task completed
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

//PATCH /api/tasks/:id/highlight — admin toggles outstanding flag
router.patch("/:id/highlight", async (req, res) => {
  try {
    const db = getDb();
    const task = await db.collection("tasks")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const highlighted = !task.highlighted;
    const $set = { highlighted };
    if (highlighted) $set.status = "outstanding";

    await db.collection("tasks").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set }
    );
    res.json({ highlighted, status: $set.status || task.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//PATCH /api/tasks/:id/ping — admin pings assigned staff
router.patch("/:id/ping", async (req, res) => {
  try {
    const db = getDb();
    const task = await db.collection("tasks").findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { pingedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({
      message: `Pinged ${task.assignedTo ? "assigned staff" : "all staff"} for: ${task.title}`,
      task
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection("tasks")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Task not found" });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
