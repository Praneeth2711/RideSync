import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state by verifying HttpOnly cookie with the server
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const res = await authService.getMe();
        if (isMounted && res?.data?.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        // No active session cookie or expired
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for 401 unauthorized session expiry events from api interceptor
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('ridesync:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('ridesync:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res?.data?.user) {
      setUser(res.data.user);
    }
    return res;
  };

  const register = async (name, email, password, confirmPassword) => {
    const res = await authService.register({
      name,
      email,
      password,
      confirmPassword,
    });
    if (res?.data?.user) {
      setUser(res.data.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
