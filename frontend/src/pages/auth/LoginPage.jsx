import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { MdPhoneAndroid } from "react-icons/md";
import { handleGoogleLogin } from "../../components/Home/GoogleLogin";
import { useModal } from "../../context/ModalContext";
import { TktPlzSpinner } from "../../components/Other/Spinner";
import { useAuth } from "../../context/AuthContext";
import { FaTelegramPlane } from "react-icons/fa";

export const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const modalRef = useRef();
    const { showRegisterModal, hideModal, showOTPModal, redirectUrl } = useModal();
    const [loading, setLoading] = useState(false);
    const { setEmailData, setUser } = useAuth();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Parse redirect parameter from URL when component mounts
        const redirect = searchParams.get('redirect');
        if (redirect && !redirectUrl) {
            // Update modal context with redirect URL if not already set
            // This handles direct visits to /login?redirect=...
        }
    }, [searchParams, redirectUrl]);

    const login = async (e) => {
        e.preventDefault();
        console.log("Email : ", email);

        if (!email.includes("@")) {
            toast.error("Enter a valid email!");
            return;
        }

        setLoading(true); // Start loading state

        try {
            const response = await fetch(import.meta.env.VITE_BASE_URL + "/api/auth/user-login", {
                method: "POST",
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }), // Sending email
            })

            const data = await response.json();

            if (response.ok) {
                setTimeout(() => { // Optional delay for better UI experience
                    setLoading(false);
                    setEmailData(email);
                    setUser(data.userData);
                    showOTPModal();
                }, 2000);

            } else {
                setLoading(false);
                toast.error(data.message); // Show error message
            }

        } catch (err) {
            console.log("Login Error ", err);
            setLoading(false);
            toast.error("Something went wrong!")
        }
    }

    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            hideModal();
        }
    };

    return (
        <>

            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                onClick={handleBackdropClick}
            >
                {
                    loading ? (
                        <div className="h-[200px]">
                            <TktPlzSpinner />
                        </div>
                    ) : (
                        <div
                            ref={modalRef}
                            className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm mx-4"
                        >
                            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                                Login to Your Account
                            </h2>

                            <form className="space-y-4" onSubmit={login}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>


                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-2 rounded-xl transition duration-200 cursor-pointer font-medium
                    ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}
                  `}
                                >
                                    {loading ? "Signing In..." : "Sign In"}
                                </button>


                            </form>

                            <div className="my-4 flex items-center justify-between">
                                <span className="h-px bg-gray-300 w-1/4"></span>
                                <span className="text-sm text-gray-500">or continue with</span>
                                <span className="h-px bg-gray-300 w-1/4"></span>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleGoogleLogin(hideModal)}
                                    className="w-full flex items-center justify-center border border-gray-300 py-2 rounded-xl hover:bg-gray-100 cursor-pointer transition"
                                >
                                    <FcGoogle className="text-xl mr-2" />
                                    Continue with Google
                                </button>

                                {/* <NavLink
                  to="/telegram-auth"
                  className="w-full flex items-center justify-center border border-gray-300 py-2 rounded-xl hover:bg-gray-100 transition"
                >
                  <FaTelegramPlane className="text-xl mr-2 text-blue-500" />
                  Continue with Telegram
                </NavLink> */}
                            </div>

                            <p className="text-sm text-center text-gray-600 mt-4">
                                Don't have an account?{" "}

                                <button className="text-blue-600 hover:underline cursor-pointer"
                                    onClick={() => {
                                        showRegisterModal();
                                    }}>
                                    Register
                                </button>

                            </p>
                        </div>
                    )
                }
            </div>

        </>
    );
};