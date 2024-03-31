// <<<<<<< HEAD
// import express from "express";
// import bodyParser from "body-parser";
// import pg from "pg";

// const app = express();
// const port = 3000;

// // Set EJS as the view engine
// app.set('view engine', 'ejs');

// // Set up PostgreSQL connection pool
// const pool = new pg.Pool({
//     user: "postgres",
//     host: "localhost",
//     database: "Dashboard",
//     password: "12345",
//     port: 5432,
// });

// // Middleware
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static("public"));

// // Route handler for the root path
// app.get('/', (req, res) => {
//     res.render('index'); // Assuming index.ejs is your main page
// });


// // Route to fetch data for the dashboard
// app.get('/dashboard', async (req, res) => {
//     try {
//         const client = await pool.connect();
//         const result = await client.query('SELECT college, branch, SUM(intake) as total_intake, SUM(filled) as total_filled FROM seat_allocations GROUP BY college, branch');
//         const dashboardData = result.rows.map(row => {
//             const remainingSeats = row.total_intake - row.total_filled;
//             return {
//                 department: row.branch,
//                 seats: {
//                     nri: remainingSeats, // Assuming remaining seats are available for NRI quota
//                     general: 0 // You may need to calculate this based on your logic
//                 }
//             };
//         });
//         client.release();
//         res.json(dashboardData);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // Route to save seat allocation data to the database
// app.post('/allocate-seats', async (req, res) => {
//     try {
//         const { college, branch, intake, allocatedSeats } = req.body;
        
//         // Calculate total seats allocated for NRI and General quotas
//         const totalSeatsNRI = allocatedSeats.nri.reduce((total, seats) => total + seats, 0);
//         const totalSeatsGeneral = allocatedSeats.general.reduce((total, seats) => total + seats, 0);
        
//         // Connect to the database
//         const client = await pool.connect();
        
//         // Begin a transaction
//         await client.query('BEGIN');
        
//         // Update seat allocation data in the database
//         const query = 'UPDATE seat_allocations SET filled = filled + $1 WHERE college = $2 AND branch = $3';
//         await client.query(query, [totalSeatsNRI, college, branch]);
//         await client.query(query, [totalSeatsGeneral, college, branch]);
        
//         // Commit the transaction
//         await client.query('COMMIT');
        
//         // Release the database connection
//         client.release();
        
//         // Respond with success message
//         res.json({ message: 'Seat allocation data saved successfully' });
//     } catch (error) {
//         // Rollback the transaction if an error occurs
//         await client.query('ROLLBACK');
        
//         console.error(error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).send('Something went wrong!');
// });

// // Start the server
// app.listen(port, () => {
//     console.log(`Server is listening at http://localhost:${port}`);

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
    res.render("view_data.ejs", { data });
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

    res.render("view_data.ejs", { data: data });
  } catch (error) {
    const status = error.status || 500;
    console.log(error);
    res.status(status).send(error);
  }
});

app.get("/add_student", (req, res) => {
  res.render("add_student.ejs");
});

app.post("/add_student", async (req, res) => {
  // res.send("working");
  try {
    // Extract form data from request body
    const {
      first_name,
      last_name,
      mobile,
      email,
      enrolment_no,
      seat_type,
      candidate_type,
      college,
      branch,
      fee_status,
      doa,
    } = req.body;

    // Execute SQL INSERT statement
    const query = `
      INSERT INTO student_details (first_name, last_name, mobile, email, enrolment_no, seat_type, candidate_type, college, branch, fee_status, doa)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;
    const values = [
      first_name,
      last_name,
      mobile,
      email,
      enrolment_no,
      seat_type,
      candidate_type,
      college,
      branch,
      fee_status,
      doa,
    ];
    await db.query(query, values);

    const htmlResponse = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Added</title>
</head>
<body>
    <script>
        // Display alert when the page is loaded
        alert("Data added Successfully!");

        // Redirect to home route after a short delay
        setTimeout(function() {
            window.location.href = '/';
        }, 0);
    </script>
    </body>
</html>

        `;
    res.status(200).send(htmlResponse);
  } catch (error) {
    if (error.code == "23505") {
      const htmlResponse = `
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
</head>
<body>
    <script>
        // Display alert when the page is loaded
        alert("Data already exists.");

        // Redirect to home route after a short delay
        setTimeout(function() {
            window.location.href = '/';
        }, 0);
    </script>
    </body>
</html>
        `;
      res.status(400).send(htmlResponse);
    } else {
      // Handle other errors
      console.error("Error adding student data:", error);
      res.status(500).send("An error occurred while adding student data.");
    }
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
