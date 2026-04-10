import { useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { FcGoogle } from "react-icons/fc";
import { MdPhoneAndroid } from "react-icons/md";
import { handleGoogleLogin } from "../../components/Home/GoogleLogin";
import { useModal } from "../../context/ModalContext";
import { TktPlzSpinner } from "../../components/Other/Spinner";
import { useAuth } from "../../context/AuthContext";
import { FaTelegramPlane } from "react-icons/fa";

export const RegisterPage = () => {

    const [formData, setFormData] = useState({ username: "", email: "" });
    const [loading, setLoading] = useState(false);
    const { showLoginModal, hideModal, showOTPModal, redirectUrl } = useModal();
    const modalRef = useRef();
    const { setEmailData, setUser } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const register = async (e) => {
        e.preventDefault();
        console.log("Signup Data : ", formData);

        if (!formData.username.trim() || !formData.email.includes("@")) {
            toast.error("Please enter valid details!");
            return;
        }

        setLoading(true); // Start loading state

        const { username, email } = formData;
        const name = username;

        try {
            const res = await fetch(import.meta.env.VITE_BASE_URL + "/api/auth/user-reg", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }), // Sending email
            });

            const data = await res.json();

            if (res.ok) {
                setTimeout(() => { // Optional delay for better UI experience
                    setLoading(false);
                    setEmailData(email);
                    setUser(data.userData);
                    showOTPModal();
                    toast.success("OTP sent to your email")
                }, 2000);
            } else {
                setLoading(false);
                toast.error(data.message); // Show error message
            }

        } catch (err) {
            console.log("Registration Error ", err);
            setLoading(false);
            toast.error("Something went wrong!")
        }
    };

    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            hideModal();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm mx-4"
            >
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    Create Your Account
                </h2>

                <form className="space-y-4" onSubmit={register}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Your name"
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    {/* <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div> */}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 rounded-xl transition duration-200 cursor-pointer font-medium
                        ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}
                    `}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>


                </form>

                <div className="my-4 flex items-center justify-between">
                    <span className="h-px bg-gray-300 w-1/4"></span>
                    <span className="text-sm text-gray-500">or continue with</span>
                    <span className="h-px bg-gray-300 w-1/4"></span>
                </div>

                <div className="flex justify-between gap-3">
                    <button
                        onClick={() => handleGoogleLogin(hideModal)}
                        className="flex-1 flex items-center justify-center border border-gray-300 py-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                    >
                        <FcGoogle className="text-xl" />
                    </button>
                    {/* <NavLink
                        to="/mobile-auth"
                        className="flex-1 flex items-center justify-center border border-gray-300 py-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                    >
                        <FaTelegramPlane className="text-xl text-blue-500" />
                    </NavLink> */}
                </div>

                <p className="text-sm text-center text-gray-600 mt-4">
                    Already have an account?{" "}
                    <button
                        className="text-blue-600 hover:underline cursor-pointer"
                        onClick={showLoginModal}
                        type="button"
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    );

};
