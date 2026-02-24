import { Router } from "express";
import { AvailabilityController } from "./controllers/AvailabilityController";
import { AppointmentController } from "./controllers/AppointmentController";
import { WebhookController } from "./controllers/WebhookController";

const router = Router();

// Availability
router.get("/clinics/:clinicId/availability", AvailabilityController.getAvailability);

// Appointments & Holds
router.post("/clinics/:clinicId/holds", AppointmentController.createHold);
router.post("/clinics/:clinicId/holds/:id/confirm", AppointmentController.confirm);
router.post("/clinics/:clinicId/appointments/:id/cancel", AppointmentController.cancel);

// Webhooks
router.post("/clinics/:clinicId/webhooks/subscriptions", WebhookController.subscribe);
router.get("/clinics/:clinicId/webhooks/subscriptions", WebhookController.list);

export default router;
