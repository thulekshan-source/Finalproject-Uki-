import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaCreditCard, FaTruck, FaMoneyBillWave, FaBuilding, FaTrash, FaPlus, FaMinus, FaArrowLeft } from 'react-icons/fa';
import { orderAPI } from '../services/api';

const Checkout = ({ cartItems, onOrderSuccess, updateQuantity, removeFromCart }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', phone: '', address: '', city: '',
    state: '', postalCode: '', instructions: '',
    paymentMethod: 'cash_on_delivery'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      // Don't auto-navigate if it's empty, let the empty state show or handled by component
    }
  }, [cartItems, navigate]);

  const totals = () => {
    const itemsPrice = cartItems.reduce((t, i) => t + i.price * i.quantity, 0);
    // free shipping threshold changed to Rs. 1000 matching backend model
    const shippingPrice = itemsPrice > 1000 ? 0 : itemsPrice > 500 ? 20 : 50;
    const taxPrice = itemsPrice * 0.05;
    return {
      itemsPrice: itemsPrice.toFixed(2),
      shippingPrice: shippingPrice.toFixed(2),
      taxPrice: taxPrice.toFixed(2),
      totalPrice: (itemsPrice + shippingPrice + taxPrice).toFixed(2),
    };
  };

  const t = totals();

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address || !formData.city) {
      setError('Please fill all required fields');
      return;
    }
    if (formData.phone.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: cartItems.map(item => ({
          product: item._id || item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit || 'piece',
          // use images array first item, fall back to image string
          image: Array.isArray(item.images) ? item.images[0] : (item.image || ''),
        })),
        shippingAddress: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          instructions: formData.instructions,
        },
        paymentMethod: formData.paymentMethod,
        notes: formData.instructions,
      };

      const response = await orderAPI.create(orderData);

      if (response.data.success) {
        if (onOrderSuccess) onOrderSuccess();
        alert('Order placed successfully!');
        navigate('/my-orders');
      } else {
        setError(response.data.message || 'Failed to place order');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Network error. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!cartItems) return null;

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <FaArrowLeft /> Continue Shopping
          </button>
          <h1>Secure Checkout</h1>
        </div>

        {error && <div className="error-message"><span></span> {error}</div>}

        {cartItems.length === 0 ? (
          <div className="empty-checkout">
            <div className="empty-icon"><FaShoppingCart /></div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <button className="place-order-btn" onClick={() => navigate('/')} style={{ marginTop: '20px', maxWidth: '250px' }}>
              Go to Marketplace
            </button>
          </div>
        ) : (
          <div className="checkout-grid">
            {/* Checkout Form (Left side) */}
            <div className="checkout-form">
              <form onSubmit={handleSubmit} id="checkout-form">
                
                <div className="form-section">
                  <h3><FaUser /> Shipping Information</h3>
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input type="text" id="name" name="name" value={formData.name}
                      onChange={handleChange} placeholder="Enter your full name" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone}
                      onChange={handleChange} placeholder="+94 7X XXX XXXX" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address">Address *</label>
                    <textarea id="address" name="address" value={formData.address}
                      onChange={handleChange} placeholder="Enter your complete street address" rows="2" required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">City *</label>
                      <input type="text" id="city" name="city" value={formData.city}
                        onChange={handleChange} placeholder="Colombo, Kandy, etc." required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="state">Province / State</label>
                      <input type="text" id="state" name="state" value={formData.state}
                        onChange={handleChange} placeholder="Western Province" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="postalCode">Postal Code</label>
                      <input type="text" id="postalCode" name="postalCode" value={formData.postalCode}
                        onChange={handleChange} placeholder="00100" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="instructions">Delivery Instructions</label>
                      <input type="text" id="instructions" name="instructions" value={formData.instructions}
                        onChange={handleChange} placeholder="Leave at door / Call me" />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3><FaCreditCard /> Payment Method</h3>
                  <div className="payment-options">
                    <label className="payment-option">
                      <input type="radio" name="paymentMethod" value="cash_on_delivery"
                        checked={formData.paymentMethod === 'cash_on_delivery'} onChange={handleChange} />
                      <div className="payment-content">
                        <div className="payment-icon"><FaMoneyBillWave /></div>
                        <div className="payment-info">
                          <h4>Cash on Delivery</h4>
                          <p>Pay when you receive your order right at your door.</p>
                        </div>
                      </div>
                    </label>
                    <label className="payment-option">
                      <input type="radio" name="paymentMethod" value="online_banking"
                        checked={formData.paymentMethod === 'online_banking'} onChange={handleChange} />
                      <div className="payment-content">
                        <div className="payment-icon"><FaBuilding /></div>
                        <div className="payment-info">
                          <h4>Online Banking</h4>
                          <p>Make a bank transfer securely directly to our account.</p>
                        </div>
                      </div>
                    </label>
                    <label className="payment-option" style={{opacity: 0.5}}>
                      <input type="radio" name="paymentMethod" value="card" disabled />
                      <div className="payment-content">
                        <div className="payment-icon"><FaCreditCard /></div>
                        <div className="payment-info">
                          <h4>Credit/Debit Card (Coming Soon)</h4>
                          <p>Gateway integrations are currently being verified.</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

              </form>
            </div>

            {/* Order Summary (Right side) */}
            <div className="checkout-summary">
              <div className="summary-card">
                <h3><FaShoppingCart /> Order Summary</h3>
                
                <div className="order-items">
                  {cartItems.map((item, i) => (
                    <div key={item._id || item.id || i} className="order-item">
                      <div className="item-image">
                        <img
                          src={Array.isArray(item.images) ? item.images[0] : item.image}
                          alt={item.name}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/60x60?text=Farm'; }}
                        />
                      </div>
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p>By {typeof item.farmer === 'object' ? (item.farmer?.farmName || item.farmer?.name) : (item.farmer || item.farmName)}</p>
                        <div className="item-quantity-controls">
                          <button type="button" onClick={() => updateQuantity(item._id || item.id, item.quantity - 1)} className="qty-btn" title="Decrease">
                            <FaMinus size={10} />
                          </button>
                          <span className="qty-value">{item.quantity} {item.unit}</span>
                          <button type="button" onClick={() => updateQuantity(item._id || item.id, item.quantity + 1)} className="qty-btn" title="Increase">
                            <FaPlus size={10} />
                          </button>
                          <button type="button" onClick={() => removeFromCart(item._id || item.id)} className="remove-item-btn" title="Remove item">
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="item-total">Rs. {(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="price-breakdown">
                  <div className="price-row">
                    <span>Subtotal</span>
                    <span>Rs. {t.itemsPrice}</span>
                  </div>
                  <div className="price-row">
                    <span>Shipping Estimate</span>
                    <span>{parseFloat(t.shippingPrice) === 0 ? 'FREE' : `Rs. ${t.shippingPrice}`}</span>
                  </div>
                  <div className="price-row">
                    <span>Tax (5%)</span>
                    <span>Rs. {t.taxPrice}</span>
                  </div>
                  <div className="price-row total">
                    <span>Total Amount</span>
                    <span className="total-price">Rs. {t.totalPrice}</span>
                  </div>
                </div>
                
                <div className="shipping-note">
                  <FaTruck /> Free shipping on orders above Rs. 1000
                </div>

                <button type="submit" form="checkout-form" className="place-order-btn" disabled={loading || cartItems.length === 0}>
                  {loading ? 'Processing Securely...' : `Place Secure Order — Rs. ${t.totalPrice}`}
                </button>

                <div className="terms-note">
                  By placing your order, you agree to our Terms of Service and Privacy Policy. Securely processed.
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
