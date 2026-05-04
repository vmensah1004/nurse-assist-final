// server/db.js
//Manages the MongoDB Atlas connection using a singleton pattern.
//All route files import { getDb } from this module instead of
//reconnecting on every request.

require("dotenv").config();
const { MongoClient } = require("mongodb");

const URI = process.env.MONGODB_URI;
const client = new MongoClient(URI);

let db;

async function connectDb() {
  if (!db) {
    await client.connect();
    db = client.db("nurseassist"); //chinwe's nurseassist database name
    console.log("Connected to MongoDB Atlas — nurseassist database");
  }
  return db;
}

function getDb() {
  if (!db) throw new Error("Database not initialised. Call connectDb() first.");
  return db;
}

module.exports = { connectDb, getDb };
