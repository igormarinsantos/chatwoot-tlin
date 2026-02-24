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
];
