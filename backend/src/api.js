const axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth Services
export const authAPI = {
  register: async (userData) => {
    return api.post('/auth/register', userData);
  },

  login: async (credentials) => {
    return api.post('/auth/login', credentials);
  },

  logout: async () => {
    return api.get('/auth/logout');
  },

  forgotPassword: async (email) => {
    return api.post('/auth/forgotpassword', { email });
  },

  resetPassword: async (token, password) => {
    return api.put(`/auth/resetpassword/${token}`, { password });
  },

  getMe: async () => {
    return api.get('/auth/me');
  }
};

// Product Services
export const productAPI = {
  getProducts: async (params = {}) => {
    return api.get('/products', { params });
  },

  getProductById: async (id) => {
    return api.get(`/products/${id}`);
  },

  createProduct: async (productData) => {
    return api.post('/products', productData);
  },

  updateProduct: async (id, productData) => {
    return api.put(`/products/${id}`, productData);
  },

  deleteProduct: async (id) => {
    return api.delete(`/products/${id}`);
  },

  getProductsByCategory: async (category) => {
    return api.get(`/products/category/${category}`);
  },

  getFeaturedProducts: async () => {
    return api.get('/products/featured');
  },

  getProductsByFarmer: async (farmerId) => {
    return api.get(`/products/farmer/${farmerId}`);
  }
};

// User Services
export const userAPI = {
  getProfile: async () => {
    return api.get('/users/profile');
  },

  updateProfile: async (userData) => {
    return api.put('/users/profile', userData);
  },

  updateProfileImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.put('/users/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  getDashboardStats: async () => {
    return api.get('/users/dashboard');
  }
};

// Order Services
export const orderAPI = {
  createOrder: async (orderData) => {
    return api.post('/orders', orderData);
  },

  getMyOrders: async () => {
    return api.get('/orders/myorders');
  },

  getOrderById: async (id) => {
    return api.get(`/orders/${id}`);
  },

  updateOrderStatus: async (id, status) => {
    return api.put(`/orders/${id}/status`, { status });
  },

  cancelOrder: async (id) => {
    return api.put(`/orders/${id}/cancel`);
  },

  getFarmerOrders: async () => {
    return api.get('/orders/farmerorders');
  }
};

// Contact/General API
export const contactAPI = {
  submitContact: async (formData) => {
    return api.post('/contact', formData);
  }
};

export default api;