import axios from 'axios';

const BASE_URL = `/api/v1/clinic`;

export default {
  // Clinics
  async getClinics(id) {
    const res = await axios.get(`/api/v1/accounts/${id}`);
    return { data: res.data };
  },
  async updateClinic(id, payload) {
    const res = await axios.patch(`/api/v1/accounts/${id}`, payload);
    return { data: res.data };
  },

  // Professionals
  async getProfessionals(clinicId) {
    const res = await axios.get(`${BASE_URL}/professionals`);
    return { data: res.data || [] };
  },
  async createProfessional(clinicId, payload) {
    const res = await axios.post(`${BASE_URL}/professionals`, { professional: payload });
    return { data: res.data };
  },
  async updateProfessional(clinicId, payload) {
    const res = await axios.put(`${BASE_URL}/professionals/${payload.id}`, { professional: payload });
    return { data: res.data };
  },
  async updateProfessionalProcedures(id, procedure_ids) {
    const res = await axios.put(`${BASE_URL}/professionals/${id}`, { professional: { procedure_ids: procedure_ids } });
    return { data: res.data };
  },
  async deleteProfessional(id) {
    await axios.delete(`${BASE_URL}/professionals/${id}`);
    return { data: {} };
  },

  // Procedures
  async getProcedures(clinicId) {
    const res = await axios.get(`${BASE_URL}/procedures`);
    return { data: res.data || [] };
  },
  async createProcedure(clinicId, payload) {
    const res = await axios.post(`${BASE_URL}/procedures`, { procedure: payload });
    return { data: res.data };
  },
  async updateProcedure(clinicId, payload) {
    const res = await axios.put(`${BASE_URL}/procedures/${payload.id}`, { procedure: payload });
    return { data: res.data };
  },
  async deleteProcedure(id) {
    await axios.delete(`${BASE_URL}/procedures/${id}`);
    return { data: {} };
  },

  // Resources
  async getResources(clinicId) {
    const res = await axios.get(`${BASE_URL}/resources`);
    return { data: res.data || [] };
  },
  async createResource(clinicId, payload) {
    const res = await axios.post(`${BASE_URL}/resources`, { resource: payload });
    return { data: res.data };
  },
  async updateResource(clinicId, payload) {
    const res = await axios.put(`${BASE_URL}/resources/${payload.id}`, { resource: payload });
    return { data: res.data };
  },
  async deleteResource(id) {
    await axios.delete(`${BASE_URL}/resources/${id}`);
    return { data: {} };
  },

  // Availability Blocks
  async getAvailabilityBlocks(clinicId) {
    const res = await axios.get(`${BASE_URL}/availability_blocks`);
    return { data: res.data || [] };
  },
  async updateAvailabilityBlocks(clinicId, payload) {
    const res = await axios.post(`${BASE_URL}/availability_blocks`, payload);
    return { data: res.data };
  },

  // Appointments
  async getAppointments(clinicId, params) {
    const res = await axios.get(`${BASE_URL}/appointments`, { params });
    // Fetch both holds and solid appointments to render on UI
    const holdsRes = await axios.get(`${BASE_URL}/holds`, { params });
    return { data: [...(res.data || []), ...(holdsRes.data || [])] };
  },
  async createHold(clinicId, payload) {
    const res = await axios.post(`${BASE_URL}/holds`, { hold: payload }, {
      headers: {
        'Idempotency-Key': `hold_${Date.now()}_${Math.random()}`
      }
    });
    return { data: res.data };
  },
  async confirmAppointment(clinicId, holdId, payload) {
    const res = await axios.post(`${BASE_URL}/holds/${holdId}/convert`, payload, {
      headers: {
        'Idempotency-Key': `apt_${Date.now()}_${Math.random()}`
      }
    });
    return { data: res.data };
  },
  async cancelAppointment(clinicId, appointmentId) {
    // We update the status to canceled via PATCH
    const res = await axios.patch(`${BASE_URL}/appointments/${appointmentId}`, {
      patch: { status: 'cancelled' }
    });
    return { data: res.data };
  },
  async updateAppointment(clinicId, appointmentId, payload) {
    const res = await axios.patch(`${BASE_URL}/appointments/${appointmentId}`, {
      patch: payload
    });
    return { data: res.data };
  },
};
