import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;

export default function ProfileModal({ onClose }) {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({
        username: user?.username ?? '',
        email: user?.email ?? '',
        avatar: user?.avatar ?? '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await fetch(`${API}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`,
                },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                updateUser(form.username, form.email, form.avatar);
                onClose?.();
            } else { setError('Error al actualizar perfil.'); }
        } catch { setError('Error de conexión.'); }
        finally { setLoading(false); }
    };

    const f = (field) => ({ value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) });

    return (
        <div className="modal-overlay">
            <div className="modal-content glass">
                <h2>Mi Perfil</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div className="user-avatar" style={{ width: 80, height: 80, margin: '0 auto 10px', overflow: 'hidden' }}>
                            {form.avatar?.startsWith('http')
                                ? <img src={form.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span>👤</span>}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Nombre de Usuario</label>
                        <input className="form-control" required {...f('username')} />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-control" required {...f('email')} />
                    </div>
                    <div className="form-group">
                        <label>URL Imagen Avatar</label>
                        <input className="form-control" {...f('avatar')} />
                    </div>
                    {error && <p className="error-text">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cerrar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
