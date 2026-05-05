// server/routes/admin.js
const { Router } = require("express");
const { getDb } = require("../db");

const router = Router();

// GET /api/admin/workload
router.get("/workload", async (req, res) => {
  try {
    const db = getDb();

    const pipeline = [
      { $match: { status: "in-progress" } },
      {
        $lookup: {
          from: "nurses",
          localField: "assignedTo",
          foreignField: "_id",
          as: "nurse",
        },
      },
      { $unwind: { path: "$nurse", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$nurse._id",
          nurseName: { $first: "$nurse.name" },
          nurseRole: { $first: "$nurse.role" },
          activeTasks: {
            $push: {
              taskId: "$_id",
              title: "$title",
              room: "$room",
              type: "$type",
              submittedAt: "$submittedAt",
            },
          },
          taskCount: { $sum: 1 },
        },
      },
      { $sort: { taskCount: -1 } },
    ];

    const workload = await db.collection("tasks").aggregate(pipeline).toArray();

    const busyIds = workload
      .map((w) => w._id)
      .filter(Boolean)
      .map((id) => id.toString());

    const allNurses = await db
      .collection("nurses")
      .find({ active: true })
      .toArray();

    const idleNurses = allNurses
      .filter((n) => !busyIds.includes(n._id.toString()))
      .map((n) => ({
        _id: n._id,
        nurseName: n.name,
        nurseRole: n.role,
        activeTasks: [],
        taskCount: 0,
      }));

    res.json([...workload, ...idleNurses]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/completed
router.get("/completed", async (req, res) => {
  try {
    const db = getDb();

    const pipeline = [
      { $match: { status: "completed" } },
      {
        $lookup: {
          from: "nurses",
          localField: "assignedTo",
          foreignField: "_id",
          as: "nurse",
        },
      },
      {
        $unwind: { path: "$nurse", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          title: 1,
          room: 1,
          type: 1,
          description: 1,
          submittedAt: 1,
          completedAt: 1,
          completedBy: { $ifNull: ["$nurse.name", "Unassigned"] },
          nurseRole: { $ifNull: ["$nurse.role", "—"] },
          resolutionMins: {
            $round: [
              {
                $divide: [
                  { $subtract: ["$completedAt", "$submittedAt"] },
                  60000,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { completedAt: -1 } },
    ];

    const completed = await db.collection("tasks").aggregate(pipeline).toArray();
    res.json(completed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/summary
router.get("/summary", async (req, res) => {
  try {
    const db = getDb();
    const [pending, inProgress, completed, totalNurses] = await Promise.all([
      db.collection("tasks").countDocuments({ status: "pending" }),
      db.collection("tasks").countDocuments({ status: "in-progress" }),
      db.collection("tasks").countDocuments({ status: "completed" }),
      db.collection("nurses").countDocuments({ active: true }),
    ]);
    res.json({ pending, inProgress, completed, totalNurses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;