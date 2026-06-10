import api from './axios';

export const chatApi = {
  list: () => api.get('/chat'),
  send: (message) => api.post('/chat', { message }),
  clear: () => api.delete('/chat')
};
