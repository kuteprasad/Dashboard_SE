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
import express, { query } from "express";
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

app.post('/view_data', async (req, res) => {
  try {
    const { college, branch, seat_type } = req.body;

    let sqlQuery = "SELECT * FROM seat_data WHERE 1 = 1";

    if (college !== "all") {
      sqlQuery += ` AND college = '${college}'`;
    }

    if (branch !== "all") {
      sqlQuery += ` AND branch = '${branch}'`;
    }

    if (seat_type !== "all") {
      sqlQuery += ` AND seat_type = '${seat_type}'`;
    }

    const result = await db.query(sqlQuery);

    const data = {
      local: true,
      response: result.rows,
    };

    res.render("view_data.ejs", { data: data });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});


app.get("/add_student", (req, res) => {
  res.render("add_student.ejs");
});

app.post("/add_student", async (req, res) => {
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

  try {
    // Start a transaction
    await db.query("BEGIN");

    // Execute the first SQL statement to update seat_data
    const updateQuery = `
      UPDATE seat_data
      SET filled = filled + 1, vacant = vacant - 1
      WHERE college = $1
        AND branch = $2
        AND seat_type = $3
        AND vacant > 0
        RETURNING *;
    `;
    const updateValues = [college, branch, seat_type];
    const updateResult = await db.query(updateQuery, updateValues);

    // Check if any rows were affected by the UPDATE
    if (updateResult.rowCount === 0) {
      // No vacant seats available, so rollback the transaction
      await db.query("ROLLBACK");
      const htmlResponse = `
      
          <script>
              // Display alert when the page is loaded
              alert("No vacant seats available...");

              // Redirect to home route after a short delay
              setTimeout(function() {
                  window.location.href = '/';
              }, 0);
          </script>
      
    `;
      res.status(404).send(htmlResponse);
    }

    // Execute the second SQL statement to insert into student_details
    const insertQuery = `
      INSERT INTO student_details (first_name, last_name, mobile, email, enrolment_no, seat_type, candidate_type, college, branch, fee_status, doa)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;
    const insertValues = [
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
    await db.query(insertQuery, insertValues);

    // If both SQL statements executed successfully, commit the transaction
    await db.query("COMMIT");

    // Send success response

    const htmlResponse = `
          <script>
              // Display alert when the page is loaded
              alert("Data added Successfully!");

              // Redirect to home route after a short delay
              setTimeout(function() {
                  window.location.href = '/';
              }, 0);
          </script>
    `;
    res.status(200).send(htmlResponse);
  } catch (error) {
    // If an error occurred, rollback the transaction
    await db.query("ROLLBACK");

    // Handle the error
    if (error.code === "23505") {
      // Data already exists error
      const htmlResponse = `
        
            <script>
                // Display alert when the page is loaded
                alert("Data already exists.");

                // Redirect to home route after a short delay
                setTimeout(function() {
                    window.location.href = '/';
                }, 0);
            </script>
      
      `;
      res.status(400).send(htmlResponse);
    } else {
      // Other errors
      console.error("Error adding student data:", error);
      const htmlResponse = `
            <script>
                // Display alert when the page is loaded
                alert("An error occurred while adding student data.");

                // Redirect to home route after a short delay
                setTimeout(function() {
                    window.location.href = '/';
                }, 0);
            </script>
      `;
      res.status(500).send(htmlResponse);
    }
  }
});

app.get("/report", async (req, res) => {
  try {
    const query = `SELECT 
    college,
    branch,
    SUM(CASE WHEN seat_type = 'NRI' THEN intake ELSE 0 END) AS nri_intake,
    SUM(CASE WHEN seat_type = 'NRI' THEN filled ELSE 0 END) AS nri_filled,
    SUM(CASE WHEN seat_type = 'NRI' THEN vacant ELSE 0 END) AS nri_vacant,
    SUM(CASE WHEN seat_type = 'OCI' THEN intake ELSE 0 END) AS oci_intake,
    SUM(CASE WHEN seat_type = 'OCI' THEN filled ELSE 0 END) AS oci_filled,
    SUM(CASE WHEN seat_type = 'OCI' THEN vacant ELSE 0 END) AS oci_vacant,
    SUM(CASE WHEN seat_type = 'FN' THEN intake ELSE 0 END) AS fn_intake,
    SUM(CASE WHEN seat_type = 'FN' THEN filled ELSE 0 END) AS fn_filled,
    SUM(CASE WHEN seat_type = 'FN' THEN vacant ELSE 0 END) AS fn_vacant,
    SUM(CASE WHEN seat_type = 'PIO' THEN intake ELSE 0 END) AS pio_intake,
    SUM(CASE WHEN seat_type = 'PIO' THEN filled ELSE 0 END) AS pio_filled,
    SUM(CASE WHEN seat_type = 'PIO' THEN vacant ELSE 0 END) AS pio_vacant,
    SUM(CASE WHEN seat_type = 'CIWGC' THEN intake ELSE 0 END) AS ciwgc_intake,
    SUM(CASE WHEN seat_type = 'CIWGC' THEN filled ELSE 0 END) AS ciwgc_filled,
    SUM(CASE WHEN seat_type = 'CIWGC' THEN vacant ELSE 0 END) AS ciwgc_vacant,
    SUM(intake) AS total_intake,
    SUM(filled) AS total_filled,
    SUM(vacant) AS total_vacant
FROM 
    seat_data
GROUP BY 
    college, branch
ORDER BY 
    college ASC, branch ASC; `;

    const response = await db.query(query);
    // console.log(response.rows);

    res.render("report.ejs", {
      collegeData: response.rows,
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/report", (req, res) => {});

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
