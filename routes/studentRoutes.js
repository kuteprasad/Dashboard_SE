import express from "express";
import { db } from "./db.js";
import { ensureAuthenticated } from "./db_functions.js";

const router = express.Router();

router.get("/add_student", ensureAuthenticated, (req, res) => {
  res.render("add_student.ejs");
});

router.post("/add_student", ensureAuthenticated, async (req, res) => {
  // Route handler logic for processing student data

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

router.get("/student_details", ensureAuthenticated, async (req, res) => {
  // Route handler logic for fetching student details
  try {
    // Fetch data from the student_details table
    const result = await db.query("SELECT * FROM student_details");

    // Pass the fetched data to the student_data.ejs template
    res.render("student_details", { students: result.rows });
  } catch (error) {
    console.error("Error fetching student data:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
