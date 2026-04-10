import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";


export const MobileAuth = () => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);

    useEffect(() => {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {
              console.log('reCAPTCHA solved');
            },
            'expired-callback': () => {
              alert('reCAPTCHA expired. Please try again.');
            },
          });
    
          window.recaptchaVerifier.render().then(widgetId => {
            window.recaptchaWidgetId = widgetId;
          });
        }
      }, []);

      const handleSendOTP = async () => {
        // setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        try {
          const result = await signInWithPhoneNumber(auth, `+91${phone}`, appVerifier);
          console.log("Phone number : ", `+91${phone}`)
          setConfirmationResult(result);
          toast.success('OTP sent');
        } catch (err) {
          console.error(err);
          toast.error('Error sending OTP');
        }
      };


    const handleVerifyOTP = async () => {
        try {
            const res = await confirmationResult.confirm(otp);
            const idToken = await res.user.getIdToken();

            // Send token to backend for verification and DB storage
            const serverRes = await axios.post(import.meta.env.VITE_BASE_URL + '/auth/verify', { idToken });
            toast.success(`Logged in as ${serverRes.data.phoneNumber}`);
        } catch (err) {
            console.error(err);
            toast.error('Invalid OTP');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm space-y-6">
                <h2 className="text-2xl font-semibold text-center text-gray-800">Mobile Authentication</h2>

                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Enter Phone Number"
                        onChange={e => setPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSendOTP}
                        className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition duration-300 cursor-pointer"
                    >
                        Send OTP
                    </button>
                </div>

                <div id="recaptcha-container" />

                {/* <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        onChange={e => setOtp(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleVerifyOTP}
                        className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition duration-300 cursor-pointer"
                    >
                        Verify OTP
                    </button>
                </div> */}
            </div>
        </div>

    );
}