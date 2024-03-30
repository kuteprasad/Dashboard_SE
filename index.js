// Import required packages
import express from "express";
import dotenv from "dotenv";
import postgres from "postgres";
import { createTables, sql } from "./db.js";

// Create an Express app instance
const app = express();
const PORT = process.env.PGPORT || 3000;

// Create tables if not exists
createTables();

// Define a route to get PostgreSQL version
app.get("/pg_version", async (req, res) => {
  try {
    // Fetch PostgreSQL version
    const result = await sql`select version()`;
    // Send response with PostgreSQL version
    res.json({ version: result[0].version });
  } catch (error) {
    console.error("Error fetching PostgreSQL version:", error);
    // Send error response
    res.status(500).json({ error: "Internal server error" });
  }
});

// Define a default route
app.get("/", (req, res) => {
  res.send("Welcome to my Express.js app!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
