import { frontendURL } from '../../../helper/URLHelper';
const AgendaIndex = () => import('./Index.vue');

export default [
  {
    path: frontendURL('accounts/:accountId/agenda'),
    name: 'agenda_view',
    meta: {
      permissions: ['administrator', 'agent'],
    },
    component: AgendaIndex,
  },
];
