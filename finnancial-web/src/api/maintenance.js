import api from './axios';

export const maintenanceApi = {
  recalculateBalances: () => api.post('/maintenance/recalculate-balances'),
  recalculateAll: () => api.post('/maintenance/recalculate-balances'),
  recalculateAccount: (accountId) => api.post(`/maintenance/recalculate-account/${accountId}`),
  adjustBalance: (accountId, targetBalance) => api.post('/maintenance/adjust-balance', { accountId, targetBalance }),
  checkConsistency: () => api.get('/maintenance/consistency/check'),
};
