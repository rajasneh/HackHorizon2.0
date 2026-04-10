import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

// Error in OTP verification : Cannot read properties of undefined (reading 'email')

export const AuthProvider = ({ children }) => {
  const [emailData, setEmailData] = useState("");
  const [user, setUser] = useState(null);

  // Load email and user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("meetz_user");
    const savedEmail = localStorage.getItem("meetz_email");

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedEmail) setEmailData(savedEmail);
  }, []);

  // Save user to localStorage on change
  useEffect(() => {
    if (user) {
      localStorage.setItem("meetz_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("meetz_user");
    }
  }, [user]);

  // Save emailData to localStorage on change
  useEffect(() => {
    if (emailData) {
      localStorage.setItem("meetz_email", emailData);
    } else {
      localStorage.removeItem("meetz_email");
    }
  }, [emailData]);

  return (
    <AuthContext.Provider value={{ emailData, setEmailData, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);