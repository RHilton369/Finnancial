import api from './axios';

export const accountsApi = {
  list: () => api.get('/accounts'),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  remove: (id) => api.delete(`/accounts/${id}`),
  getInvoice: (id) => api.get(`/accounts/${id}/invoice`),
};
