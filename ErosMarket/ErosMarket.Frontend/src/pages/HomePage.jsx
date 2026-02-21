import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductFormModal from '../components/ProductFormModal';

const API = import.meta.env.VITE_API_URL;
const ALL_CATEGORIES = ['Todas', 'Bienestar', 'Ropa', 'Cuidado', 'Hogar', 'Accesorios', 'Juguetes', 'Comestibles', 'General'];

export default function HomePage() {
    const { user, isAdmin } = useAuth();
    const { addToCart } = useCart();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [editingProduct, setEditingProduct] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/products`);
            if (res.ok) setProducts(await res.json());
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchProducts(); }, []);

    const filtered = selectedCategory === 'Todas'
        ? products
        : products.filter(p => p.category === selectedCategory);

    const deleteProduct = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
        await fetch(`${API}/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${user?.token}` },
        });
        fetchProducts();
    };

    return (
        <>
            {/* Hero */}
            <section className="hero">
                <h1 className="hero-title fade-in">Elegancia &amp; Placer <br /> en un solo lugar.</h1>
                <p className="hero-subtitle fade-in">
                    Descubre nuestra exclusiva colección de artículos diseñados para elevar tus sentidos. Calidad premium y discreción garantizada.
                </p>
                <div className="hero-actions fade-in">
                    <a href="#productos"><button className="btn btn-primary">Explorar Ahora</button></a>
                    <button className="btn btn-outline" style={{ marginLeft: 15 }}>Saber Más</button>
                </div>
            </section>

            {/* Products */}
            <main>
                <section className="product-section" id="productos">
                    <div className="section-header">
                        <h2 style={{ fontSize: '2.5rem' }}>Nuestra Selección</h2>
                        {isAdmin && (
                            <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setShowProductModal(true); }}>
                                + Añadir Producto
                            </button>
                        )}
                    </div>

                    <div className="category-filter">
                        {ALL_CATEGORIES.map(cat => (
                            <button key={cat}
                                className={`filter-btn${selectedCategory === cat ? ' active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <p style={{ textAlign: 'center', padding: 40 }}>Cargando experiencias...</p>
                    ) : (
                        <div className="product-grid">
                            {filtered.map(product => (
                                <div key={product.id} className="product-card">
                                    <div className="product-category-tag">{product.category}</div>
                                    <div className="product-image">
                                        {product.imageUrl
                                            ? <img src={product.imageUrl} alt={product.name} />
                                            : <span style={{ fontSize: '3rem' }}>{product.emoji || '📦'}</span>}
                                    </div>
                                    <div className="product-info">
                                        <h3 className="product-name">{product.name}</h3>
                                        <div className="product-meta">
                                            <span className="product-price">${product.price}</span>
                                            <span className={`product-stock${product.stock < 5 ? ' low-stock' : ''}`}>
                                                Stock: {product.stock}
                                            </span>
                                        </div>
                                        <p className="product-description">{product.description}</p>
                                        {isAdmin ? (
                                            <div className="admin-actions">
                                                <button className="btn btn-edit"
                                                    onClick={() => { setEditingProduct(product); setShowProductModal(true); }}>
                                                    Editar
                                                </button>
                                                <button className="btn btn-delete" onClick={() => deleteProduct(product.id)}>
                                                    Eliminar
                                                </button>
                                            </div>
                                        ) : (
                                            <button className="btn btn-primary"
                                                style={{ width: '100%', marginTop: 15, justifyContent: 'center' }}
                                                onClick={() => addToCart(product)}>
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

            {showProductModal && (
                <ProductFormModal
                    product={editingProduct}
                    onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
                    onSaved={fetchProducts}
                />
            )}
        </>
    );
}
