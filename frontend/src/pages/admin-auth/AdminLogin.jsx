import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(import.meta.env.VITE_BASE_URL + "/api/auth/admin/login", {
        email,
        password,
        token,
      }, {
        withCredentials: true,
      });
      

      const data = res.data;
      setUser(data?.adminData);
      toast.success("Login successful");
      navigate("/moderator/adm/dashboard"); 
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-[#1A73E8] mb-6">TktPlz Admin Login</h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#1A73E8] focus:border-[#1A73E8]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#1A73E8] focus:border-[#1A73E8]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TOTP (if 2FA enabled)</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#1A73E8] focus:border-[#1A73E8]"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#1A73E8] text-white font-semibold py-2 rounded-lg hover:bg-[#1558c0] transition duration-200 cursor-pointer"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Only authorized administrators are allowed to access this panel.
        </p>
      </div>
    </div>
  );
}