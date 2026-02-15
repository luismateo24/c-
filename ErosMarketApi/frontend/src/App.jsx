import { useState, useEffect, useCallback } from 'react'
import './App.css'

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [cart, setCart] = useState([])
  const [editingProduct, setEditingProduct] = useState(null)
  const [credentials, setCredentials] = useState({ email: '', password: '', username: '', avatar: '' })
  const [productData, setProductData] = useState({ name: '', price: '', emoji: '', description: '', category: 'General', stock: 10, imageUrl: '' })
  const [profileData, setProfileData] = useState({ username: '', email: '', avatar: '' })
  const [error, setError] = useState('')

  const API_URL = 'http://localhost:5177/api'

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) setUser(JSON.parse(savedUser))

    const savedCart = localStorage.getItem('cart')
    if (savedCart) setCart(JSON.parse(savedCart))

    fetchProducts()
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/products`)
      const data = await res.json()
      setProducts(data)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching products:", err)
      setLoading(false)
    }
  }, [API_URL])

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id)
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setShowCart(true)
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email, password: credentials.password })
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
        setShowLogin(false)
        setCredentials({ email: '', password: '', username: '', avatar: '' })
      } else {
        setError(data.message || 'Login fallido')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      if (res.ok) {
        setShowRegister(false)
        setShowLogin(true)
        setError('Registro exitoso. Por favor inicia sesión.')
      } else {
        const data = await res.json()
        setError(data.message || 'Error en el registro')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(profileData)
      })
      if (res.ok) {
        const updatedUser = { ...user, ...profileData }
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setShowProfileModal(false)
      } else {
        const data = await res.json()
        setError(data.message || 'Error al actualizar perfil')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    }
  }

  const openProfileModal = () => {
    setProfileData({
      username: user.username,
      email: user.email,
      avatar: user.avatar
    })
    setShowProfileModal(true)
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    const method = editingProduct ? 'PUT' : 'POST'
    const url = editingProduct
      ? `${API_URL}/products/${editingProduct.id}`
      : `${API_URL}/products`

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(editingProduct ? { ...productData, id: editingProduct.id } : productData)
      })

      if (res.ok) {
        fetchProducts()
        setShowProductModal(false)
        setEditingProduct(null)
        setProductData({ name: '', price: '', emoji: '', description: '', category: 'General', stock: 10, imageUrl: '' })
      } else {
        const data = await res.json()
        setError(data.message || 'Error al guardar producto')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) fetchProducts()
      else alert('Error al eliminar producto')
    } catch (err) {
      alert('Error de conexión con el servidor')
    }
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setProductData({
      name: product.name,
      price: product.price,
      emoji: product.emoji || '',
      description: product.description || '',
      category: product.category || 'General',
      stock: product.stock || 10,
      imageUrl: product.imageUrl || ''
    })
    setShowProductModal(true)
  }

  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const categories = ['Todas', 'Bienestar', 'Ropa', 'Cuidado', 'Hogar', 'Accesorios', 'Juguetes', 'Comestibles', 'General']

  const filteredProducts = selectedCategory === 'Todas'
    ? products
    : products.filter(p => p.category === selectedCategory)

  const isAdmin = user && user.role === 'Administrador'

  return (
    <div className="app">
      <nav className="navbar glass">
        <div className="logo">EROS MARKET</div>
        <div className="nav-links">
          <a href="#" className="nav-link">Colección</a>
          <a href="#" className="nav-link">Novedades</a>
          {user ? (
            <div className="user-profile">
              <div className="user-avatar" onClick={openProfileModal} style={{ cursor: 'pointer', overflow: 'hidden' }}>
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '👤'
                )}
              </div>
              <span className="nav-link" onClick={openProfileModal} style={{ cursor: 'pointer' }}>Hola, {user.username}!</span>
              <span className="nav-link logout-btn" onClick={handleLogout}>Cerrar Sesión</span>
            </div>
          ) : (
            <>
              <span className="nav-link" onClick={() => setShowLogin(true)} style={{ cursor: 'pointer' }}>Entrar</span>
              <span className="nav-link" onClick={() => setShowRegister(true)} style={{ cursor: 'pointer' }}>Registrarse</span>
            </>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => setShowCart(true)}>
          Carrito ({cartCount})
        </button>
      </nav>

      <section className="hero">
        <h1 className="hero-title fade-in">Elegancia & Placer <br /> en un solo lugar.</h1>
        <p className="hero-subtitle fade-in">Descubre nuestra exclusiva colección de artículos diseñados para elevar tus sentidos. Calidad premium y discreción garantizada.</p>
        <div className="hero-actions fade-in">
          <button className="btn btn-primary">Explorar Ahora</button>
          <button className="btn btn-outline" style={{ marginLeft: '15px' }}>Saber Más</button>
        </div>
      </section>

      <main>
        <section className="product-section">
          <div className="section-header">
            <h2 style={{ fontSize: '2.5rem' }}>Nuestra Selección</h2>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setShowProductModal(true); }}>
                + Añadir Producto
              </button>
            )}
          </div>

          <div className="category-filter">
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ textAlign: 'center' }}>Cargando experiencias...</p>
          ) : (
            <div className="product-grid">
              {filteredProducts.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-category-tag">{product.category}</div>
                  <div className="product-image">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>{product.emoji || "📦"}</span>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-meta">
                      <span className="product-price">${product.price}</span>
                      <span className={`product-stock ${product.stock < 5 ? 'low-stock' : ''}`}>
                        Stock: {product.stock}
                      </span>
                    </div>
                    <p className="product-description">{product.description}</p>
                    {isAdmin ? (
                      <div className="admin-actions">
                        <button className="btn btn-edit" onClick={() => openEditModal(product)}>Editar</button>
                        <button className="btn btn-delete" onClick={() => handleDeleteProduct(product.id)}>Eliminar</button>
                      </div>
                    ) : (
                      <button className="btn btn-primary" style={{ width: '100%', marginTop: '15px', justifyContent: 'center' }} onClick={() => addToCart(product)}>
                        Añadir al Carrito
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showLogin && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={credentials.email} onChange={e => setCredentials({ ...credentials, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input type="password" value={credentials.password} onChange={e => setCredentials({ ...credentials, password: e.target.value })} required />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Entrar</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowLogin(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h2>Crear Cuenta</h2>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Nombre de Usuario</label>
                <input type="text" value={credentials.username} onChange={e => setCredentials({ ...credentials, username: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={credentials.email} onChange={e => setCredentials({ ...credentials, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input type="password" value={credentials.password} onChange={e => setCredentials({ ...credentials, password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>URL Imagen Avatar</label>
                <input type="text" value={credentials.avatar} onChange={e => setCredentials({ ...credentials, avatar: e.target.value })} placeholder="Ej: https://..." />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Registrarse</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowRegister(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h2>Mi Perfil</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div className="user-avatar" style={{ width: '80px', height: '80px', margin: '0 auto 10px', overflow: 'hidden' }}>
                  {profileData.avatar ? (
                    <img src={profileData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '👤'
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Nombre de Usuario</label>
                <input type="text" value={profileData.username} onChange={e => setProfileData({ ...profileData, username: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>URL Imagen Avatar</label>
                <input type="text" value={profileData.avatar} onChange={e => setProfileData({ ...profileData, avatar: e.target.value })} />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowProfileModal(false)}>Cerrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCart && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ margin: 0 }}>Tu Carrito</h2>
              <button className="btn btn-outline" onClick={() => setShowCart(false)}>Cerrar</button>
            </div>
            {cart.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px 0' }}>El carrito está vacío.</p>
            ) : (
              <>
                <div className="cart-items" style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                  {cart.map(item => (
                    <div key={item.id} className="cart-item" style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid var(--glass-border)' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#25252b', flexShrink: 0 }}>
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>{item.name}</div>
                        <div style={{ color: 'var(--primary)', fontWeight: '700' }}>${item.price}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                          <button type="button" onClick={() => updateQuantity(item.id, -1)} className="btn-qty">-</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.id, 1)} className="btn-qty">+</button>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.id)} style={{ color: '#ff4757', background: 'transparent', border: 'none', cursor: 'pointer', height: 'fit-content' }}>Eliminar</button>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '2px solid var(--glass-border)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px' }}>
                    <span>Total:</span>
                    <span style={{ color: 'var(--primary)' }}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => alert('¡Gracias por tu compra! (Simulación)')}>
                    Finalizar Compra
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={productData.name} onChange={e => setProductData({ ...productData, name: e.target.value })} required />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label>Precio</label>
                  <input type="number" step="0.01" value={productData.price} onChange={e => setProductData({ ...productData, price: e.target.value })} required />
                </div>
                <div>
                  <label>Stock</label>
                  <input type="number" value={productData.stock} onChange={e => setProductData({ ...productData, stock: parseInt(e.target.value) })} required />
                </div>
              </div>
              <div className="form-group">
                <label>URL Imagen del Producto</label>
                <input type="text" value={productData.imageUrl} onChange={e => setProductData({ ...productData, imageUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label>Emoji (Opcional)</label>
                  <input type="text" value={productData.emoji} onChange={e => setProductData({ ...productData, emoji: e.target.value })} placeholder="Ej: ✨" />
                </div>
                <div>
                  <label>Categoría</label>
                  <select
                    value={productData.category}
                    onChange={e => setProductData({ ...productData, category: e.target.value })}
                    className="form-select"
                  >
                    {categories.filter(c => c !== 'Todas').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input type="text" value={productData.description} onChange={e => setProductData({ ...productData, description: e.target.value })} />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">{editingProduct ? 'Guardar' : 'Crear'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowProductModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer style={{ padding: '40px 5%', borderTop: '1px solid var(--glass-border)', textAlign: 'center', color: 'var(--text-dim)' }}>
        <p>© 2026 ErosMarket - Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}

export default App
