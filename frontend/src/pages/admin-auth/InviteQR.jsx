import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import QRCode from 'react-qr-code'

export const InviteQRPage = () => {
    const { email, token } = useParams();
    const decodedEmail = decodeURIComponent(email);
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const checkAndFetchQRCode = async () => {
            try {
                setLoading(true);
                // First, check invite validity
                const validityRes = await axios.post(
                    `${import.meta.env.VITE_BASE_URL}/api/auth/admin/checkInviteValidity`,
                    { email: decodedEmail, token }
                );
                if (!validityRes.data.success) {
                    setError(validityRes.data.message || "Link has expired. QR code can only be viewed once.");
                    setLoading(false);
                    return;
                }
                // Fetch QR code
                const res = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/api/auth/admin/invite/${decodedEmail}`
                );
                setQrCodeUrl(res.data.qrUrl);
                setLoading(false);
            } catch (err) {
                setLoading(false);
                setError(err?.response?.data?.message || "Something went wrong");
            }
        };
        checkAndFetchQRCode();
    }, [decodedEmail, token]);


    const handleProceed = async () => {
        setLoading(true);
        try {
            // Mark invite as used
            const markRes = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/api/auth/admin/markInviteVisited`,
                { email: decodedEmail, token }
            );
            if (!markRes.data.success) {
                setError(markRes.data.message || "Link has expired. QR code can only be viewed once.");
                setLoading(false);
                return;
            }
            navigate("/admin/login");
        } catch (err) {
            setError(err?.response?.data?.message || "Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
            <div className="bg-gray-100 p-6 rounded-2xl shadow-lg text-center max-w-sm w-full">
                {error ? (
                    // Show expired link message
                    <>
                        <h2 className="text-xl font-bold mb-4 text-red-600">Link Expired</h2>
                        <p className="text-gray-700 mb-6">{error}</p>
                        <button
                            onClick={() => navigate("/admin/login")}
                            className="bg-[#1A73E8] text-white font-medium px-6 py-2 rounded-xl hover:bg-[#1558c0] transition"
                        >
                            Go to Login
                        </button>
                    </>
                ) : (
                    // Show QR code
                    <>
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Scan QR to Set Up 2FA</h2>

                        {loading ? (
                            <p className="text-gray-500 mb-6">Loading QR code...</p>
                        ) : qrCodeUrl ? (
                            <div className="mx-auto mb-6 bg-white p-2 rounded flex justify-center">
                                <QRCode value={qrCodeUrl} size={180} />
                            </div>
                        ) : (
                            <p className="text-gray-500 mb-6">No QR code available</p>
                        )}

                        <p className="text-sm text-gray-600 mb-4">
                            Scan the QR code using Google Authenticator or any 2FA app. After that, click "Proceed" to login.
                            <br />
                            <span className="text-red-500 font-medium">Note: You can only view this QR code once.</span>
                        </p>

                        <button
                            onClick={handleProceed}
                            disabled={loading || !qrCodeUrl}
                            className={`${loading || !qrCodeUrl ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1A73E8] hover:bg-[#1558c0]'} text-white font-medium px-6 py-2 rounded-xl transition`}
                        >
                            Proceed
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}