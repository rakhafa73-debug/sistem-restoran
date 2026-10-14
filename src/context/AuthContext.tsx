import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import type { Profile, Role } from '../types/index.ts';

interface AuthContextType {
  user: Profile | null;
  role: Role | 'customer';
  isLoading: boolean;
  login: (email: string, role?: Role) => Promise<void>;
  logout: () => Promise<void>;
  switchRoleDemo: (role: Role | 'customer') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | 'customer'>('customer');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session
  useEffect(() => {
    async function loadUser() {
      try {
        const storedRole = localStorage.getItem('dineqr_active_role') as (Role | 'customer') | null;
        if (storedRole && storedRole !== 'customer') {
          // Switch to that demo user token
          await switchRoleDemo(storedRole);
        } else {
          setRole('customer');
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email);
      api.setStaffToken(res.token);
      const profile: Profile = {
        id: res.user.id,
        restaurant_id: 'a1000000-0000-0000-0000-000000000001',
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setUser(profile);
      setRole(res.user.role);
      localStorage.setItem('dineqr_active_role', res.user.role);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    api.setStaffToken(null);
    setUser(null);
    setRole('customer');
    localStorage.removeItem('dineqr_active_role');
  };

  const switchRoleDemo = async (targetRole: Role | 'customer') => {
    if (targetRole === 'customer') {
      api.setStaffToken(null);
      setUser(null);
      setRole('customer');
      localStorage.setItem('dineqr_active_role', 'customer');
      return;
    }

    const defaultStaffTokens: Record<Role, string> = {
      admin: 'token-admin-session-xyz',
      kitchen: 'token-kitchen-session-xyz',
      cashier: 'token-cashier-session-xyz',
    };

    // Pre-emptively set token and active role synchronously so any immediate sub-component fetch succeeds
    api.setStaffToken(defaultStaffTokens[targetRole]);
    localStorage.setItem('dineqr_active_role', targetRole);
    setRole(targetRole);

    const emailMap: Record<Role, string> = {
      admin: 'admin@dineqr.com',
      kitchen: 'kitchen@dineqr.com',
      cashier: 'cashier@dineqr.com',
    };

    try {
      await login(emailMap[targetRole]);
    } catch {
      // Default session token is already set as fallback
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        login,
        logout,
        switchRoleDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
