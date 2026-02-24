import axios from 'axios';

// Local storage key for persistence
const STORAGE_KEY = 'tlin_clinic_data';

export const getLocalData = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing local data', e);
    }
  }
  return {
    clinics: {
      1: {
        id: '1',
        name: 'Minha Clínica',
        webhook_url: '',
        operating_hours: {},
      },
    },
    professionals: [],
    procedures: [],
    appointments: [],
  };
};

export const saveLocalData = data => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Helper for generating random IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to fire webhook asynchronously without blocking the UI
const fireWebhook = async (clinicId, eventType, payload) => {
  const data = getLocalData();
  const clinic = data.clinics[clinicId];
  if (clinic && clinic.webhook_url) {
    try {
      await axios.post(clinic.webhook_url, {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      });
      console.log(`Webhook sent for event: ${eventType}`);
    } catch (error) {
      console.error('Failed to send webhook', error);
    }
  }
};

export default {
  // Clinics
  getClinics(id) {
    const data = getLocalData();
    return Promise.resolve({ data: data.clinics[id] || { id } });
  },
  updateClinic(id, payload) {
    const data = getLocalData();
    data.clinics[id] = { ...data.clinics[id], ...payload, id };
    saveLocalData(data);
    fireWebhook(id, 'clinic_updated', data.clinics[id]);
    return Promise.resolve({ data: data.clinics[id] });
  },

  // Professionals
  getProfessionals(clinicId) {
    const data = getLocalData();
    // In our mock, professionals are global, but in a real app they belong to the clinic
    return Promise.resolve({ data: data.professionals });
  },
  createProfessional(clinicId, payload) {
    const data = getLocalData();
    const newProf = { ...payload, id: generateId(), clinic_id: clinicId };
    data.professionals.push(newProf);
    saveLocalData(data);
    fireWebhook(clinicId, 'professional_created', newProf);
    return Promise.resolve({ data: newProf });
  },
  updateProfessionalProcedures(id, procedure_ids) {
    const data = getLocalData();
    const profIndex = data.professionals.findIndex(p => p.id === id);
    if (profIndex !== -1) {
      // Map procedure IDs back to procedure objects (the vuex store expects objects or IDs depending on logic)
      const procedures = data.procedures.filter(p =>
        procedure_ids.includes(p.id)
      );
      data.professionals[profIndex].procedures = procedures;
      saveLocalData(data);
      fireWebhook(
        data.professionals[profIndex].clinic_id || '1',
        'professional_updated',
        data.professionals[profIndex]
      );
      return Promise.resolve({ data: data.professionals[profIndex] });
    }
    return Promise.reject(new Error('Professional not found'));
  },
  deleteProfessional(id) {
    const data = getLocalData();
    const prof = data.professionals.find(p => p.id === id);
    data.professionals = data.professionals.filter(p => p.id !== id);
    saveLocalData(data);
    if (prof) {
      fireWebhook(prof.clinic_id || '1', 'professional_deleted', { id });
    }
    return Promise.resolve({ data: {} });
  },

  // Procedures
  getProcedures(clinicId) {
    const data = getLocalData();
    return Promise.resolve({ data: data.procedures });
  },
  createProcedure(clinicId, payload) {
    const data = getLocalData();
    const newProc = { ...payload, id: generateId(), clinic_id: clinicId };
    data.procedures.push(newProc);
    saveLocalData(data);
    fireWebhook(clinicId, 'procedure_created', newProc);
    return Promise.resolve({ data: newProc });
  },
  deleteProcedure(id) {
    const data = getLocalData();
    const proc = data.procedures.find(p => p.id === id);
    data.procedures = data.procedures.filter(p => p.id !== id);
    saveLocalData(data);
    if (proc) {
      fireWebhook(proc.clinic_id || '1', 'procedure_deleted', { id });
    }
    return Promise.resolve({ data: {} });
  },

  // Appointments
  getAppointments(clinicId, params) {
    const data = getLocalData();
    return Promise.resolve({ data: data.appointments });
  },
  createHold(clinicId, payload) {
    const data = getLocalData();
    const hold = {
      ...payload,
      id: generateId(),
      clinic_id: clinicId,
      status: 'hold',
    };
    data.appointments.push(hold);
    saveLocalData(data);
    // Don't fire webhook for hold, wait for confirm
    return Promise.resolve({ data: hold }); // Return .data as the vuex action dispatch returns hold.data or hold depending on how it's handled. CalendarView uses hold.id directly from the payload? Let's check vuex.
    // wait, vuex does: const hold = await store.dispatch('clinicScheduler/createHold', ...); hold.id.
    // Wait, the action `createHold` isn't in clinicScheduler.js store? Let's fix that.
  },
  confirmAppointment(clinicId, holdId, payload) {
    const data = getLocalData();
    const apptIndex = data.appointments.findIndex(a => a.id === holdId);
    if (apptIndex !== -1) {
      data.appointments[apptIndex] = {
        ...data.appointments[apptIndex],
        ...payload,
        status: 'confirmed',
      };
      saveLocalData(data);
      fireWebhook(
        clinicId,
        'appointment_confirmed',
        data.appointments[apptIndex]
      );
      return Promise.resolve({ data: data.appointments[apptIndex] });
    }
    return Promise.reject(new Error('Hold not found'));
  },
  cancelAppointment(clinicId, appointmentId) {
    const data = getLocalData();
    const apptIndex = data.appointments.findIndex(a => a.id === appointmentId);
    if (apptIndex !== -1) {
      data.appointments[apptIndex].status = 'canceled';
      saveLocalData(data);
      fireWebhook(
        clinicId,
        'appointment_canceled',
        data.appointments[apptIndex]
      );
      return Promise.resolve({ data: data.appointments[apptIndex] });
    }
    return Promise.reject(new Error('Appointment not found'));
  },
};
