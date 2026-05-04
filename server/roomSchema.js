const mongoose = require("mongoose");

const PatientSlot = {
    patientName:  { type: String, default: "" },
    patientId:    { type: String, default: "" },
    admittedDate: { type: Date,   default: null },
    notes:        { type: String, default: "" }
};

const RoomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true },
    floor:      { type: String, default: "1" },
    // "empty" = no patients, "partial" = one patient, "full" = two patients
    status: {
        type: String,
        enum: ["empty", "partial", "full"],
        default: "empty"
    },
    bedA: { type: PatientSlot, default: () => ({}) },
    bedB: { type: PatientSlot, default: () => ({}) }
});

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room;
