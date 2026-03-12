import express from "express";
import dotenv from "dotenv";
import router from "./routes";
import { ReminderJob } from "./jobs/ReminderJob";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

// Main Router
app.use("/api", router);

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "clinic-scheduler" });
});

// Start Background Jobs
ReminderJob.start();

app.listen(port, () => {
  console.log(`Clinic Scheduler service running on port ${port}`);
});
