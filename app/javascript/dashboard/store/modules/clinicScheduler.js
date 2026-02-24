import ClinicSchedulerAPI from '../../api/clinicScheduler';

const state = {
  professionals: [],
  procedures: [],
  appointments: [],
  activeClinicId: 'default-clinic', // In a real multi-tenant it would be fetched
  uiFlags: {
    isFetching: false,
    isCreating: false,
  },
};

const getters = {
  getProfessionals: _state => _state.professionals,
  getProcedures: _state => _state.procedures,
  getAppointments: _state => _state.appointments,
};

const actions = {
  fetchProfessionals: async ({ commit, state }) => {
    commit('SET_UI_FLAG', { isFetching: true });
    try {
      const response = await ClinicSchedulerAPI.getProfessionals(state.activeClinicId);
      commit('SET_PROFESSIONALS', response.data);
    } catch (error) {
      // Ignore
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
      // Ignore
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
  // Add more actions as needed...
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
  SET_APPOINTMENTS(_state, appointments) {
    _state.appointments = appointments;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
