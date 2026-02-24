import { Router } from "express";
import { AvailabilityController } from "./controllers/AvailabilityController";
import { AppointmentController } from "./controllers/AppointmentController";
import { WebhookController } from "./controllers/WebhookController";
import { ProfessionalController } from "./controllers/ProfessionalController";
import { ProcedureController } from "./controllers/ProcedureController";
import { ClinicController } from "./controllers/ClinicController";

const router = Router();

// Clinic Settings
router.get("/clinics/:id", ClinicController.get);
router.put("/clinics/:id", ClinicController.update);

// Professionals
router.get("/clinics/:clinicId/professionals", ProfessionalController.list);
router.post("/clinics/:clinicId/professionals", ProfessionalController.create);
router.put("/professionals/:id/procedures", ProfessionalController.updateProcedures);
router.delete("/professionals/:id", ProfessionalController.delete);

// Procedures
router.get("/clinics/:clinicId/procedures", ProcedureController.list);
router.post("/clinics/:clinicId/procedures", ProcedureController.create);
router.delete("/procedures/:id", ProcedureController.delete);

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
