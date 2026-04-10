import React, { useState } from "react";
import { loadRazorpayScript } from "../../utils/razorpay";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useBookingStore } from '../../store/bookingStore';
import { useNavigate } from "react-router-dom";
import PaymentVerificationLoader from './PaymentVerificationLoader';

function formatCurrency(amount) {
    if (typeof amount !== "number") return "";
    return "₹" + amount.toLocaleString();
}

const RazorpayButton = ({ totalAmount, summary }) => {
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const navigate = useNavigate();
    const userDetails = useAuth();
    const bookingInfo = useBookingStore((state) => state.bookingInfo);
    const userId = userDetails?.user?.userData?.id || userDetails?.user?.id || "";
    
    const {
        eventDetails = {},
        selectedSeats = [],
        categories = [],
        eventId = ""
    } = bookingInfo;

    const handlePayment = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const razorpayLoaded = await loadRazorpayScript();
            if (!razorpayLoaded) {
                navigate('/payment-failure', {
                    state: {
                        error: "Razorpay SDK failed to load. Please check your internet connection.",
                        eventDetails
                    }
                });
                return;
            }

            // Prepare request body for payment
            let body = { eventId, userId, eventDetails };
            
            if (eventDetails.type === 'Seating') {
                body.selectedSeats = selectedSeats;
                body.item = selectedSeats;
            } else if (eventDetails.type === 'Open' || eventDetails.type === 'Online') {
                body.categoriesBody = categories;
                body.item = categories;
            }

            // Create order from backend
            const orderResponse = await axios.post(import.meta.env.VITE_BASE_URL + '/api/payment/createOrder', body);
            const orderData = orderResponse.data;

            if (!orderData?.success || !orderData?.orderId) {
                navigate('/payment-failure', {
                    state: {
                        error: "Failed to create order. Please try again.",
                        eventDetails
                    }
                });
                return;
            }

            // Razorpay checkout options
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_your_key",
                amount: orderData.amount,
                currency: "INR",
                name: "TktPlz", 
                description: `Booking for ${eventDetails.eventName || 'Event'}`,
                order_id: orderData.orderId,
                handler: async (response) => {
                    try {
                        setVerifying(true);
                        const verifyResponse = await axios.post(import.meta.env.VITE_BASE_URL + '/api/payment/verifyPayment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            eventId,
                            userId,
                            selectedSeats,
                            categories,
                            eventDetails,
                            totalAmount: orderData.amount,
                            totalConvenienceFee: orderData.orderDetails.totalConvenienceFee
                        });

                        if (verifyResponse.data.success) {
                            // Navigate to success page with payment details
                            navigate('/payment-success', {
                                state: {
                                    paymentId: response.razorpay_payment_id,
                                    orderId: response.razorpay_order_id,
                                    eventDetails,
                                    summary,
                                    totalAmount: orderData.amount,
                                    bookingDetails: verifyResponse.data.bookingDetails,
                                    selectedSeats,
                                    categories
                                }
                            });
                        } else {
                            navigate('/payment-failure', {
                                state: {
                                    error: "Payment verification failed",
                                    orderId: response.razorpay_order_id,
                                    eventDetails
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        navigate('/payment-failure', {
                            state: {
                                error: error.response?.data?.error || "Payment verification failed",
                                orderId: response.razorpay_order_id,
                                eventDetails
                            }
                        });
                    } finally {
                        setVerifying(false);
                    }
                },
                prefill: {
                    email: userDetails?.user?.userData?.email || userDetails?.user?.email || "",
                    contact: userDetails?.user?.userData?.phone || ""
                },
                theme: {
                    color: "#1A73E8"
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        navigate('/payment-failure', {
                            state: {
                                error: "Payment was cancelled",
                                eventDetails
                            }
                        });
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Payment error:', error);
            navigate('/payment-failure', {
                state: {
                    error: error.response?.data?.error || "Failed to initiate payment",
                    eventDetails
                }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                className={`w-full ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer`}
                onClick={handlePayment}
                disabled={loading || (summary && totalAmount === 0)}
            >
                {loading ? 'Processing...' : `Proceed To Pay ${formatCurrency(totalAmount)} →`}
            </button>
            <PaymentVerificationLoader isVisible={verifying} />
        </>
    );
};

export default RazorpayButton;


