import { useCart } from '../context/CartContext';

export default function CartModal({ onClose }) {
    const { items, removeFromCart, updateQuantity, totalPrice } = useCart();

    return (
        <div className="modal-overlay">
            <div className="modal-content glass" style={{ maxWidth: 500, width: '90%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                    <h2 style={{ margin: 0 }}>Tu Carrito</h2>
                    <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
                </div>

                {items.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '40px 0' }}>El carrito está vacío.</p>
                ) : (
                    <>
                        <div className="cart-items" style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 20 }}>
                            {items.map(item => (
                                <div key={item.product.id} style={{ display: 'flex', gap: 15, marginBottom: 15, paddingBottom: 15, borderBottom: '1px solid var(--glass-border)' }}>
                                    <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', background: '#25252b', flexShrink: 0 }}>
                                        {item.product.imageUrl
                                            ? <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span>📦</span>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                                        <div style={{ color: 'var(--primary)', fontWeight: 700 }}>${item.product.price}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
                                            <button className="btn-qty" onClick={() => updateQuantity(item.product.id, -1)}>-</button>
                                            <span>{item.quantity}</span>
                                            <button className="btn-qty" onClick={() => updateQuantity(item.product.id, 1)}>+</button>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.product.id)}
                                        style={{ color: '#ff4757', background: 'transparent', border: 'none', cursor: 'pointer', height: 'fit-content' }}>
                                        Eliminar
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div style={{ borderTop: '2px solid var(--glass-border)', paddingTop: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>
                                <span>Total:</span>
                                <span style={{ color: 'var(--primary)' }}>${totalPrice.toFixed(2)}</span>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                                onClick={() => alert('¡Gracias por tu compra! (Simulación)')}>
                                Finalizar Compra
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
