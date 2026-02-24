import express from "express";
import dotenv from "dotenv";

import { ClinicController } from "./controllers/ClinicController";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "clinic-scheduler" });
});

// Clinic API
app.get("/clinics/:id/availability", ClinicController.getAvailability);
app.post("/clinics/:id/holds", ClinicController.createHold);
app.post("/clinics/:id/holds/:token/confirm", ClinicController.confirmHold);
app.post("/clinics/:id/appointments/:appointmentId/cancel", ClinicController.cancelAppointment);
app.post("/clinics/:id/appointments/:appointmentId/reschedule", ClinicController.rescheduleAppointment);
app.post("/clinics/:id/webhooks/subscriptions", ClinicController.subscribeWebhook);

export default app;
