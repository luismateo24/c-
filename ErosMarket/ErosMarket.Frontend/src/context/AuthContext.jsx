import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('eros_user');
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch { }
        }
    }, []);

    const login = (userData) => {
        localStorage.setItem('eros_user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('eros_user');
        setUser(null);
    };

    const updateUser = (username, email, avatar) => {
        const updated = { ...user, username, email, avatar };
        localStorage.setItem('eros_user', JSON.stringify(updated));
        setUser(updated);
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            updateUser,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'Administrador',
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
