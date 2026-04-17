import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);

    setToken(data.token);
    setUser({
      role: data.role,
      isVerified: data.isVerified,
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  useEffect(() => {
  const savedUser = localStorage.getItem("user");
  const savedToken = localStorage.getItem("token");

  if (savedUser && savedUser !== "undefined") {
    setUser(JSON.parse(savedUser));
  }

  if (savedToken && savedToken !== "undefined") {
    setToken(savedToken);
  }
}, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
