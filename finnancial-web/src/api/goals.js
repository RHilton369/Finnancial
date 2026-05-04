import api from './axios';

export const goalsApi = {
  list: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  remove: (id) => api.delete(`/goals/${id}`),
  deposit: (id, data) => api.patch(`/goals/${id}/deposit`, data),
};
