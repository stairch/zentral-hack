'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  role: 'user' | 'category_partner' | 'admin';
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Parse JWT payload from token
 * Note: Token is now stored in httpOnly cookie by the API
 * This function helps us validate the token structure
 */
function parseJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    // Decode payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );
    return payload;
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, verify if user is authenticated via httpOnly cookie or sessionStorage
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // First check if we have token in sessionStorage (from recent 2FA)
        const storedToken = sessionStorage.getItem('auth_token');
        const storedUser = sessionStorage.getItem('auth_user');
        
        if (storedToken && storedUser) {
          console.log('[AuthContext] Found token in sessionStorage, using it');
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsLoading(false);
          return;
        }

        // Try to verify with server using httpOnly cookie
        try {
          const res = await fetch('/api/verify', {
            credentials: 'include',
          });

          if (res.ok) {
            const data = await res.json();
            console.log('[AuthContext] Verify endpoint response:', data);
            if (data.data?.user) {
              setUser(data.data.user);
              setToken(data.data.token || 'authenticated');
            } else {
              setUser(null);
              setToken(null);
            }
          } else {
            console.log('[AuthContext] Verify endpoint returned:', res.status);
            setUser(null);
            setToken(null);
          }
        } catch (verifyError) {
          console.warn('[AuthContext] Verify endpoint failed:', verifyError);
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('[AuthContext] Auth verification failed:', error);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await res.json();
    // Token is now in httpOnly cookie, but we store it locally for context
    setToken(data.data.token);
    setUser(data.data.user);
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ email, password, confirmPassword: password, firstName, lastName }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await res.json();
    // Token is now in httpOnly cookie
    setToken(data.data.token);
    setUser(data.data.user);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
