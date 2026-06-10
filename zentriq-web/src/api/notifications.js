import api from './axios';

export const notificationsApi = {
  list: () => api.get('/notifications'),
  sync: () => api.post('/notifications/sync'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
};
