import api from './axios';

export const dashboardApi = {
  summary: (month, year) => api.get('/dashboard/summary', { params: { month, year } }),
  cashflow: (months = 6) => api.get('/dashboard/cashflow', { params: { months } }),
  byCategory: (month, year) => api.get('/dashboard/by-category', { params: { month, year } }),
  dailySpending: (month, year) => api.get('/dashboard/daily-spending', { params: { month, year } }),
};
