// Import required packages
import express from "express";
import bodyParser from "body-parser";
import { sql } from "./routes/db.js"; // Import sql from db.js

// Create an Express app instance
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Set EJS as the view engine
app.set("view engine", "ejs");

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

app.get("/view_data", async (req, res) => {
  try {
    const data = await sql`SELECT * FROM seat_data`;

    res.json(data);
  } catch (error) {
    console.log(error);
    res.send("error occured : ", error);
  }
});

// Route to fetch data for the dashboard
app.get("/dashboard", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT college, branch, SUM(intake) as total_intake, SUM(filled) as total_filled FROM seat_allocations GROUP BY college, branch"
    );
    const dashboardData = result.rows.map((row) => {
      const remainingSeats = row.total_intake - row.total_filled;
      return {
        department: row.branch,
        seats: {
          nri: remainingSeats, // Assuming remaining seats are available for NRI quota
          general: 0, // You may need to calculate this based on your logic
        },
      };
    });
    client.release();
    res.json(dashboardData);
  } catch (error) {
    console.error(error);
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
