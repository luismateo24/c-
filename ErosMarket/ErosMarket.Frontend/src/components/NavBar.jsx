import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const API = import.meta.env.VITE_API_URL;

export default function NavBar({ onShowLogin, onShowRegister, onShowCart, onShowProfile }) {
    const { user, isAuthenticated, logout } = useAuth();
    const { totalCount } = useCart();

    return (
        <nav className="navbar glass">
            <div className="logo">EROS MARKET</div>
            <div className="nav-links">
                <a href="#productos" className="nav-link">Colección</a>
                <a href="#" className="nav-link">Novedades</a>
                {isAuthenticated ? (
                    <div className="user-profile">
                        <div className="user-avatar" onClick={onShowProfile} style={{ cursor: 'pointer', overflow: 'hidden' }}>
                            {user?.avatar?.startsWith('http') ? (
                                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : <span>👤</span>}
                        </div>
                        <span className="nav-link" onClick={onShowProfile} style={{ cursor: 'pointer' }}>
                            Hola, {user?.username}!
                        </span>
                        <span className="nav-link logout-btn" onClick={logout}>Cerrar Sesión</span>
                    </div>
                ) : (
                    <>
                        <span className="nav-link" onClick={onShowLogin} style={{ cursor: 'pointer' }}>Entrar</span>
                        <span className="nav-link" onClick={onShowRegister} style={{ cursor: 'pointer' }}>Registrarse</span>
                    </>
                )}
            </div>
            <button className="btn btn-primary" onClick={onShowCart}>
                Carrito ({totalCount})
            </button>
        </nav>
    );
}
