// server/routes/nurses.js
// CRUD for nurse/NA staff records.
//
// Collections used: nurses
//
// Nurse document shape:
// {
//   _id: ObjectId,
//   name: String,
//   role: "RN" | "NA",
//   floor: String,
//   active: Boolean
// }

const { Router } = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../db");

const router = Router();

//GET /api/nurses — list all (active only unless all are true)
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const filter = req.query.all === "true" ? {} : { active: true };
    const nurses = await db
      .collection("nurses")
      .find(filter)
      .sort({ name: 1 })
      .toArray();
    res.json(nurses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//GET /api/nurses/:id
router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const nurse = await db
      .collection("nurses")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!nurse) return res.status(404).json({ error: "Nurse not found" });
    res.json(nurse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//POST /api/nurses — create new staff member
router.post("/", async (req, res) => {
  try {
    const db = getDb();
    const { name, role, floor } = req.body;
    if (!name || !role || !floor)
      return res.status(400).json({ error: "name, role, and floor are required" });

    const doc = { name, role, floor, active: true };
    const result = await db.collection("nurses").insertOne(doc);
    res.status(201).json({ insertedId: result.insertedId, ...doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/nurses/:id — update fields (e.g. toggle active)
router.patch("/:id", async (req, res) => {
  try {
    const db = getDb();
    const { name, role, floor, active } = req.body;
    const $set = {};
    if (name !== undefined) $set.name = name;
    if (role !== undefined) $set.role = role;
    if (floor !== undefined) $set.floor = floor;
    if (active !== undefined) $set.active = active;

    const result = await db
      .collection("nurses")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set });
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Nurse not found" });
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
