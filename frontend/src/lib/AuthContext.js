'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const BASE_URL = 'https://web-online-wbn5.onrender.com/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('driveedu_token');
      const storedUser  = localStorage.getItem('driveedu_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error reading localStorage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save session
  const saveSession = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('driveedu_token', newToken);
    localStorage.setItem('driveedu_user', JSON.stringify(newUser));
  };

  // Login
  const login = async (usernameOrEmail, password) => {
    const isEmail = usernameOrEmail.includes('@');
    const bodyData = isEmail 
      ? { email: usernameOrEmail, password }
      : { username: usernameOrEmail, password };

    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Đăng nhập thất bại');
    }
    saveSession(json.data.token, json.data.user);
    return json.data;
  };

  // Register
  const register = async (emailOrObj, password, full_name, username) => {
    let payload;
    if (typeof emailOrObj === 'object' && emailOrObj !== null) {
      payload = emailOrObj;
    } else {
      payload = {
        email: emailOrObj,
        password: password,
        full_name: full_name,
        username: username || (typeof emailOrObj === 'string' ? emailOrObj.split('@')[0] : '')
      };
    }

    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Đăng ký thất bại');
    }
    return json;
  };

  // Change Password
  const changePassword = async (user_id, new_password) => {
    const res = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id, new_password }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Đổi mật khẩu thất bại');
    }
    return json;
  };

  // Update Profile
  const updateProfile = async (updatedFields) => {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...updatedFields, email: user?.email }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Cập nhật thông tin thất bại');
    }
    const updatedUser = { ...user, ...updatedFields };
    saveSession(token, updatedUser);
    return json;
  };

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('driveedu_token');
    localStorage.removeItem('driveedu_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, changePassword, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
