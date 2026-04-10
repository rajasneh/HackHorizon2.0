import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaArrowLeft } from "react-icons/fa";

export const OrganiserOtpVerifyPage = () => {
    const [inputOtp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const { emailData, setUser } = useAuth(); // assuming email is stored during login/register
    const navigate = useNavigate();

    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        if (!inputOtp || inputOtp.length !== 6) {
            toast.error("Enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            console.log("Email Data inside try : ", emailData);
            const response = await fetch(import.meta.env.VITE_BASE_URL + "/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify({ email: emailData, inputOtp }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("OTP Verified!");
                setUser(data?.userData);
                navigate("/organiser/dashboard"); // change this route based on your actual dashboard
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            console.log("OTP Verification Error:", err);
            toast.error("Something went wrong!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left Part */}
            <div className="relative w-full md:w-1/2 bg-gradient-to-br from-blue-700 to-orange-500 text-white flex flex-col justify-center items-center p-6 md:p-10">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 text-white hover:text-gray-200 transition-colors cursor-pointer"
                >
                    <FaArrowLeft size={20} />
                </button>

                <h1 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 text-center">Verify Your OTP</h1>
                <p className="text-sm md:text-lg text-center max-w-xs md:max-w-md">
                    A 6-digit OTP has been sent to <span className="font-semibold">{emailData}</span>. Please enter it below to continue.
                </p>
            </div>

            {/* Right Part */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-10">
                <form
                    onSubmit={handleVerifyOtp}
                    className="w-full max-w-xs md:max-w-md space-y-5 md:space-y-6 bg-white p-4 md:p-8 shadow-xl rounded-2xl border"
                >
                    <h2 className="text-xl md:text-2xl font-semibold text-center text-gray-800 mb-3 md:mb-4">OTP Verification</h2>

                    <div>
                        <label htmlFor="inputOtp" className="block text-xs md:text-sm font-medium text-gray-600">
                            Enter OTP
                        </label>
                        <input
                            type="text"
                            id="inputOtp"
                            maxLength="6"
                            className="mt-1 block w-full px-3 md:px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 tracking-widest text-center text-lg md:text-xl"
                            value={inputOtp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            autoComplete="off"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 text-white rounded-lg font-medium ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                            } transition-all duration-200`}
                    >
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </form>
            </div>
        </div>
    );
};
