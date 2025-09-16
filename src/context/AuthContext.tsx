// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";

type User = { id: string; name: string; profile_img?: string | null };
type AuthState = { token: string; user: User } | null;

const AuthContext = createContext<{
  auth: AuthState;
  setAuth: (auth: AuthState) => void;
}>({ auth: null, setAuth: () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [auth, setAuth] = useState<AuthState>(null);

  // Load từ localStorage khi app start
  useEffect(() => {
    const raw = localStorage.getItem("auth");
    if (raw) setAuth(JSON.parse(raw));
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
