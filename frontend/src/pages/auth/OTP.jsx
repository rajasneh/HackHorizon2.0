import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Timer } from "../../components/Other/Timer";
import { useModal } from "../../context/ModalContext";
import { useAuth } from "../../context/AuthContext";
import { IoIosArrowBack } from "react-icons/io";

export const OTP = () => {

    const [otp, setOtp] = useState(new Array(6).fill(""));
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const { hideModal, showLoginModal, redirectUrl } = useModal();
    const modalRef = useRef();
    const { emailData, setUser } = useAuth();

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [])


    const handleOtpVerification = async (inputOtp) => {
        try {

            const email = emailData;

            const res = await fetch(import.meta.env.VITE_BASE_URL + "/api/auth/verify-otp", {
                method: "POST",
                credentials: "include", // Allow cookies to be sent and received
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inputOtp, email }), // Sending email
            })

            const data = await res.json();
            console.log("Data : ", data);

            if (res.ok) {
                // Show success toast on login
                toast.success("Logged in successfully!");

                if (data.role === "user") {
                    hideModal();
                    setUser(data);
                    // Redirect to stored URL or default to home
                    navigate(redirectUrl || "/");
                }
                else if (data.role === "organiser") {
                    navigate("/orgn/dashboard");
                }
                else if (data.role === "moderator") {
                    navigate("/admin/home")
                }
                else {
                    console.log("Some error in handleOtpVerification");
                    alert("Errorrrr!!!")
                }

            } else {
                console.log("Response not OK : ", data.message);
                toast.error(data.message);
            }

        } catch (err) {
            console.log(err);
            toast.error("Error in verifying OTP : ", err.message)
        }
    }

    const handleChange = (index, e) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newOtp = [...otp];
        // allow only one input
        newOtp[index] = val.substring(val.length - 1);
        setOtp(newOtp);

        // submit trigger
        const combinedOtp = newOtp.join("");
        if (combinedOtp.length === 6) {
            handleOtpVerification(combinedOtp);
        }

        // Move to next input if current field is filled
        if (val && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    }

    const handleClick = (index) => {
        inputRefs.current[index].setSelectionRange(1, 1);
    }

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
            // Moving cursor to the previous input field on pressing backspace
            inputRefs.current[index - 1].focus();
        }
    }

    const handleTimeout = () => {
        toast.error("OTP expired! Please request a new one.");
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
            {/* Modal Box */}
            <div
                className="relative w-full max-w-md mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8 border border-gray-200"
                onClick={(e) => e.stopPropagation()} // Prevent close on modal click
            >
                {/* Back Icon */}
                <button
                    className="absolute top-4 left-4 text-gray-500 hover:text-[#1A73E8] text-2xl"
                    onClick={() => showLoginModal()}
                >
                    <IoIosArrowBack />
                </button>

                {/* Heading */}
                <h2 className="text-2xl md:text-3xl font-semibold text-center text-gray-800 mb-6">
                    Verify OTP
                </h2>

                {/* OTP Inputs */}
                <div className="flex justify-center gap-2 mb-4">
                    {otp.map((val, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength={1}
                            ref={(input) => (inputRefs.current[index] = input)}
                            value={val}
                            onChange={(e) => handleChange(index, e)}
                            onClick={() => handleClick(index)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-12 md:w-16 md:h-16 text-xl text-center font-semibold rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:bg-white transition-all duration-150"
                        />
                    ))}
                </div>

                {/* Timer Component */}
                <div className="flex justify-center">
                    <Timer onTimeout={handleTimeout} />
                </div>
            </div>
        </div>
    );
}