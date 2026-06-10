import api from './axios';

export const investmentsApi = {
  list: () => api.get('/investments'),
  create: (data) => api.post('/investments', data),
  update: (id, data) => api.put(`/investments/${id}`, data),
  remove: (id) => api.delete(`/investments/${id}`),
  addValuation: (id, data) => api.post(`/investments/${id}/valuation`, data),
  sync: () => api.post('/investments/sync'),
  getHistory: () => api.get('/investments/history')
};
