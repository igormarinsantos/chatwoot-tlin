import { createRouter, createWebHistory } from 'vue-router';

import { frontendURL } from '../helper/URLHelper';
import dashboard from './dashboard/dashboard.routes';
import store from 'dashboard/store';
import { validateLoggedInRoutes } from '../helper/routeHelpers';
import AnalyticsHelper from '../helper/AnalyticsHelper';

const routes = [...dashboard.routes];

export const router = createRouter({ history: createWebHistory(), routes });

export const validateAuthenticateRoutePermission = (to, next) => {
  const { isLoggedIn, getCurrentUser: user } = store.getters;

  if (!isLoggedIn) {
    window.location.assign('/app/login');
    return '';
  }

  const { accounts = [], account_id: accountId } = user;

  if (!accounts.length) {
    if (to.name === 'no_accounts') {
      return next();
    }
    return next(frontendURL('no-accounts'));
  }

  if (to.name === 'no_accounts' || !to.name) {
    return next(frontendURL(`accounts/${accountId}/dashboard`));
  }

  const nextRoute = validateLoggedInRoutes(to, store.getters.getCurrentUser);
  return nextRoute ? next(frontendURL(nextRoute)) : next();
};

export const initalizeRouter = () => {
  const userAuthentication = store.dispatch('setUser');

  router.beforeEach((to, _from, next) => {
    AnalyticsHelper.page(to.name || '', {
      path: to.path,
      name: to.name,
    });

    userAuthentication.then(() => {
      return validateAuthenticateRoutePermission(to, next, store);
    });
  });

  const ROUTE_TITLES = {
    inbox_view: 'Caixa de Entrada',
    inbox_view_conversation: 'Caixa de Entrada',
    kanban_view: 'CRM',
    agenda_view: 'Agenda',
    home: 'Conversas',
    messages: 'Conversas',
    contacts_dashboard_index: 'Contatos',
    contacts_edit: 'Contatos',
    account_overview_reports: 'Relatórios',
    agent_reports_index: 'Relatórios',
    general_settings_index: 'Configurações',
    settings_wrapper: 'Configurações',
    campaigns_livechat_index: 'Campanhas',
  };

  router.afterEach(to => {
    const pageTitle = ROUTE_TITLES[to.name] || 'App';
    document.title = `Tlin | ${pageTitle}`;
  });
};

export default router;
