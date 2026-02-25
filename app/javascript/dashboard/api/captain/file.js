/* global axios */
import ApiClient from '../ApiClient';

class CaptainFile extends ApiClient {
  constructor() {
    super('captain/files', { accountScoped: true });
  }

  get({ page = 1, searchKey, assistantId } = {}) {
    return axios.get(this.url, {
      params: {
        page,
        searchKey,
        assistant_id: assistantId,
      },
    });
  }
}

export default new CaptainFile();
