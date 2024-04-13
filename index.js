import express from "express";
import bodyParser from "body-parser";
import dbRoutes from "./routes/dbRoutes.js";
import viewRoutes from "./routes/viewRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import loginRouter from "./routes/login.js";

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Use route modules
app.use("/", loginRouter);
app.use("/", viewRoutes);
app.use("/", dbRoutes);
app.use("/", studentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
