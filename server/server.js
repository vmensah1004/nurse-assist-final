const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const Room = require('./roomSchema');
const Task = require('./taskSchema');

const app = express();
app.use(express.json());
app.use(cors());


const mongoString = "mongodb+srv://admin:openthedoor@cluster0.vtiu6s4.mongodb.net/nurseassist";
mongoose.connect(mongoString);
const db = mongoose.connection;
db.on('error', (err) => console.log('DB Error:', err));
db.once('open', () => console.log('Database Connected'));

// Helper — derive status from bed occupancy
function deriveStatus(bedA, bedB) {
    const aOccupied = !!(bedA && bedA.patientName && bedA.patientName.trim());
    const bOccupied = !!(bedB && bedB.patientName && bedB.patientName.trim());
    if (aOccupied && bOccupied) return 'full';
    if (aOccupied || bOccupied) return 'partial';
    return 'empty';
}

// ─── ROOM ROUTES ─────────────────────────────────────────────────────────────

// Seed 24 default rooms (floors 1–3, 8 rooms each) — run once
app.post('/seedRooms', async (req, res) => {
    try {
        const existing = await Room.countDocuments();
        if (existing > 0) return res.send({ message: 'Rooms already seeded' });
        const rooms = [];
        for (const floor of ['1', '2', '3']) {
            for (let i = 1; i <= 8; i++) {
                rooms.push({
                    roomNumber: `${floor}0${i}`,
                    floor,
                    status: 'empty',
                    bedA: { patientName: '', patientId: '', admittedDate: null, notes: '' },
                    bedB: { patientName: '', patientId: '', admittedDate: null, notes: '' }
                });
            }
        }
        await Room.insertMany(rooms);
        res.send({ message: `${rooms.length} rooms seeded` });
    } catch (err) {
        res.status(500).send(err);
    }
});

// Get all rooms — optional ?floor= and ?status= query params
app.get('/getRooms', async (req, res) => {
    try {
        const filter = {};
        if (req.query.floor)  filter.floor  = req.query.floor;
        if (req.query.status) filter.status = req.query.status;
        const rooms = await Room.find(filter).sort({ floor: 1, roomNumber: 1 });
        res.send(rooms);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Update a room — auto-derives status from bed data
app.put('/updateRoom/:id', async (req, res) => {
    try {
        const { bedA, bedB } = req.body;
        const status = deriveStatus(bedA, bedB);
        const updated = await Room.findByIdAndUpdate(
            req.params.id,
            { bedA, bedB, status },
            { new: true }
        );
        res.send(updated);
    } catch (err) {
        res.status(500).send(err);
    }
});

// ─── TASK ROUTES ─────────────────────────────────────────────────────────────

// Get all tasks — optional ?status= ?urgency= ?highlighted=true
app.get('/getTasks', async (req, res) => {
    try {
        const filter = {};
        if (req.query.status)  filter.status  = req.query.status;
        if (req.query.urgency) filter.urgency = req.query.urgency;
        if (req.query.highlighted === 'true') filter.highlighted = true;
        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        res.send(tasks);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Create a task
app.post('/createTask', async (req, res) => {
    try {
        const task = new Task(req.body);
        await task.save();
        res.send(task);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Update a task
app.put('/updateTask/:id', async (req, res) => {
    try {
        const updated = await Task.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        res.send(updated);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Toggle highlight flag
app.put('/highlightTask/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).send('Task not found');
        task.highlighted = !task.highlighted;
        if (task.highlighted) task.status = 'outstanding';
        task.updatedAt = new Date();
        await task.save();
        res.send(task);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Ping staff assigned to a task
app.put('/pingTask/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { pingedAt: new Date(), updatedAt: new Date() },
            { new: true }
        );
        res.send({
            message: `Pinged ${task.assignedTo || 'all staff'} for: ${task.title}`,
            task
        });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.listen(9000, () => console.log('NurseAssist server running on port 9000'));
