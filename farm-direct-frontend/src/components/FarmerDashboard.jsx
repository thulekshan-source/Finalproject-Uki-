import React, { useState, useEffect } from 'react';
import '../styles/FarmerDashboard.css';
import { 
  FaPlus, FaEdit, FaTrash, FaBox, FaShoppingCart,
  FaMoneyBillWave, FaStar,
  FaToggleOn, FaToggleOff, FaTimes, FaLeaf
} from 'react-icons/fa';
import { productAPI, orderAPI, userAPI } from '../services/api';

const FarmerDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    fetchFarmerData();
  }, []);

  const fetchFarmerData = async () => {
    setLoading(true);
    try {
      const farmerId = user?._id || user?.id;
      if (!farmerId) return;

      const [prodRes, orderRes, statRes, profileRes] = await Promise.all([
        productAPI.getByFarmer(farmerId),
        orderAPI.getFarmerOrders(),
        fetch('http://localhost:5000/api/orders/farmer/stats', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()).catch(() => ({ data: { overall: {} } })),
        userAPI.getProfile().catch(() => null)
      ]);

      let fetchedProducts = [];
      let fetchedOrders = [];

      if (prodRes.data?.success) {
        fetchedProducts = prodRes.data.data;
        setProducts(fetchedProducts);
      }
      
      if (orderRes.data?.success) {
        fetchedOrders = orderRes.data.data;
        setOrders(fetchedOrders);
      }
      if (profileRes?.data?.success) {
        setCurrentUser(profileRes.data.data);
      }
      
      const totalOrders = fetchedOrders.length;
      let totalSales = 0;
      if (statRes && statRes.data && statRes.data.overall && statRes.data.overall.totalSales) {
          totalSales = statRes.data.overall.totalSales;
      } else {
          const revenueStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];
          totalSales = fetchedOrders
            .filter(o => revenueStatuses.includes(o.orderStatus))
            .reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      }
      
      const totalStock = fetchedProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
      const storageLimit = currentUser?.storageLimit || 1000;

      setStats({
        totalProducts: fetchedProducts.length,
        totalOrders,
        totalSales: `RS ${totalSales.toLocaleString()}`,
        avgRating: 4.6,
        pendingOrders: fetchedOrders.filter(o => o.orderStatus === 'pending').length,
        lowStock: fetchedProducts.filter(p => p.stock < 20).length,
        totalStock,
        storageLimit,
        storageUsage: Math.min(100, Math.round((totalStock / storageLimit) * 100))
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProductStatus = async (productId) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    try {
      const res = await productAPI.update(productId, { isAvailable: !product.isAvailable });
      if (res.data.success) {
         setProducts(products.map(p => p._id === productId ? { ...p, isAvailable: !p.isAvailable } : p));
      }
    } catch (err) {
      alert('Failed to update product status');
    }
  };
  
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(productId);
        setProducts(products.filter(p => p._id !== productId));
      } catch (err) {
        alert('Failed to delete product');
      }
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      const formData = new FormData();
      
      // Basic fields
      Object.keys(productData).forEach(key => {
        // Skip specific fields that need special handling or are internal
        if (key !== 'imageFile' && key !== 'image' && key !== 'images' && key !== '_id') {
          formData.append(key, productData[key]);
        }
      });

      // Handle image
      if (productData.imageFile) {
        // If a new file is uploaded, send it as 'images' (backend expects array-like field 'images')
        formData.append('images', productData.imageFile);
      } else if (productData.image) {
        // If no new file but a URL is provided (existing or new), send it
        formData.append('images', productData.image);
      } else if (!editingProduct) {
        // Default image for new products if nothing is provided
        formData.append('images', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600');
      }
      
      if (editingProduct) {
        const id = editingProduct._id;
        const res = await productAPI.update(id, formData);
        if (res.data.success) {
           setProducts(products.map(p => p._id === id ? res.data.data : p));
        }
      } else {
        const res = await productAPI.create(formData);
        if (res.data.success) {
           setProducts([res.data.data, ...products]);
        }
      }
      
      fetchFarmerData();
    } catch (err) {
      console.error(err);
      alert('Failed to save product. Check required fields, like description (min 10 chars).');
      throw err;
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await orderAPI.updateStatus(orderId, status);
      if (res.data.success) {
         setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: status } : o));
         fetchFarmerData();
      }
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const getProductImage = (product) => {
    const img = product.image || (product.images && product.images[0]);
    if (!img) return 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600';
    if (img.startsWith('http')) return img;
    // For local uploads from backend
    return `http://localhost:5000${img.startsWith('/') ? '' : '/'}${img}`;
  };

  if (loading) {
    return (
      <div className="fd-loading-wrap">
        <div className="fd-spinner-large"></div>
        <p>Loading your farm dashboard...</p>
      </div>
    );
  }

  const farmName = currentUser?.farmName || currentUser?.name || currentUser?.email?.split('@')[0] || 'Roots Farm';

  return (
    <div className="fd-dashboard">
      <aside className="fd-sidebar">
        <div className="fd-sidebar-brand">
          <FaLeaf className="fd-sidebar-brand-icon" />
          <h2>FreshFarm</h2>
        </div>
        
        <nav className="fd-nav">
          <button className={`fd-nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            <FaBox className="fd-nav-icon" /> <span>My Products</span>
          </button>
          <button className={`fd-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <FaShoppingCart className="fd-nav-icon" /> <span>Orders</span>
          </button>
          <button className={`fd-nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <FaMoneyBillWave className="fd-nav-icon" /> <span>Analytics</span>
          </button>
        </nav>

        <div className="fd-user-profile">
          <div className="fd-avatar">{farmName.charAt(0).toUpperCase()}</div>
          <div className="fd-user-info">
            <p>{farmName}</p>
            {currentUser?.isVerified ? (
              <span className="fd-verified-badge">Verified Farmer</span>
            ) : (
              <span className="fd-pending-badge">Verification Pending</span>
            )}
          </div>
        </div>
      </aside>

      <main className="fd-main">
        <header className="fd-header">
          <div className="fd-welcome">
            <h1>Welcome back, <span>{farmName}</span>!</h1>
            <p>Here's what's happening on your farm today.</p>
          </div>
          <div className="fd-header-actions">
            <button className="fd-btn fd-btn-primary" onClick={() => { setEditingProduct(null); setShowAddProduct(true); }}>
              <FaPlus /> Add Product
            </button>
          </div>
        </header>

        <div className="fd-stats-grid">
          <div className="fd-stat-card">
            <div className="fd-stat-icon products"><FaBox /></div>
            <div className="fd-stat-content">
              <h3>{stats.totalProducts}</h3>
              <p>Total Products</p>
              <span className="fd-stat-detail">{stats.lowStock} low stock</span>
            </div>
          </div>
          <div className="fd-stat-card">
            <div className="fd-stat-icon orders"><FaShoppingCart /></div>
            <div className="fd-stat-content">
              <h3>{stats.totalOrders}</h3>
              <p>Total Orders</p>
              <span className="fd-stat-detail warning">{stats.pendingOrders} pending</span>
            </div>
          </div>
          <div className="fd-stat-card">
            <div className="fd-stat-icon revenue"><FaMoneyBillWave /></div>
            <div className="fd-stat-content">
              <h3>{stats.totalSales}</h3>
              <p>Total Revenue</p>
              <span className="fd-stat-detail">This month</span>
            </div>
          </div>
          <div className="fd-stat-card">
            <div className="fd-stat-icon products" style={{backgroundColor: stats.storageUsage > 90 ? '#ff4d4d' : '#4caf50'}}><FaBox /></div>
            <div className="fd-stat-content">
              <h3>{stats.totalStock} / {stats.storageLimit}</h3>
              <p>Storage Units Used</p>
              <div className="storage-progress-bar" style={{
                width: '100%', 
                height: '8px', 
                backgroundColor: '#eee', 
                borderRadius: '4px', 
                marginTop: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${stats.storageUsage}%`,
                  height: '100%',
                  backgroundColor: stats.storageUsage > 90 ? '#ff4d4d' : '#4caf50',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <span className="fd-stat-detail">{stats.storageUsage}% capacity used</span>
            </div>
          </div>
        </div>

        <section className="fd-content-area">
          {activeTab === 'products' && (
            <div>
              <div className="fd-section-header">
                <h2>Browse Inventory</h2>
                <div className="fd-filter-bar">
                  <input type="text" placeholder="Search products..." className="fd-search-input" />
                  <select className="fd-select">
                    <option>All Categories</option>
                    <option>Vegetables</option>
                    <option>Fruits</option>
                  </select>
                </div>
              </div>
              
              <div className="fd-products-grid">
                {products.map(product => (
                  <div key={product._id} className="fd-product-card">
                    {product.isOrganic && <span className="fd-badge">Organic</span>}
                    <button className={`fd-toggle-btn ${!product.isAvailable ? 'inactive' : ''}`} onClick={() => handleToggleProductStatus(product._id)}>
                      {product.isAvailable ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                    <div className="fd-product-img">
                      <img src={getProductImage(product)} alt={product.name} />
                    </div>
                    <div className="fd-product-info">
                      <h3>{product.name}</h3>
                      <p className="fd-category">{product.category}</p>
                      <div className="fd-price-row">
                        <span><span className="fd-price">RS {product.price}</span> <span className="fd-unit">/{product.unit}</span></span>
                        <span className={`fd-stock-info ${product.stock < 20 ? 'low' : ''}`}>Stock: {product.stock}</span>
                      </div>
                      <div className="fd-product-actions">
                        <button className="fd-action-btn edit" onClick={() => { setEditingProduct(product); setShowAddProduct(true); }}>
                          <FaEdit /> Edit
                        </button>
                        <button className="fd-action-btn delete" onClick={() => handleDeleteProduct(product._id)}>
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div className="fd-section-header">
                <h2>Recent Orders</h2>
              </div>
              <div className="fd-orders-list">
                {orders.map(order => (
                  <div key={order._id} className={`fd-order-card ${order.orderStatus}`}>
                    <div className="fd-order-header">
                      <span className="fd-order-id">#{order._id.substring(0, 8)}</span>
                      <span className={`fd-order-status ${order.orderStatus}`}>{order.orderStatus}</span>
                    </div>
                    <div className="fd-order-body">
                      <div className="fd-customer-info">
                        <h4>{order.user ? order.user.name : 'Unknown Customer'}</h4>
                        <span className="fd-order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="fd-order-items">
                        {order.items.map((item, i) => (
                          <div key={i} className="fd-order-item">
                            <span>{item.name} <span style={{opacity: 0.6}}>x{item.quantity}</span></span>
                            <strong>RS {item.totalPrice}</strong>
                          </div>
                        ))}
                      </div>
                      <div className="fd-order-total-block">
                        <span className="fd-order-total">RS {order.totalPrice}</span>
                        
                        {order.orderStatus === 'pending' && (
                          <button 
                            className="fd-btn fd-btn-primary" 
                            style={{marginLeft: '10px', padding: '6px 12px', fontSize: '13px', borderRadius: '8px'}}
                            onClick={() => updateOrderStatus(order._id, 'confirmed')}
                          >
                            Confirm Order
                          </button>
                        )}

                        <select 
                          className="fd-select" 
                          style={{marginLeft: '10px'}}
                          value={order.orderStatus}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        >
                           <option value="pending">Pending</option>
                           <option value="confirmed">Confirmed</option>
                           <option value="processing">Processing</option>
                           <option value="shipped">Shipped</option>
                           <option value="delivered">Delivered</option>
                           <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {showAddProduct && (
        <ProductModal 
          product={editingProduct} 
          onClose={() => { setShowAddProduct(false); setEditingProduct(null); }} 
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
};

const ProductModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState(() => {
    if (product) {
       return {
         ...product,
         image: product.image || (product.images && product.images[0]) || ''
       };
    }
    return {
      name: '',
      category: 'vegetables',
      price: '',
      stock: '',
      unit: 'kg',
      description: '',
      image: ''
    };
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fd-modal-overlay" onClick={onClose}>
      <div className="fd-modal-content" onClick={e => e.stopPropagation()}>
        <div className="fd-modal-header">
          <h2>{product ? 'Edit Product' : 'New Product'}</h2>
          <button className="fd-modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="fd-modal-body">
            <div className="fd-form-group">
              <label className="fd-label">Product Name</label>
              <input type="text" name="name" className="fd-input" value={formData.name} onChange={handleChange} placeholder="e.g. Organic Tomatoes" required minLength={3} />
            </div>
            
            <div className="fd-form-group">
              <label className="fd-label">Description</label>
              <textarea name="description" className="fd-input" value={formData.description} onChange={handleChange} placeholder="Product description..." required minLength={10}></textarea>
            </div>

            <div className="fd-form-row">
              <div className="fd-form-group">
                <label className="fd-label">Category</label>
                <select name="category" className="fd-select-modal" value={formData.category} onChange={handleChange} required>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="dairy">Dairy</option>
                  <option value="grains">Grains</option>
                  <option value="poultry">Poultry</option>
                  <option value="others">Others</option>
                </select>
              </div>
              <div className="fd-form-group">
                 <label className="fd-label">Price (RS)</label>
                 <input type="number" name="price" className="fd-input" value={formData.price} onChange={handleChange} required min={0} />
              </div>
            </div>
            
            <div className="fd-form-row">
              <div className="fd-form-group">
                 <label className="fd-label">Stock Quantity</label>
                 <input type="number" name="stock" className="fd-input" value={formData.stock} onChange={handleChange} required min={0} />
              </div>
              <div className="fd-form-group">
                <label className="fd-label">Unit</label>
                <select name="unit" className="fd-select-modal" value={formData.unit} onChange={handleChange} required>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="liter">liter</option>
                  <option value="piece">piece</option>
                  <option value="dozen">dozen</option>
                  <option value="pack">pack</option>
                </select>
              </div>
            </div>

            <div className="fd-form-group">
              <label className="fd-label">Product Image</label>
              
              <div className="fd-image-options" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* File Upload */}
                <div className="fd-file-upload">
                  <input 
                    type="file" 
                    id="fd-image-upload" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setFormData({ ...formData, imageFile: file, image: '' });
                      }
                    }} 
                  />
                  <label 
                    htmlFor="fd-image-upload" 
                    className="fd-btn fd-btn-outline" 
                    style={{ 
                      width: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px',
                      cursor: 'pointer',
                      padding: '10px'
                    }}
                  >
                    <FaBox /> {formData.imageFile ? formData.imageFile.name : 'Choose from computer'}
                  </label>
                </div>

                <div style={{ textAlign: 'center', fontSize: '12px', color: '#888' }}>— OR —</div>

                {/* URL Input */}
                <input 
                  type="url" 
                  name="image" 
                  className="fd-input" 
                  value={formData.image} 
                  onChange={(e) => {
                    setFormData({ ...formData, image: e.target.value, imageFile: null });
                  }} 
                  placeholder="Paste image URL here..." 
                />
              </div>

              {/* Preview */}
              {(formData.image || formData.imageFile) && (
                <div className="fd-image-preview-wrap" style={{ marginTop: '15px', textAlign: 'center' }}>
                  <img 
                    src={formData.imageFile ? URL.createObjectURL(formData.imageFile) : (formData.image.startsWith('/') ? `http://localhost:5000${formData.image}` : formData.image)} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                  <p style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>Image Preview</p>
                </div>
              )}
            </div>

          </div>
          <div className="fd-modal-footer">
            <button type="button" className="fd-btn fd-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="fd-btn fd-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (product ? 'Save Changes' : 'Publish Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FarmerDashboard;