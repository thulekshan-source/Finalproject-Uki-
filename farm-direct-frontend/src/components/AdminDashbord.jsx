import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaShoppingBag, 
  FaMoneyBillWave, FaCheckCircle, FaTimesCircle,
  FaEye, FaEdit, FaBox,
  FaUserTie, FaExclamationTriangle, FaDownload
} from 'react-icons/fa';
import { adminAPI, productAPI } from '../services/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [farmers, setFarmers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingApprovals: 0,
    totalRevenue: 'RS0',
    monthlyGrowth: '+0%',
    activeUsers: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [usersRes, productsRes, ordersRes, statsRes] = await Promise.all([
        adminAPI.getUsers().catch(() => ({ data: { data: [] } })),
        productAPI.getAll({ limit: 1000 }).catch(() => ({ data: { data: [] } })),
        adminAPI.getOrders().catch(() => ({ data: { data: [] } })),
        adminAPI.getOrderStats().catch(() => ({ data: { data: { overall: {} } } }))
      ]);

      const allUsers = usersRes.data?.data || [];
      const allProducts = productsRes.data?.data || [];
      const allOrders = ordersRes.data?.data || [];
      const overallStats = statsRes.data?.data?.overall || {};

      const verifiedFarmers = allUsers.filter(u => u.userType === 'farmer' && u.isVerified);
      const pendingFarmers = allUsers.filter(u => u.userType === 'farmer' && !u.isVerified);
      const regularCustomers = allUsers.filter(u => u.userType === 'customer');

      setFarmers(verifiedFarmers.map(f => ({
        id: f._id, 
        name: f.name, 
        email: f.email, 
        farmName: f.farmName || 'N/A', 
        productCount: allProducts.filter(p => p.farmer?._id === f._id || p.farmer === f._id).length, 
        joinedDate: new Date(f.createdAt).toLocaleDateString(), 
        status: f.isActive ? 'active' : 'suspended', 
        revenue: 'Calculated API' 
      })));

      setPendingApprovals(pendingFarmers.map(f => ({
        id: f._id, 
        name: f.name, 
        email: f.email, 
        farmName: f.farmName || 'N/A', 
        phone: f.phone || 'N/A', 
        location: f.location || 'N/A', 
        productCount: allProducts.filter(p => p.farmer?._id === f._id || p.farmer === f._id).length
      })));

      setCustomers(regularCustomers.map(c => ({
        id: c._id, 
        name: c.name, 
        email: c.email, 
        orders: allOrders.filter(o => o.user?._id === c._id).length, 
        joinedDate: new Date(c.createdAt).toLocaleDateString(), 
        status: c.isActive ? 'active' : 'suspended', 
        spent: 'Calculated' 
      })));

      setProducts(allProducts.map(p => {
        const farmerName = typeof p.farmer === 'object' ? (p.farmer.farmName || p.farmer.name) : p.farmer;
        return {
          id: p._id, 
          name: p.name, 
          farmer: farmerName, 
          price: `RS${p.price}`, 
          stock: p.stock, 
          status: p.isAvailable ? 'active' : 'inactive', 
          category: p.category
        };
      }));

      setOrders(allOrders.map(o => ({
        id: o._id, 
        customer: o.user ? o.user.name : 'Unknown', 
        amount: `RS${o.totalPrice}`, 
        status: o.orderStatus, 
        date: new Date(o.createdAt).toLocaleDateString()
      })));

      setStats({
        totalFarmers: verifiedFarmers.length,
        totalCustomers: regularCustomers.length,
        totalProducts: allProducts.length,
        totalOrders: allOrders.length,
        pendingApprovals: pendingFarmers.length,
        totalRevenue: `RS${overallStats.totalSales || 0}`,
        monthlyGrowth: '+0%',
        activeUsers: verifiedFarmers.length + regularCustomers.length
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveFarmer = async (farmerId) => {
    try {
      await adminAPI.updateUser(farmerId, { isVerified: true, isActive: true });
      fetchDashboardData();
    } catch (error) {
      alert("Error approving farmer. Check console.");
      console.error(error);
    }
  };

  const handleRejectFarmer = async (farmerId) => {
    if (window.confirm("Are you sure you want to reject and delete this farmer application?")) {
      try {
        await adminAPI.deleteUser(farmerId);
        fetchDashboardData();
      } catch (error) {
        alert("Error rejecting farmer. Check console.");
        console.error(error);
      }
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard container">
      <div className="admin-header mt-5">
        <div className="admin-header-left">
          <h1>Admin Dashboard</h1>
          <p className="welcome-text">Welcome back, {user?.name || user?.email?.split('@')[0] || 'Admin'}</p>
        </div>
        <div className="admin-header-right">
          <button className="btn-export">
            <FaDownload /> Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon farmers">
            <FaUserTie />
          </div>
          <div className="stat-content">
            <h3>{stats.totalFarmers}</h3>
            <p>Total Farmers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon customers">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>{stats.totalCustomers}</h3>
            <p>Total Customers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon products">
            <FaBox />
          </div>
          <div className="stat-content">
            <h3>{stats.totalProducts}</h3>
            <p>Active Products</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">
            <FaShoppingBag />
          </div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <FaMoneyBillWave />
          </div>
          <div className="stat-content">
            <h3>{stats.totalRevenue}</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon pending">
            <FaExclamationTriangle />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingApprovals}</h3>
            <p>Pending Approvals</p>
            <span className="stat-trend">Requires action</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'farmers' ? 'active' : ''}`}
          onClick={() => setActiveTab('farmers')}
        >
          Farmers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button 
          className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          Approvals {pendingApprovals.length > 0 && 
            <span className="badge">{pendingApprovals.length}</span>
          }
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-tab-content mb-5">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="chart-section" style={{marginBottom: "20px"}}>
              <h3>Platform Analytics</h3>
              <p>Platform overall statistics overview.</p>
              <ul>
                <li><strong>Active Farmers:</strong> {stats.totalFarmers}</li>
                <li><strong>Registered Customers:</strong> {stats.totalCustomers}</li>
                <li><strong>Pending Farmers:</strong> {stats.pendingApprovals}</li>
                <li><strong>Total Products:</strong> {stats.totalProducts}</li>
                <li><strong>Total Orders:</strong> {stats.totalOrders}</li>
                <li><strong>Total Volume (Sales):</strong> {stats.totalRevenue}</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'farmers' && (
          <div className="farmers-tab">
            <div className="table-header">
              <h3>Registered Farmers ({farmers.length})</h3>
            </div>
            
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Farm Name</th>
                  <th>Products</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {farmers.map(farmer => (
                  <tr key={farmer.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">{farmer.name.charAt(0)}</div>
                        <div>
                          <div className="user-name">{farmer.name}</div>
                          <div className="user-email">{farmer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{farmer.farmName}</td>
                    <td>{farmer.productCount}</td>
                    <td>{farmer.joinedDate}</td>
                    <td>
                      <span className={`status-badge ${farmer.status}`}>
                        {farmer.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn delete" title="Suspend" onClick={() => handleRejectFarmer(farmer.id)}>
                        <FaTimesCircle />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {farmers.length === 0 && <p className="mt-3">No verified farmers found.</p>}
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="farmers-tab">
            <div className="table-header">
              <h3>Registered Customers ({customers.length})</h3>
            </div>
            
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Orders</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar" style={{background: "#3abf4b"}}>{customer.name.charAt(0)}</div>
                        <div>
                          <div className="user-name">{customer.name}</div>
                          <div className="user-email">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{customer.orders}</td>
                    <td>{customer.joinedDate}</td>
                    <td>
                      <span className={`status-badge ${customer.status}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td>
                       <button className="action-btn delete" title="Suspend" onClick={() => handleRejectFarmer(customer.id)}>
                        <FaTimesCircle />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {customers.length === 0 && <p className="mt-3">No customers found.</p>}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="farmers-tab">
            <div className="table-header">
              <h3>All Products ({products.length})</h3>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Farmer</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.farmer}</td>
                    <td>{product.price}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className={`status-badge ${product.status}`}>
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && <p className="mt-3">No products found.</p>}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="farmers-tab">
             <div className="table-header">
              <h3>All Orders ({orders.length})</h3>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id.toString().substring(0, 8)}</td>
                    <td>{order.customer}</td>
                    <td>{order.date}</td>
                    <td>{order.amount}</td>
                    <td>
                      <span className={`status-badge ${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
             {orders.length === 0 && <p className="mt-3">No orders found.</p>}
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="approvals-tab">
            <h3>Pending Farmer Approvals ({pendingApprovals.length})</h3>
            <div className="approvals-grid">
              {pendingApprovals.map(farmer => (
                <div key={farmer.id} className="approval-card">
                  <div className="approval-header">
                    <div className="approval-avatar">{farmer.name.charAt(0)}</div>
                    <div className="approval-info">
                      <h4>{farmer.name}</h4>
                      <p className="farm-name">{farmer.farmName}</p>
                    </div>
                  </div>
                  
                  <div className="approval-details">
                    <div className="detail-item">
                      <span>Email:</span>
                      <strong>{farmer.email}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Phone:</span>
                      <strong>{farmer.phone}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Location:</span>
                      <strong>{farmer.location}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Products:</span>
                      <strong>{farmer.productCount}</strong>
                    </div>
                  </div>

                  <div className="approval-docs">
                    <h5>Verification required</h5>
                    <p>Approve this farmer so they can start selling.</p>
                  </div>

                  <div className="approval-actions">
                    <button 
                      className="btn-approve"
                      onClick={() => handleApproveFarmer(farmer.id)}
                    >
                      <FaCheckCircle /> Approve
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => handleRejectFarmer(farmer.id)}
                    >
                      <FaTimesCircle /> Reject
                    </button>
                  </div>
                </div>
              ))}
              {pendingApprovals.length === 0 && <p className="mt-3">No pending farmer approvals.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;