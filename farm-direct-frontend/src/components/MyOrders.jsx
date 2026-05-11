import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';
import {
    FaBox, FaClock, FaCheckCircle, FaTruck, FaTimesCircle,
    FaCalendarAlt, FaChevronDown, FaChevronUp, FaMapMarkerAlt,
    FaCreditCard, FaLeaf, FaShoppingBag, FaArrowLeft
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';


const STATUS_CONFIG = {
    pending:    { label: 'Pending',    color: 'pending',    icon: FaClock,        step: 1 },
    confirmed:  { label: 'Confirmed',  color: 'confirmed',  icon: FaCheckCircle,  step: 2 },
    processing: { label: 'Processing', color: 'processing', icon: FaBox,          step: 3 },
    shipped:    { label: 'Shipped',    color: 'shipped',    icon: FaTruck,        step: 4 },
    delivered:  { label: 'Delivered',  color: 'delivered',  icon: FaCheckCircle,  step: 5 },
    cancelled:  { label: 'Cancelled',  color: 'cancelled',  icon: FaTimesCircle,  step: 0 },
};

const FILTERS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

/* ── Progress bar for active (non-cancelled) orders ─────────────────── */
const OrderProgress = ({ status }) => {
    if (status === 'cancelled') return null;
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const current = STATUS_CONFIG[status]?.step ?? 1;

    return (
        <div className="order-progress">
            {steps.map((s, i) => {
                const cfg = STATUS_CONFIG[s];
                const Icon = cfg.icon;
                const done = current > i + 1;
                const active = current === i + 1;
                return (
                    <React.Fragment key={s}>
                        <div className={`progress-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                            <div className="progress-dot">
                                <Icon />
                            </div>
                            <span>{cfg.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`progress-line ${done ? 'done' : ''}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

/* ── Single order card ───────────────────────────────────────────────── */
const OrderCard = ({ order }) => {
    const [expanded, setExpanded] = useState(false);
    const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;

    const farmerName =
        typeof order.farmer === 'object'
            ? (order.farmer?.farmName || order.farmer?.name)
            : (order.farmer || 'Local Farmer');

    const paymentLabel =
        order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery'
        : order.paymentMethod === 'online_banking' ? 'Online Banking'
        : order.paymentMethod || 'N/A';

    return (
        <div className={`order-card status-${cfg.color}`}>
            {/* ── Card header ── */}
            <div className="order-card-header" onClick={() => setExpanded(p => !p)}>
                <div className="order-header-left">
                    <div className={`status-badge ${cfg.color}`}>
                        <Icon />
                        {cfg.label}
                    </div>
                    <div className="order-id-date">
                        <span className="order-id">#{order._id.substring(0, 8).toUpperCase()}</span>
                        <span className="order-date">
                            <FaCalendarAlt />
                            {new Date(order.createdAt).toLocaleDateString('en-LK', {
                                day: 'numeric', month: 'short', year: 'numeric'
                            })}
                        </span>
                    </div>
                </div>

                <div className="order-header-right">
                    <div className="order-total-pill">
                        Rs. {Number(order.totalPrice).toFixed(2)}
                    </div>
                    <button className="expand-btn" aria-label="Toggle details">
                        {expanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                </div>
            </div>

            {/* ── Collapsed preview: first 2 items ── */}
            {!expanded && (
                <div className="order-preview">
                    {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="preview-item">
                            <img
                                src={item.image}
                                alt={item.name}
                                onError={e => {
                                    e.target.onerror = null;
                                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%23e8f5e9"/><text x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" font-size="20">🌿</text></svg>';
                                }}
                            />
                            <span>{item.name}</span>
                            <span className="preview-qty">×{item.quantity}</span>
                        </div>
                    ))}
                    {order.items.length > 2 && (
                        <span className="more-items">+{order.items.length - 2} more</span>
                    )}
                </div>
            )}

            {/* ── Expanded details ── */}
            {expanded && (
                <div className="order-expanded">
                    {/* Progress tracker */}
                    <OrderProgress status={order.orderStatus} />

                    {/* All items */}
                    <div className="expanded-items">
                        <h4>Items Ordered</h4>
                        {order.items.map((item, idx) => (
                            <div key={idx} className="expanded-item-row">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="expanded-thumb"
                                    onError={e => {
                                        e.target.onerror = null;
                                        e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="56" height="56" fill="%23e8f5e9"/><text x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" font-size="24">🌿</text></svg>';
                                    }}
                                />
                                <div className="expanded-item-info">
                                    <strong>{item.name}</strong>
                                    <span>{item.quantity} {item.unit} × Rs. {item.price}</span>
                                </div>
                                <span className="expanded-item-total">
                                    Rs. {Number(item.totalPrice || item.price * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Meta grid */}
                    <div className="order-meta-grid">
                        <div className="meta-cell">
                            <FaLeaf />
                            <div>
                                <label>Farmer</label>
                                <span>{farmerName}</span>
                            </div>
                        </div>
                        <div className="meta-cell">
                            <FaCreditCard />
                            <div>
                                <label>Payment</label>
                                <span>{paymentLabel}</span>
                            </div>
                        </div>
                        {order.shippingAddress && (
                            <div className="meta-cell full-width">
                                <FaMapMarkerAlt />
                                <div>
                                    <label>Delivery Address</label>
                                    <span>
                                        {order.shippingAddress.address}, {order.shippingAddress.city}
                                        {order.shippingAddress.postalCode ? `, ${order.shippingAddress.postalCode}` : ''}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Price breakdown */}
                    <div className="price-breakdown-panel">
                        <div className="pb-row">
                            <span>Subtotal</span>
                            <span>Rs. {Number(order.itemsPrice || 0).toFixed(2)}</span>
                        </div>
                        <div className="pb-row">
                            <span>Shipping</span>
                            <span>{Number(order.shippingPrice) === 0 ? 'FREE' : `Rs. ${Number(order.shippingPrice || 0).toFixed(2)}`}</span>
                        </div>
                        <div className="pb-row">
                            <span>Tax (5%)</span>
                            <span>Rs. {Number(order.taxPrice || 0).toFixed(2)}</span>
                        </div>
                        <div className="pb-row total-row">
                            <span>Total</span>
                            <span>Rs. {Number(order.totalPrice).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── Main page ───────────────────────────────────────────────────────── */
const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const res = await orderAPI.getMyOrders();
                if (res.data.success) setOrders(res.data.data);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError('Failed to load your orders. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const filtered = filter === 'all' ? orders : orders.filter(o => o.orderStatus === filter);

    if (loading) return (
        <div className="orders-loading">
            <div className="leaf-spinner">🌿</div>
            <p>Fetching your orders…</p>
        </div>
    );

    return (
        <div className="my-orders-page">
            <div className="container">

                {/* ── Page header ── */}
                <div className="orders-header">
                    <button className="back-link" onClick={() => navigate('/')}>
                        <FaArrowLeft /> Back to Marketplace
                    </button>
                    <div className="header-text">
                        <h1><FaShoppingBag /> My Orders</h1>
                        <p>Track and manage your farm-direct purchases</p>
                    </div>
                    <div className="order-count-pill">{orders.length} order{orders.length !== 1 ? 's' : ''}</div>
                </div>

                {error && <div className="error-banner">⚠️ {error}</div>}

                {/* ── Filter tabs ── */}
                {orders.length > 0 && (
                    <div className="filter-tabs">
                        {FILTERS.map(f => (
                            <button
                                key={f}
                                className={`filter-tab ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                {f !== 'all' && (
                                    <span className="filter-count">
                                        {orders.filter(o => o.orderStatus === f).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Orders list / empty state ── */}
                {orders.length === 0 ? (
                    <div className="empty-orders">
                        <div className="empty-illustration">🌱</div>
                        <h2>No orders yet</h2>
                        <p>You haven't placed any orders. Start shopping fresh produce from local farmers!</p>
                        <button className="shop-now-btn" onClick={() => navigate('/')}>
                            Shop Fresh Produce
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-orders">
                        <div className="empty-illustration">📭</div>
                        <h2>No {filter} orders</h2>
                        <p>You don't have any orders with this status.</p>
                        <button className="shop-now-btn" onClick={() => setFilter('all')}>
                            View All Orders
                        </button>
                    </div>
                ) : (
                    <div className="orders-list">
                        {filtered.map(order => (
                            <OrderCard key={order._id} order={order} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default MyOrders;