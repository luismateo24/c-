import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;

export default function LoginModal({ onClose, onSuccess, onGoRegister }) {
    const { login } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await fetch(`${API}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const data = await res.json();
                login(data);
                onSuccess?.();
            } else {
                const err = await res.json().catch(() => ({}));
                setError(err.message || 'Credenciales inválidas.');
            }
        } catch { setError('Error de conexión con el servidor.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass">
                <h2>Iniciar Sesión</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-control" value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input type="password" className="form-control" value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    {error && <p className="error-text">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
                    </div>
                </form>
                <p style={{ textAlign: 'center', marginTop: 15, fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                    ¿No tienes cuenta?{' '}
                    <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={onGoRegister}> Regístrate</span>
                </p>
            </div>
        </div>
    );
}
