// server/seed.js
// Run once: `node server/seed.js`
// Drops and re-creates the nurses and tasks collections with realistic data.

require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

const URI = process.env.MONGODB_URI;

const nurses = [
  { _id: new ObjectId(), name: "Adreis A.", role: "RN", floor: "Floor 4", active: true },
  { _id: new ObjectId(), name: "Chelsea E.", role: "RN", floor: "Floor 4", active: false },
  { _id: new ObjectId(), name: "Vince M.", role: "NA", floor: "Floor 4", active: true },
  { _id: new ObjectId(), name: "Chinwe O.", role: "RN", floor: "Floor 4", active: true },
  { _id: new ObjectId(), name: "Dylan W.", role: "NA", floor: "Floor 4", active: false },
];

function minsAgo(n) {
  return new Date(Date.now() - n * 60 * 1000);
}

function buildTasks(nurseList) {
  const [adreis, chelsea, vince, chinwe, dylan] = nurseList;
  return [
    // ── PENDING (unassigned pool) ──────────────────────────────────────────
    {
      type: "time-sensitive",
      room: "Room 412",
      title: "Medication administration",
      description:
        "Patient requires 2pm insulin dose. Chart updated. Patient has no known allergies on file.",
      status: "pending",
      assignedTo: null,
      submittedAt: minsAgo(2),
      completedAt: null,
    },
    {
      type: "non-emergency",
      room: "Room 408",
      title: "Fresh water and linen change",
      description:
        "Patient requests fresh water pitcher and linen replacement. Non-urgent, comfortable at present.",
      status: "pending",
      assignedTo: null,
      submittedAt: minsAgo(11),
      completedAt: null,
    },
    {
      type: "medical-emergency",
      room: "Room 415",
      title: "Patient reporting chest pain",
      description:
        "Patient reporting acute chest tightness, rating 7/10. History of cardiac issues on file. Requires nurse assessment immediately.",
      status: "pending",
      assignedTo: null,
      submittedAt: minsAgo(0),
      completedAt: null,
    },
    // ── IN PROGRESS (accepted) ────────────────────────────────────────────
    {
      type: "non-emergency",
      room: "Room 410",
      title: "Blood pressure check",
      description: "Routine vitals for post-op monitoring protocol.",
      status: "in-progress",
      assignedTo: adreis._id,
      submittedAt: minsAgo(25),
      completedAt: null,
    },
    {
      type: "time-sensitive",
      room: "Room 403",
      title: "IV line replacement",
      description: "IV site showing redness; line needs to be replaced promptly.",
      status: "in-progress",
      assignedTo: chelsea._id,
      submittedAt: minsAgo(14),
      completedAt: null,
    },
    {
      type: "non-emergency",
      room: "Room 407",
      title: "Ambulation assistance",
      description: "Patient cleared for first post-op walk. Needs escort and gait belt.",
      status: "in-progress",
      assignedTo: vince._id,
      submittedAt: minsAgo(8),
      completedAt: null,
    },
    {
      type: "time-sensitive",
      room: "Room 411",
      title: "Pain reassessment",
      description: "Patient reported pain 8/10 twenty minutes ago. Reassess after analgesic.",
      status: "in-progress",
      assignedTo: dylan._id,
      submittedAt: minsAgo(20),
      completedAt: null,
    },
    // ── COMPLETED ─────────────────────────────────────────────────────────
    {
      type: "non-emergency",
      room: "Room 401",
      title: "Morning vitals",
      description: "BP 118/74, HR 72, Temp 98.4°F. All within normal range. Documented.",
      status: "completed",
      assignedTo: adreis._id,
      submittedAt: minsAgo(120),
      completedAt: minsAgo(100),
    },
    {
      type: "time-sensitive",
      room: "Room 405",
      title: "Antibiotic administration",
      description: "IV vancomycin administered. Pre-dose level drawn. No adverse reactions.",
      status: "completed",
      assignedTo: chelsea._id,
      submittedAt: minsAgo(180),
      completedAt: minsAgo(160),
    },
    {
      type: "non-emergency",
      room: "Room 409",
      title: "Dietary intake documentation",
      description: "Patient ate 80% of breakfast. Fluid intake 400ml. Logged in chart.",
      status: "completed",
      assignedTo: vince._id,
      submittedAt: minsAgo(200),
      completedAt: minsAgo(185),
    },
    {
      type: "medical-emergency",
      room: "Room 414",
      title: "Rapid response — fall risk",
      description: "Patient found attempting to get OOB unassisted. Bed alarm reset. Side rails up. MD notified.",
      status: "completed",
      assignedTo: dylan._id,
      submittedAt: minsAgo(240),
      completedAt: minsAgo(230),
    },
    {
      type: "non-emergency",
      room: "Room 402",
      title: "Discharge instructions",
      description: "Patient educated on wound care and follow-up schedule. Questions answered. Paperwork signed.",
      status: "completed",
      assignedTo: adreis._id,
      submittedAt: minsAgo(300),
      completedAt: minsAgo(270),
    },
  ];
}

async function seed() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const db = client.db("nurseassist");

    // Drop existing data
    await db.collection("nurses").drop().catch(() => {});
    await db.collection("tasks").drop().catch(() => {});

    // Insert nurses first so we have their _ids
    const result = await db.collection("nurses").insertMany(nurses);
    console.log(`Inserted ${result.insertedCount} nurses`);

    const tasks = buildTasks(nurses);
    const tResult = await db.collection("tasks").insertMany(tasks);
    console.log(`Inserted ${tResult.insertedCount} tasks`);

    // Create useful indexes
    await db.collection("tasks").createIndex({ status: 1 });
    await db.collection("tasks").createIndex({ assignedTo: 1 });
    await db.collection("tasks").createIndex({ submittedAt: -1 });
    console.log("Indexes created");

    console.log("\nSeed complete. Run `node server/index.js` to start.");
  } finally {
    await client.close();
  }
}

seed().catch(console.error);
