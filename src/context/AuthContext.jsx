import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in local storage on load
    const token = localStorage.getItem('adminToken');
    if (token) {
      setUser({ token });
      
      // Override fetch to automatically include the Authorization header for /api requests
      const originalFetch = window.fetch;
      window.fetch = async function () {
        let [resource, config] = arguments;
        if (typeof resource === 'string' && resource.startsWith('/api/')) {
          config = config || {};
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
          };
        }
        const response = await originalFetch(resource, config);
        if (response.status === 401) {
            // Auto logout if unauthorized
            logout();
        }
        return response;
      };

    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('adminToken', data.token);
    setUser({ token: data.token });
    
    // Reload window to ensure fetch interceptor is applied cleanly
    window.location.reload();
    return data;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setUser(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
