import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';

// Product Data
const productsData = [
  {
    id: 1,
    name: "Organic Carrots",
    category: "vegetables",
    price: 400,
    unit: "per bunch",
    farmer: "Roots Farm",
    description: "Sweet organic carrots, freshly harvested. Rich in Vitamin A and perfect for salads or cooking.",
    image: "https://images.unsplash.com/photo-1445282768818-728615cc910a?w=600&q=80",
    rating: 4.4,
    reviews: 128,
    stock: 50,
    organic: true,
    seasonal: true,
    featured: true
  },
  {
    id: 2,
    name: "Fresh Tomatoes",
    category: "vegetables",
    price: 170,
    unit: "per kg",
    farmer: "Sunny Fields",
    description: "Vine-ripened organic tomatoes, juicy and full of flavor. Perfect for salads, sauces, and sandwiches.",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    reviews: 95,
    stock: 35,
    organic: true,
    seasonal: true,
    featured: true
  },
  {
    id: 3,
    name: "Fresh Apples",
    category: "fruits",
    price: 1200,
    unit: "per kg",
    farmer: "Orchard Valley",
    description: "Crispy red apples, perfect for snacking or baking. Naturally sweet and packed with fiber.",
    image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    reviews: 156,
    stock: 75,
    organic: false,
    seasonal: true,
    featured: true
  },
  {
    id: 4,
    name: "Organic Bananas",
    category: "fruits",
    price: 210,
    unit: "per bunch",
    farmer: "Tropical Farms",
    description: "Sweet organic bananas, fair trade certified. Great for smoothies and healthy snacks.",
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    rating: 4.2,
    reviews: 203,
    stock: 100,
    organic: true,
    seasonal: false,
    featured: false
  },
  {
    id: 5,
    name: "Fresh Strawberries",
    category: "fruits",
    price: 210,
    unit: "per box",
    farmer: "Berry Good Farms",
    description: "Sweet organic strawberries, freshly picked. Perfect for desserts and jams.",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    reviews: 167,
    stock: 40,
    organic: true,
    seasonal: true,
    featured: true
  },
  {
    id: 6,
    name: "Bell Peppers Mix",
    category: "vegetables",
    price: 2500,
    unit: "per kg",
    farmer: "Colorful Harvest",
    description: "Mixed bell peppers in red, yellow and green. Crunchy and vitamin-rich.",
    image: "https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?w=600&q=80",
    rating: 4.3,
    reviews: 82,
    stock: 45,
    organic: false,
    seasonal: false,
    featured: false
  },
  {
    id: 7,
    name: "Farm Fresh Eggs",
    category: "dairy",
    price: 30,
    unit: "per dozen",
    farmer: "Happy Hens Farm",
    description: "Free-range organic eggs from pasture-raised hens. Rich in omega-3.",
    image: "https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=600&q=80",
    rating: 4.6,
    reviews: 145,
    stock: 60,
    organic: true,
    seasonal: false,
    featured: true
  },
  {
    id: 8,
    name: "Organic Milk",
    category: "dairy",
    price: 450,
    unit: "per liter",
    farmer: "Green Pastures",
    description: "Fresh organic milk from grass-fed cows. Pasteurized and homogenized.",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    rating: 4.5,
    reviews: 112,
    stock: 30,
    organic: true,
    seasonal: false,
    featured: false
  },
  {
    id: 9,
    name: "Organic Rice",
    category: "grains",
    price: 230,
    unit: "per kg",
    farmer: "Golden Fields",
    description: "Premium quality organic basmati rice. Long-grain and aromatic.",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    rating: 4.4,
    reviews: 78,
    stock: 85,
    organic: true,
    seasonal: false,
    featured: false
  },
  {
    id: 11,
    name: "Fresh Broccoli",
    category: "vegetables",
    price: 990,
    unit: "per head",
    farmer: "Green Valley Farms",
    description: "Fresh organic broccoli, harvested this morning. Rich in vitamins and fiber.",
    image: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    rating: 4.5,
    reviews: 92,
    stock: 40,
    organic: true,
    seasonal: true,
    featured: true
  },
  {
    id: 12,
    name: "Organic Spinach",
    category: "vegetables",
    price: 300,
    unit: "per bag",
    farmer: "Roots Farm",
    description: "Fresh organic spinach leaves, triple-washed and ready to eat.",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    reviews: 105,
    stock: 55,
    organic: true,
    seasonal: true,
    featured: false
  }
];

const getImageUrl = (product) => {
  const img = product.image || (product.images && product.images[0]);
  if (!img) return 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600';
  if (img && img.startsWith('http')) return img;
  // Local upload from backend
  return `http://localhost:5005${img.startsWith('/') ? '' : '/'}${img}`;
};

