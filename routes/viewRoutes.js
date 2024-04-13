import express from "express";
import { db } from "./db.js";

const router = express.Router();

const names = {
    college: {
      vit: "Vishwakarma Institute of Technology",
      viit: "Vishwakarma Institute of Information Technology",
      vu: "Vishwakarma University",
    },
    branch: {
      cse: "Computer Science and Engineering",
      it: "Information Technology",
      aids: "Artificial Intelligence and Data Science",
      ai: "Artificial Intelligence",
      aiml: "Artificial Intelligence and Machine Learning",
      civil: "Civil Engineering",
      mech: "Mechanical Engineering",
      entc: "Electronics and Telecommunication Engineering",
      ds: "Data Science",
      iot: "Internet of Things",
    },
  };
  

router.get("/", (req, res) => {
    // Default route handler logic
    res.render("index.ejs");
});

router.get("/view_data", async (req, res) => {
    try {
        const data = {
            local: false,
        };
        res.render("view_data.ejs", { data });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
    }
});

router.post("/view_data", async (req, res) => {
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
            names: names,
        };

        res.render("view_data.ejs", { data });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

export default router;
