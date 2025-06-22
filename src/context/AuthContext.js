import React, { createContext, useState, useContext, useEffect } from "react";
import getDatabase from "../database/database";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      try {
        const db = getDatabase();
        const result = db.getAllSync(
          "SELECT * FROM users WHERE email = ? AND password = ?",
          [email, password]
        );

        if (result.length > 0) {
          const userData = result[0];
          setUser(userData);
          setLoading(false);
          resolve(userData);
        } else {
          setLoading(false);
          reject(new Error("Email atau password salah"));
        }
      } catch (error) {
        setLoading(false);
        reject(error);
      }
    });
  };

  const register = (name, email, password, phone, role) => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      try {
        const db = getDatabase();
        const result = db.runSync(
          "INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)",
          [name, email, password, phone, role]
        );

        const newUser = {
          id: result.lastInsertRowId,
          name,
          email,
          phone,
          role,
        };
        setUser(newUser);
        setLoading(false);
        resolve(newUser);
      } catch (error) {
        setLoading(false);
        if (error.message.includes("UNIQUE constraint failed")) {
          reject(new Error("Email sudah terdaftar"));
        } else {
          reject(error);
        }
      }
    });
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
