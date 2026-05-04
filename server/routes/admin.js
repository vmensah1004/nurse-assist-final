// server/routes/admin.js
// Admin-specific aggregate endpoints powering the dashboard.
// These are read-only views that JOIN nurses + tasks so the
// frontend doesn't have to make multiple round trips.

const { Router } = require("express");
const { getDb } = require("../db");

const router = Router();

// GET /api/admin/workload
// Returns each nurse with their current in-progress and pending tasks.
// Used for the "Who is busy?" view.
router.get("/workload", async (req, res) => {
  try {
    const db = getDb();

    // Aggregate: group tasks assigned to each nurse that are NOT completed
    const pipeline = [
      // Only active, in-progress tasks
      { $match: { status: "in-progress" } },
      // Join nurse data
      {
        $lookup: {
          from: "nurses",
          localField: "assignedTo",
          foreignField: "_id",
          as: "nurse",
        },
      },
      { $unwind: { path: "$nurse", preserveNullAndEmpty: true } },
      // Group by nurse
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

    //Also fetch nurses with ZERO active tasks (idle nurses)
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


//returns all completed tasks with the name of who completed them.
//used for the "Completed tasks" history view
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
        $unwind: { path: "$nurse", preserveNullAndEmpty: true },
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
          // Resolution time in minutes
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
// Quick stats card numbers for the dashboard header.
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
