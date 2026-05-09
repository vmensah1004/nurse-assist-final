/* 
 server/routes/rooms.js
 Room management endpoints for the admin dashboard.

 room doc shape:
 {
   _id: ObjectId,
   roomNumber: String,
   floor: String,
   status: "empty" | "partial" | "full",
   bedA: { patientName, patientId, admittedDate, notes },
   bedB: { patientName, patientId, admittedDate, notes }
    }
*/ 

const { Router } = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../db");

const router = Router();

//Helper — derives room status from bed occupancy
function deriveStatus(bedA, bedB) {
    const aOccupied = !!(bedA && bedA.patientName && bedA.patientName.trim());
    const bOccupied = !!(bedB && bedB.patientName && bedB.patientName.trim());
    if (aOccupied && bOccupied) return "full";
    if (aOccupied || bOccupied) return "partial";
    return "empty";
}

const emptyBed = { patientName: "", patientId: "", admittedDate: null, notes: "" };

//POST /api/rooms/seed — populate default rooms 
router.post("/seed", async (req, res) => {
    try {
        const db = getDb();
        const existing = await db.collection("rooms").countDocuments();
        if (existing > 0) return res.json({ message: "Rooms already seeded" });

        const rooms = [];
        for (const floor of ["1", "2", "3", "4"]) {
            for (let i = 1; i <= 15; i++) {
                rooms.push({
                    roomNumber: `${floor}${String(i).padStart(2, "0")}`,
                    floor,
                    status: "empty",
                    bedA: { ...emptyBed },
                    bedB: { ...emptyBed }
                });
            }
        }
        await db.collection("rooms").insertMany(rooms);
        await db.collection("rooms").createIndex({ roomNumber: 1 }, { unique: true });
        res.json({ message: `${rooms.length} rooms seeded` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//GET /api/rooms — get all rooms
router.get("/", async (req, res) => {
    try {
        const db = getDb();
        const filter = {};
        if (req.query.floor)  filter.floor  = req.query.floor;
        if (req.query.status) filter.status = req.query.status;
        const rooms = await db.collection("rooms")
            .find(filter)
            .sort({ floor: 1, roomNumber: 1 })
            .toArray();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//PATCH /api/rooms/:id — update bed data, automatically gets status
router.patch("/:id", async (req, res) => {
    try {
        const db = getDb();
        const { bedA, bedB } = req.body;
        const status = deriveStatus(bedA, bedB);
        const result = await db.collection("rooms").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { bedA, bedB, status } }
        );
        if (result.matchedCount === 0)
            return res.status(404).json({ error: "Room not found" });
        res.json({ updated: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
