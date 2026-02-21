import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;
const CATEGORIES = ['Bienestar', 'Ropa', 'Cuidado', 'Hogar', 'Accesorios', 'Juguetes', 'Comestibles', 'General'];

export default function ProductFormModal({ product, onClose, onSaved }) {
    const { user } = useAuth();
    const isEditing = !!product;

    const [form, setForm] = useState({
        name: '', description: '', price: 0, stock: 10, emoji: '', category: 'General', imageUrl: '', isActive: true,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) setForm({ ...product });
    }, [product]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const url = isEditing ? `${API}/api/products/${form.id}` : `${API}/api/products`;
            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`,
                },
                body: JSON.stringify(form),
            });
            if (res.ok) { onSaved?.(); onClose?.(); }
            else { setError('Error al guardar el producto.'); }
        } catch { setError('Error de conexión.'); }
        finally { setLoading(false); }
    };

    const f = (field) => ({
        value: form[field],
        onChange: e => setForm({ ...form, [field]: field === 'price' || field === 'stock' ? +e.target.value : e.target.value }),
    });

    return (
        <div className="modal-overlay">
            <div className="modal-content glass">
                <h2>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre</label>
                        <input className="form-control" required {...f('name')} />
                    </div>
                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                        <div>
                            <label>Precio</label>
                            <input type="number" step="0.01" min="0" className="form-control" required {...f('price')} />
                        </div>
                        <div>
                            <label>Stock</label>
                            <input type="number" min="0" className="form-control" required {...f('stock')} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>URL Imagen del Producto</label>
                        <input className="form-control" placeholder="https://..." {...f('imageUrl')} />
                    </div>
                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                        <div>
                            <label>Emoji (Opcional)</label>
                            <input className="form-control" placeholder="Ej: ✨" {...f('emoji')} />
                        </div>
                        <div>
                            <label>Categoría</label>
                            <select className="form-select" {...f('category')}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <input className="form-control" required {...f('description')} />
                    </div>
                    {error && <p className="error-text">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : (isEditing ? 'Guardar' : 'Crear')}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
