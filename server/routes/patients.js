

const { Router } = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../db");
const router = Router();


//Patient enters name + room + bed. Uses upsert so re-registering
//updates the record rather than creating a duplicate.
router.post("/register", async (req, res) => {
  try {
    const db = getDb();
    const { name, room, bed } = req.body;
    if (!name || !room)
      return res.status(400).json({ error: "name and room are required" });

    const result = await db.collection("patients").findOneAndUpdate(
      { room, bed: bed || "A" },
      { $set: { name, room, bed: bed || "A", registeredAt: new Date() } },
      { upsert: true, returnDocument: "after" }
    );
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//Look up who is registered in a given room.
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const filter = {};
    if (req.query.room) filter.room = req.query.room;
    const patients = await db.collection("patients").find(filter).toArray();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//remove a patient record on discharge.
router.delete("/:id", async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection("patients")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Patient not found" });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;