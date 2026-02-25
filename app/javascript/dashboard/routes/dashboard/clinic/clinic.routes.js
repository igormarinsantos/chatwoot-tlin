import { frontendURL } from '../../../helper/URLHelper';
const ClinicIndex = () => import('./Index.vue');

export default [
  {
    path: frontendURL('accounts/:accountId/clinic'),
    name: 'clinic_dashboard',
    meta: {
      permissions: ['administrator', 'agent'],
    },
    component: ClinicIndex,
  },
  {
    path: frontendURL('accounts/:accountId/clinic/settings'),
    name: 'clinic_dashboard_settings',
    meta: {
      permissions: ['administrator', 'agent'],
    },
    component: ClinicIndex,
  },
  {
    path: frontendURL('accounts/:accountId/clinic/finance'),
    name: 'clinic_dashboard_finance',
    meta: {
      permissions: ['administrator', 'agent'],
    },
    component: ClinicIndex,
  },
];
