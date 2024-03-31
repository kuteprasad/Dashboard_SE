// Import required packages
import express from "express";
import bodyParser from "body-parser";

import { db } from "./routes/db.js"; // Import sql from db.js

// Create an Express app instance
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Set EJS as the view engine
app.set("view engine", "ejs");

app.get("/pg_version", async (req, res) => {
  try {
    // Fetch PostgreSQL version
    const result = await db.query("select version()");

    // Check if result is empty or undefined
    if (!result || result.rows.length === 0) {
      throw new Error("PostgreSQL version not found");
    }

    // Send response with PostgreSQL version
    res.render("version.ejs", { versionInfo: result.rows[0].version });
  } catch (error) {
    console.error("Error fetching PostgreSQL version:", error);
    // Send error response
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/view_data", async (req, res) => {
  try {
    const data = {
      local: false,
    };
    res.render("main.ejs", { data });
  } catch (error) {
    console.log(error);
    res.send("error occured : ", error);
  }
});

app.post("/view_data", async (req, res) => {
  try {
    // Capture the selected options from the form
    const { college, branch, seat_type } = req.body;

    // Construct the SQL query based on the selected options
    let sqlQuery = "SELECT * FROM seat_data WHERE 1 = 1"; // Initial condition

    if (college !== "all") {
      sqlQuery += ` AND college = '${college}'`;
    }

    if (branch !== "all") {
      sqlQuery += ` AND branch = '${branch}'`;
    }

    if (seat_type !== "all") {
      sqlQuery += ` AND seat_type = '${seat_type}'`;
    }

    // Replace the following line with your method of executing SQL queries
    // Execute the query using the sql method
    const result = await db.query(sqlQuery);
    // console.log(result.rows);

    const data = {
      local: true,
      response: result.rows,
    };

    res.render("main.ejs", { data: data });
  } catch (error) {
    const status = error.status || 500;
    console.log(error);
    res.status(status).send(error);
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
