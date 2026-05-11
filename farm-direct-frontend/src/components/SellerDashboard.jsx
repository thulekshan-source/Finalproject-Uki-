// SellerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaStore, FaBox, FaShoppingBag, FaMoneyBillWave,
  FaStar, FaChartLine, FaTruck, FaUsers,
  FaPlus, FaFileInvoice
} from 'react-icons/fa';

const SellerDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProducts(mockSellerProducts);
      setOrders(mockSellerOrders);
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.active).length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalRevenue: 'RS 78,450',
    averageRating: 4.5,
    totalCustomers: 124,
    completionRate: '98%'
  };

  if (loading) {
    return (
      <div className="seller-loading">
        <div className="spinner"></div>
        <p>Loading seller dashboard...</p>
      </div>
    );
  }

  return (
    <div className="seller-dashboard">
      <div className="seller-header">
        <div className="seller-info">
          <div className="seller-avatar">
            <FaStore />
          </div>
          <div className="seller-details">
            <h1>Green Valley Farm</h1>
            <p className="seller-meta">
              <span><FaStar /> 4.5 (89 reviews)</span>
              <span><FaUsers /> 124 customers</span>
              <span><FaTruck /> Member since 2024</span>
            </p>
          </div>
        </div>
        <div className="seller-actions">
          <button className="btn-primary">
            <FaPlus /> Add Product
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="seller-stats">
        <div className="stat-card">
          <FaBox className="stat-icon" />
          <div className="stat-content">
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
            <span className="stat-sub">{stats.activeProducts} active</span>
          </div>
        </div>

        <div className="stat-card">
          <FaShoppingBag className="stat-icon" />
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
            <span className="stat-sub">{stats.pendingOrders} pending</span>
          </div>
        </div>

        <div className="stat-card">
          <FaMoneyBillWave className="stat-icon" />
          <div className="stat-content">
            <h3>{stats.totalRevenue}</h3>
            <p>Total Revenue</p>
            <span className="stat-sub">+12.5% this month</span>
          </div>
        </div>

        <div className="stat-card">
          <FaChartLine className="stat-icon" />
          <div className="stat-content">
            <h3>{stats.completionRate}</h3>
            <p>Order Completion</p>
            <span className="stat-sub">Excellent</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="seller-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          My Products
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'payouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('payouts')}
        >
          Payouts
        </button>
      </div>

      {/* Tab Content */}
      <div className="seller-tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="recent-orders">
              <h3>Recent Orders</h3>
              <div className="orders-list">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="order-row">
                    <span className="order-id">#{order.id}</span>
                    <span className="customer">{order.customer}</span>
                    <span className="amount">RS{order.total}</span>
                    <span className={`status ${order.status}`}>{order.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button className="action-card">
                  <FaPlus /> Add Product
                </button>
                <button className="action-card">
                  <FaFileInvoice /> View Invoices
                </button>
                <button className="action-card">
                  <FaTruck /> Update Shipping
                </button>
                <button className="action-card">
                  <FaChartLine /> View Reports
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const mockSellerProducts = [
  { id: 1, name: 'Fresh Apples', price: 120, stock: 50, active: true },
  { id: 2, name: 'Organic Bananas', price: 60, stock: 100, active: true },
  { id: 3, name: 'Fresh Strawberries', price: 180, stock: 25, active: true },
];

const mockSellerOrders = [
  { id: '1001', customer: 'John Doe', total: 450, status: 'pending', date: '2024-02-10' },
  { id: '1002', customer: 'Jane Smith', total: 890, status: 'shipped', date: '2024-02-09' },
  { id: '1003', customer: 'Bob Wilson', total: 230, status: 'delivered', date: '2024-02-08' },
];

export default SellerDashboard;