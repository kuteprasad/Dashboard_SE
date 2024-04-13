import express from "express";
import bodyParser from "body-parser"; // Add this line for bodyParser import express from "express";
import { db } from "./db.js"; // Corrected import path

const router = express.Router();

router.get("/pg_version", async (req, res) => {
  // Route handler logic for fetching PostgreSQL version
  res.render("index.ejs");
});

router.get("/report", async (req, res) => {
  // Route handler logic for generating report
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

export default router;
