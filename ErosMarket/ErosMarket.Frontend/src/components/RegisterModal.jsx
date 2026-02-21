import { useState } from 'react';

const API = import.meta.env.VITE_API_URL;

export default function RegisterModal({ onClose, onSuccess }) {
    const [form, setForm] = useState({ username: '', email: '', password: '', avatar: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await fetch(`${API}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) { onSuccess?.(); }
            else {
                const err = await res.json().catch(() => ({}));
                setError(err.message || 'Error en el registro.');
            }
        } catch { setError('Error de conexión con el servidor.'); }
        finally { setLoading(false); }
    };

    const f = (field) => ({ value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) });

    return (
        <div className="modal-overlay">
            <div className="modal-content glass">
                <h2>Crear Cuenta</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre de Usuario</label>
                        <input className="form-control" required {...f('username')} />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-control" required {...f('email')} />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input type="password" className="form-control" required {...f('password')} />
                    </div>
                    <div className="form-group">
                        <label>URL Imagen Avatar</label>
                        <input className="form-control" placeholder="Ej: https://..." {...f('avatar')} />
                    </div>
                    {error && <p className="error-text">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Registrando...' : 'Registrarse'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
