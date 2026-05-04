import api from './axios';

export const reportsApi = {
  monthly: (year) => api.get('/reports/monthly', { params: { year } }),
  categoryEvolution: (categoryId, months = 6) =>
    api.get('/reports/category-evolution', { params: { category_id: categoryId, months } }),
};
