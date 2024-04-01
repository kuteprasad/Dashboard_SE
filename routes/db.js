import pg from "./node_modules/pg";
import dotenv from "dotenv";

dotenv.config({ path: "./config/.env" });

// Extract environment variables
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, DATABASE_OPTION } = process.env;
const { DB_PASSWORD, DB_NAME, DB_USER, DB_HOST } = process.env;

let db;
if (DATABASE_OPTION === "remote") {
  db = new pg.Client({
    user: PGUSER,
    host: PGHOST,
    database: PGDATABASE,
    password: PGPASSWORD,
    port: 5432,
    ssl: {
      // Specify SSL options here
      rejectUnauthorized: false, // You might need to adjust this based on your SSL configuration
    },
  });
} else if (DATABASE_OPTION === "local") {
  db = new pg.Client({
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: 5432,
  });
}

db.connect();

export { db };
