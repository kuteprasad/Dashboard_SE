// Import required packages
import express from "express";
import postgres from "postgres";
import dotenv from "dotenv";
import bodyParser from "body-parser";
// import path from "path";

// Load environment variables from .env file in the config folder
// Load environment variables from .env file in the config folder
dotenv.config({ path: "./config/.env" });

// Extract environment variables
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;

// Create a PostgreSQL client instance
const sql = postgres({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: "require",
  connection: {
    options: `project=${ENDPOINT_ID}`,
  },
});

// Create an Express app instance
const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

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

// Define a route to fetch data from the accounts table
app.get("/accounts", async (req, res) => {
  try {
    // Execute a SQL query to select data from the accounts table
    const accounts = await sql`SELECT * FROM accounts`;

    // Send the retrieved data as a JSON response
    res.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    // Send an error response if there's an issue with the database query
    res.status(500).json({ error: "Internal server error" });
  }
});

// Define a default route
app.get("/", (req, res) => {
  // res.send("Welcome to my Express.js app!");
  res.render("index.ejs");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
