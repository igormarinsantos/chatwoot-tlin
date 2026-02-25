import CaptainFileAPI from 'dashboard/api/captain/file';
import { createStore } from '../storeFactory';

export default createStore({
  name: 'CaptainFile',
  API: CaptainFileAPI,
});
