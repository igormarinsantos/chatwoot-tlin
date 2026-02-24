import express from "express";
import dotenv from "dotenv";
import { ClinicController } from "./controllers/ClinicController";
import { ReminderJob } from "./jobs/ReminderJob";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// API Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "clinic-scheduler" });
});

// Clinic Scheduler Endpoints
app.get("/clinics/:clinicId/availability", ClinicController.getAvailability);
app.post("/clinics/:clinicId/holds", ClinicController.createHold);
app.post("/clinics/:clinicId/holds/:token/confirm", ClinicController.confirmHold);
app.post("/clinics/:clinicId/appointments/:id/cancel", ClinicController.cancelAppointment);
app.post("/clinics/:clinicId/webhooks/subscriptions", ClinicController.subscribeWebhook);

// Initialize Jobs
ReminderJob.init();

app.listen(PORT, () => {
  console.log(`Clinic Scheduler service running on port ${PORT}`);
});

export default app;
