import express from "express";
import dotenv from "dotenv";
import { ClinicController } from "./controllers/ClinicController";
import { AppointmentController } from "./controllers/AppointmentController";
import { SchedulerJobs } from "./jobs/SchedulerJobs";

dotenv.config();

const app = express();
app.use(express.json());

SchedulerJobs.init();

const PORT = process.env.PORT || 3000;

// Availability
app.get("/clinics/:clinicId/availability", ClinicController.getAvailability);

// Holds
app.post("/clinics/:clinicId/holds", AppointmentController.createHold);
app.post("/clinics/:clinicId/holds/:token/confirm", AppointmentController.confirmHold);

// Appointments
app.post("/clinics/:clinicId/appointments", AppointmentController.create);
app.post("/clinics/:clinicId/appointments/:id/cancel", AppointmentController.cancel);
app.post("/clinics/:clinicId/appointments/:id/reschedule", AppointmentController.reschedule);

// Webhooks
app.post("/clinics/:clinicId/webhooks/subscriptions", ClinicController.subscribeWebhook);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Clinic Scheduler running on port ${PORT}`);
});

export default app;
