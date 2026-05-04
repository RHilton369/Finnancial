import api from './axios';

export const recurringApi = {
  list: () => api.get('/recurring'),
  create: (data) => api.post('/recurring', data),
  update: (id, data) => api.put(`/recurring/${id}`, data),
  remove: (id) => api.delete(`/recurring/${id}`),
  process: () => api.post('/recurring/process'),
};
