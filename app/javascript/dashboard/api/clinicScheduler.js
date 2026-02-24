import axios from 'axios';

const SCHEDULER_API_BASE = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: SCHEDULER_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default {
  // Clinics
  getClinics(id) {
    return api.get(`/clinics/${id}`);
  },
  updateClinic(id, data) {
    return api.put(`/clinics/${id}`, data);
  },

  // Professionals
  getProfessionals(clinicId) {
    return api.get(`/clinics/${clinicId}/professionals`);
  },
  createProfessional(clinicId, data) {
    return api.post(`/clinics/${clinicId}/professionals`, data);
  },
  updateProfessionalProcedures(id, procedure_ids) {
    return api.put(`/professionals/${id}/procedures`, { procedure_ids });
  },
  deleteProfessional(id) {
    return api.delete(`/professionals/${id}`);
  },

  // Procedures
  getProcedures(clinicId) {
    return api.get(`/clinics/${clinicId}/procedures`);
  },
  createProcedure(clinicId, data) {
    return api.post(`/clinics/${clinicId}/procedures`, data);
  },
  deleteProcedure(id) {
    return api.delete(`/procedures/${id}`);
  },

  // Availability
  getAvailability(clinicId, params) {
    return api.get(`/clinics/${clinicId}/availability`, { params });
  },
  getRules(professionalId) {
    return api.get(`/professionals/${professionalId}/availability_rules`);
  },
  createRule(professionalId, data) {
    return api.post(`/professionals/${professionalId}/availability_rules`, data);
  },

  // Appointments
  getAppointments(clinicId, params) {
    return api.get(`/clinics/${clinicId}/appointments`, { params });
  },
  createHold(clinicId, data) {
    return api.post(`/clinics/${clinicId}/holds`, data);
  },
  confirmAppointment(clinicId, holdId, data) {
    return api.post(`/clinics/${clinicId}/holds/${holdId}/confirm`, data);
  },
  cancelAppointment(clinicId, appointmentId) {
    return api.post(`/clinics/${clinicId}/appointments/${appointmentId}/cancel`);
  },
};
