const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
    title:        { type: String, required: true },
    description:  { type: String, default: "" },
    patientName:  { type: String, default: "" },
    roomNumber:   { type: String, default: "" },
    urgency: {
        type: String,
        enum: ["MEDICAL EMERGENCY", "TIME-SENSITIVE", "NON-EMERGENCY"],
        default: "NON-EMERGENCY"
    },
    status: {
        type: String,
        enum: ["unassigned", "in-progress", "completed", "outstanding"],
        default: "unassigned"
    },
    assignedTo:   { type: String, default: "" },   // staff username
    assignedRole: { type: String, default: "" },   // "nurse" | "nursing_assistant"
    createdAt:    { type: Date, default: Date.now },
    updatedAt:    { type: Date, default: Date.now },
    highlighted:  { type: Boolean, default: false },
    pingedAt:     { type: Date, default: null }
});

const Task = mongoose.model("Task", TaskSchema);
module.exports = Task;
