import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import About from './components/About';
import Marketplace from './components/ProductModal';
import Contact from './components/Contact';
import Login from './components/Login';
import Checkout from './components/Checkout';
import ForgotPassword from './components/ForgotPassword';
import AdminDashboard from './components/AdminDashbord';
import FarmerDashboard from './components/FarmerDashboard';
import SellerDashboard from './components/SellerDashboard';
import MyOrders from './components/MyOrders';
import AIChatbot from './components/AIChatbot';

import './styles/App.css';
import './styles/Auth.css';
import './styles/Register.css';


function App() {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedCart = localStorage.getItem('cart');
    
    if (storedUser) {
      try { 
        setUser(JSON.parse(storedUser)); 
      } catch (e) { 
        localStorage.removeItem('user'); 
      }
    }
    
    if (storedCart) {
      try { 
        setCartItems(JSON.parse(storedCart)); 
      } catch (e) { 
        localStorage.removeItem('cart'); 
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setCartItems([]);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const productId = product._id || product.id;
      const existing = prev.find(i => (i._id || i.id) === productId);
      
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + 1 > product.stock) {
        alert(`Cannot add more ${product.name}. Only ${product.stock} units available in store.`);
        return prev;
      }

      if (existing) {
        return prev.map(i => 
          ((i._id || i.id) === productId) 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(i => i.id !== productId && i._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prev => {
      const item = prev.find(i => (i.id === productId || i._id === productId));
      if (item && quantity > item.stock) {
        alert(`Cannot set quantity to ${quantity}. Only ${item.stock} units available for ${item.name}.`);
        return prev;
      }
      return prev.map(i => 
        (i.id === productId || i._id === productId) ? { ...i, quantity } : i
      );
    });
  };

  const clearCart = () => setCartItems([]);
  const buyNow = (product) => {
    setCartItems([{...product, quantity: 1}]);
  };


  // Protected route wrapper
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.userType)) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  };

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={handleLogout} cartItems={cartItems} />

        <Routes>
          {/* Public home */}
          <Route path="/" element={
            <>
              <Hero />
              <About />
              <Marketplace onAddToCart={addToCart} onBuyNow={buyNow} />
              <Contact />
            </>
          } />

          {/* Auth routes */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onLogin={handleLogin} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected dashboards */}
          <Route path="/farmer-dashboard" element={
            <ProtectedRoute allowedRoles={['farmer', 'admin']}>
              <FarmerDashboard user={user} />
            </ProtectedRoute>
          } />
          
          <Route path="/seller-dashboard" element={
            <ProtectedRoute allowedRoles={['farmer', 'admin']}>
              <SellerDashboard user={user} />
            </ProtectedRoute>
          } />
          
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard user={user} />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {(() => {
                if (user?.userType === 'admin') return <Navigate to="/admin-dashboard" replace />;
                if (user?.userType === 'farmer') return <Navigate to="/farmer-dashboard" replace />;
                return <Navigate to="/" replace />;
              })()}
            </ProtectedRoute>
          } />

          {/* Checkout */}
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout
                cartItems={cartItems}
                onOrderSuccess={clearCart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
              />
            </ProtectedRoute>
          } />

          {/* My Orders */}
          <Route path="/my-orders" element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          } />

          {/* 404 redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
        <AIChatbot user={user} />
      </div>
    </Router>
  );
}

export default App;

// import React from 'react';
// import Sample from './components/Sample.jsx';
// import './styles/register.css'

// const App = () => {
//   return (
//     <>
//       <Sample />
//     </>
//   );
// };

// export default App;