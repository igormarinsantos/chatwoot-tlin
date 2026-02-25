import ClinicSchedulerAPI from '../../api/clinicScheduler';

const state = {
  professionals: [],
  procedures: [],
  appointments: [],
  clinicSettings: null,
  activeClinicId: '1', // Default ID used in auto-creation
  uiFlags: {
    isFetching: false,
    isCreating: false,
  },
};

const getters = {
  getProfessionals: _state => _state.professionals,
  getProcedures: _state => _state.procedures,
  getAppointments: _state => _state.appointments,
  getClinicSettings: _state => _state.clinicSettings,
};

const actions = {
  fetchClinicSettings: async ({ commit, state }) => {
    try {
      const response = await ClinicSchedulerAPI.getClinics(state.activeClinicId);
      commit('SET_CLINIC_SETTINGS', response.data);
    } catch (error) {
      console.error('Error fetching clinic settings:', error);
    }
  },
  updateClinicSettings: async ({ commit, state }, data) => {
    try {
      const response = await ClinicSchedulerAPI.updateClinic(state.activeClinicId, data);
      commit('SET_CLINIC_SETTINGS', response.data);
    } catch (error) {
      console.error('Error updating clinic settings:', error);
    }
  },
  fetchProfessionals: async ({ commit, state }) => {
    commit('SET_UI_FLAG', { isFetching: true });
    try {
      const response = await ClinicSchedulerAPI.getProfessionals(state.activeClinicId);
      commit('SET_PROFESSIONALS', response.data);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    } finally {
      commit('SET_UI_FLAG', { isFetching: false });
    }
  },
  fetchProcedures: async ({ commit, state }) => {
    commit('SET_UI_FLAG', { isFetching: true });
    try {
      const response = await ClinicSchedulerAPI.getProcedures(state.activeClinicId);
      commit('SET_PROCEDURES', response.data);
    } catch (error) {
      console.error('Error fetching procedures:', error);
    } finally {
      commit('SET_UI_FLAG', { isFetching: false });
    }
  },
  createProfessional: async ({ commit, state }, data) => {
    commit('SET_UI_FLAG', { isCreating: true });
    try {
      const response = await ClinicSchedulerAPI.createProfessional(state.activeClinicId, data);
      commit('ADD_PROFESSIONAL', response.data);
    } finally {
      commit('SET_UI_FLAG', { isCreating: false });
    }
  },
  updateProfessional: async ({ dispatch, state }, data) => {
    try {
      await ClinicSchedulerAPI.updateProfessional(state.activeClinicId, data);
      dispatch('fetchProfessionals');
    } catch (error) {
      console.error('Error updating professional:', error);
    }
  },
  updateProfessionalProcedures: async ({ dispatch }, { id, procedure_ids }) => {
    try {
      await ClinicSchedulerAPI.updateProfessionalProcedures(id, procedure_ids);
      dispatch('fetchProfessionals');
    } catch (error) {
      console.error('Error updating professional procedures:', error);
    }
  },
  deleteProfessional: async ({ dispatch }, id) => {
    try {
      await ClinicSchedulerAPI.deleteProfessional(id);
      dispatch('fetchProfessionals');
    } catch (error) {
      console.error('Error deleting professional:', error);
    }
  },
  createProcedure: async ({ commit, state }, data) => {
    try {
      const response = await ClinicSchedulerAPI.createProcedure(state.activeClinicId, data);
      commit('ADD_PROCEDURE', response.data);
    } catch (error) {
      console.error('Error creating procedure:', error);
    }
  },
  updateProcedure: async ({ dispatch, state }, data) => {
    try {
      await ClinicSchedulerAPI.updateProcedure(state.activeClinicId, data);
      dispatch('fetchProcedures');
    } catch (error) {
      console.error('Error updating procedure:', error);
    }
  },
  deleteProcedure: async ({ dispatch }, id) => {
    try {
      await ClinicSchedulerAPI.deleteProcedure(id);
      dispatch('fetchProcedures');
    } catch (error) {
      console.error('Error deleting procedure:', error);
    }
  },
  fetchAppointments: async ({ commit, state }) => {
    try {
      const response = await ClinicSchedulerAPI.getAppointments(state.activeClinicId);
      commit('SET_APPOINTMENTS', response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  },
  createHold: async ({ state }, data) => {
    try {
      const response = await ClinicSchedulerAPI.createHold(state.activeClinicId, data);
      return response.data;
    } catch (error) {
      console.error('Error creating hold:', error);
      throw error;
    }
  },
  confirmAppointment: async ({ dispatch, state }, { holdId, data }) => {
    try {
      await ClinicSchedulerAPI.confirmAppointment(state.activeClinicId, holdId, data);
      dispatch('fetchAppointments');
    } catch (error) {
      console.error('Error confirming appointment:', error);
      throw error;
    }
  },
  updateAppointment: async ({ dispatch, state }, { appointmentId, data }) => {
    try {
      await ClinicSchedulerAPI.updateAppointment(state.activeClinicId, appointmentId, data);
      dispatch('fetchAppointments');
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },
  cancelAppointment: async ({ dispatch, state }, appointmentId) => {
    try {
      await ClinicSchedulerAPI.cancelAppointment(state.activeClinicId, appointmentId);
      dispatch('fetchAppointments');
    } catch (error) {
      console.error('Error canceling appointment:', error);
      throw error;
    }
  }
};

const mutations = {
  SET_UI_FLAG(_state, payload) {
    _state.uiFlags = { ..._state.uiFlags, ...payload };
  },
  SET_PROFESSIONALS(_state, professionals) {
    _state.professionals = professionals;
  },
  SET_PROCEDURES(_state, procedures) {
    _state.procedures = procedures;
  },
  ADD_PROFESSIONAL(_state, professional) {
    _state.professionals.push(professional);
  },
  ADD_PROCEDURE(_state, procedure) {
    _state.procedures.push(procedure);
  },
  SET_APPOINTMENTS(_state, appointments) {
    _state.appointments = appointments;
  },
  SET_CLINIC_SETTINGS(_state, settings) {
    _state.clinicSettings = settings;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
