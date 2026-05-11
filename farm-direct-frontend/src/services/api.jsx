import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Auto logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (currentPassword, newPassword) => 
    api.put('/auth/updatepassword', { currentPassword, newPassword }),
};

export const productAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured'),
  getBestSellers: () => api.get('/products/best-sellers'),
  getByCategory: (category) => api.get(`/products/category/${category}`),
  getByFarmer: (farmerId) => api.get(`/products/farmer/${farmerId}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  updateStock: (id, stock) => api.patch(`/products/${id}/stock`, { stock }),
};

export const orderAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getMyOrders: () => api.get('/orders/myorders'),
  getFarmerOrders: () => api.get('/orders/farmer/orders'),
  getOne: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getDashboard: () => api.get('/users/dashboard'),
  getOrders: () => api.get('/users/orders'),
  getProducts: () => api.get('/users/products'),
  getFavorites: () => api.get('/users/favorites'),
  addFavorite: (productId) => api.post(`/users/favorites/${productId}`),
  removeFavorite: (productId) => api.delete(`/users/favorites/${productId}`),
};

export const contactAPI = {
  submit: (formData) => api.post('/contact', formData),
};

export const adminAPI = {
  getUsers: () => api.get('/users?limit=1000'),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  getOrders: () => api.get('/orders/admin/all'),
  getOrderStats: () => api.get('/orders/admin/stats'),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

export default api;