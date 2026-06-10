import api from './axios';

export const budgetsApi = {
  list: (month, year) => api.get('/budgets', { params: { month, year } }),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  remove: (id) => api.delete(`/budgets/${id}`),
};
