import React, { createContext, useContext, useMemo, useState } from 'react';
import { supabase } from '../api/supabase';
import { EmployeeSession } from '../types';

interface AuthContextType {
  employee: EmployeeSession | null;
  loginWithPin: (pin: string) => Promise<void>;
  adminMagicLink: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<EmployeeSession | null>(null);

  const loginWithPin = async (pin: string) => {
    const { data, error } = await supabase.rpc('login_with_pin', { p_pin: pin });
    if (error || !data?.id) throw new Error(error?.message ?? 'PIN inválido');
    setEmployee({ id: data.id, name: data.name, email: data.email, isAdmin: data.is_admin });
  };

  const adminMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw new Error(error.message);
  };

  const logout = () => setEmployee(null);

  const value = useMemo(() => ({ employee, loginWithPin, adminMagicLink, logout }), [employee]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext indisponível');
  return ctx;
}
