import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import NavBar from './components/NavBar';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import CartModal from './components/CartModal';
import ProfileModal from './components/ProfileModal';
import HomePage from './pages/HomePage';

export default function App() {
  const [modal, setModal] = useState(null); // 'login' | 'register' | 'cart' | 'profile' | null

  const close = () => setModal(null);

  return (
    <AuthProvider>
      <CartProvider>
        <div className="app">
          <NavBar
            onShowLogin={() => setModal('login')}
            onShowRegister={() => setModal('register')}
            onShowCart={() => setModal('cart')}
            onShowProfile={() => setModal('profile')}
          />
          <HomePage />

          {modal === 'login' && (
            <LoginModal
              onClose={close}
              onSuccess={close}
              onGoRegister={() => setModal('register')}
            />
          )}
          {modal === 'register' && (
            <RegisterModal
              onClose={close}
              onSuccess={() => setModal('login')}
            />
          )}
          {modal === 'cart' && <CartModal onClose={close} />}
          {modal === 'profile' && <ProfileModal onClose={close} />}
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