// Product Card Component
const ProductCard = ({ product, onViewDetails, onBuyNow, onAddToCart }) => {
  const navigate = useNavigate();
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('½');
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push('☆');
    }
    return stars;
  };

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Fresh+Farm+Product';
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
    const navigate = onViewDetails ? (onViewDetails.navigate || null) : null;
    // We need navigate here, but ProductCard doesn't have it. 
    // Wait, let's look at how ProductModal handles it.
  };

  return (
    <div className="product-card" onClick={() => onViewDetails(product)}>
      <div className="product-image-container">
        <img 
          src={getImageUrl(product)} 
          alt={product.name}
          className="product-image"
          onError={handleImageError}
          loading="lazy"
        />
        {product.organic && (
          <span className="organic-badge">🌱 Organic</span>
        )}
        {product.featured && (
          <span className="featured-badge">⭐ Featured</span>
        )}
        {product.stock < 20 && (
          <span className="stock-badge">Limited Stock</span>
        )}
      </div>
      <div className="product-info">
        <div className="product-header">
          <h3>{product.name}</h3>
          <span className="category">{product.category}</span>
        </div>
        <div className="product-details">
          <span className="farmer">👨‍🌾 {typeof product.farmer === 'object' ? (product.farmer?.farmName || product.farmer?.name) : product.farmer}</span>
          <div className="price-rating">
            <span className="price">RS{product.price} <span className="unit">{product.unit}</span></span>
            <div className="rating">
              <span className="stars">{renderStars(product.rating)}</span>
              <span className="rating-value">{product.rating}</span>
              <span className="reviews-count">({product.reviews})</span>
            </div>
          </div>
        </div>
      </div>
      <div className="product-actions-hover">
        <button className="buy-now-btn" style={{ width: '100%', borderRadius: '12px' }} onClick={(e) => {
          e.stopPropagation();
          if (onBuyNow) onBuyNow(product);
          navigate('/checkout');
        }}>
          Buy Now
        </button>
      </div>
    </div>
  );
};

// Product Modal Component
const ProductModal = ({ product, onClose, onBuyNow, onAddToCart }) => {
  const navigate = useNavigate();
  if (!product) return null;

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'star filled' : 'star'}>
          {i <= rating ? '★' : '☆'}
        </span>
      );
    }
    return stars;
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow(product);
    }
    // Navigate to checkout
    navigate('/checkout');
  };

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>×</button>
        <div className="modal-product">
          <div className="modal-image-container">
            <img 
              src={getImageUrl(product)} 
              alt={product.name}
              className="modal-image"
              onError={(e) => e.target.src = 'https://via.placeholder.com/400x400/4CAF50/FFFFFF?text=Product+Image'}
            />
          </div>
          <div className="modal-details">
            <div className="modal-header">
              <h2>{product.name}</h2>
              <span className={`category-tag {product.category}`}>{product.category}</span>
            </div>
            
            <div className="farmer-info">
              <span className="farmer-icon">👨‍🌾</span>
              <span className="farmer-name">{typeof product.farmer === 'object' ? (product.farmer?.farmName || product.farmer?.name) : product.farmer}</span>
            </div>

            <div className="rating-section">
              <div className="stars-container">
                {renderStars(product.rating)}
              </div>
              <span className="rating-text">{product.rating} out of 5</span>
              <span className="reviews">({product.reviews} reviews)</span>
            </div>

            <p className="product-description">{product.description}</p>

            <div className="product-meta">
              {product.organic && (
                <div className="meta-item">
                  <span className="meta-icon">🌱</span>
                  <span className="meta-text">Certified Organic</span>
                </div>
              )}
              {product.seasonal && (
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  <span className="meta-text">Seasonal Product</span>
                </div>
              )}
              <div className="meta-item">
                <span className="meta-icon">📦</span>
                <span className="meta-text">{product.stock} units available</span>
              </div>
            </div>

            <div className="price-section">
              <div className="price-display">
                <span className="current-price">{product.price}</span>
                <span className="price-unit">{product.unit}</span>
              </div>
              <div className="delivery-info">
                🚚 Free delivery on orders over 500
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Products Component
const Products = ({ onAddToCart, onBuyNow }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  // fetch from backend, fall back to mock data if offline
  useEffect(() => {
    const load = async () => {
      try {
        const res = await productAPI.getAll({ limit: 50 });
        const data = res.data?.data || [];
        if (data.length > 0) {
          setProducts(data);
          setFilteredProducts(data);
        } else {
          setProducts(productsData);
          setFilteredProducts(productsData);
        }
      } catch {
        setProducts(productsData);
        setFilteredProducts(productsData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter and sort products
  useEffect(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      result = result.filter(p => {
        const farmerName = typeof p.farmer === 'object' ? (p.farmer?.farmName || p.farmer?.name) : p.farmer;
        return p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (farmerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default: // 'featured'
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, selectedCategory, searchTerm, sortBy]);

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Categories for filter
  const categories = ['all', ...new Set(products.map(p => p.category))];

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product) => {
    if (onAddToCart) {
      onAddToCart({ ...product, quantity: 1 });
    }
  };

  if (loading) {
    return (
      <section className="marketplace" id="marketplace">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading fresh products...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="marketplace" id="marketplace">
      <div className="container">
        <h2 className="section-title">Fresh From The Farm</h2>
        
        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products or farmers..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <span className="search-icon"></span>
        </div>

        {/* Filters */}
        <div className="filters-header">
          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category}
                className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          <div className="sort-filter">
            <label htmlFor="sort">Sort by:</label>
            <select 
              id="sort" 
              value={sortBy} 
              onChange={handleSortChange}
              className="sort-select"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="results-count">
          <p>Showing {currentProducts.length} of {filteredProducts.length} products</p>
        </div>

        {/* Products Grid */}
        {currentProducts.length > 0 ? (
          <div className="products-grid">
            {currentProducts.map(product => (
              <ProductCard 
                key={product._id || product.id} 
                product={product} 
                onViewDetails={handleViewDetails}
                onBuyNow={onBuyNow}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p>No products found. Try adjusting your filters.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="page-btn"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              Next
            </button>
          </div>
        )}

        {/* Product Modal */}
        <ProductModal 
          product={selectedProduct} 
          onClose={handleCloseModal}
          onBuyNow={onBuyNow}
          onAddToCart={onAddToCart}
        />
      </div>
    </section>
  );
};

export default Products;