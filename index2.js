// Import required packages
import express from "express";
import dotenv from "dotenv";
import postgres from "postgres";
// import { createTables, sql } from "./db.js";
// Load environment variables from .env file
dotenv.config();

// Extract environment variables
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID, PGPORT } =
  process.env;

// Create a PostgreSQL client instance
const sql = postgres({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: PGPORT,
  ssl: "require",
  connection: {
    options: `project=${ENDPOINT_ID}`,
  },
});

// Function to create tables if not exists
async function createTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        mobile_no VARCHAR(15),
        email VARCHAR(255) UNIQUE,
        account_type VARCHAR(10),
        password_salt VARCHAR(255),
        password_hash VARCHAR(255)
      )
    `;
    console.log("Tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
}

// Create an Express app instance
const app = express();
const PORT = process.env.PGPORT || 3000;

// Define a route to get PostgreSQL version
app.get("/pg_version", async (req, res) => {
  try {
    // Create tables if not exists
    // await createTables();
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
