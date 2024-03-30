import postgres from "postgres";
import dotenv from "dotenv";

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

export { sql, createTables };
