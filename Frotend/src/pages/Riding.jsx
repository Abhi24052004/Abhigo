import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import LiveTracking from '../components/DestinationLiveTracking';
import axios from 'axios';

const VEHICLE_IMAGES = {
    car: 'https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg',
    moto: 'https://shorturl.at/5zCIa',
    auto: 'https://shorturl.at/B2YCj',
};

const Riding = () => {
    const location = useLocation();
    const { ride } = location.state || {};
    const { socket } = useContext(SocketContext);
    const navigate = useNavigate();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const vehicle = ride?.captain?.vehicle?.vehicleType || 'car';
    const link = VEHICLE_IMAGES[vehicle] || VEHICLE_IMAGES.car;

    // Load Razorpay script on mount
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    // Listen for ride-ended socket event
    useEffect(() => {
        const handleRideEnded = () => {
            setShowPaymentModal(true); // Automatically show payment modal
        };

        socket.on("ride-ended", handleRideEnded);

        return () => {
            socket.off("ride-ended", handleRideEnded);
        };
    }, [socket]);

    // Handle Cash Payment
    const handleCashPayment = async () => {
        try {
            const res = await axios.post(`${BASE_URL}/rides/makePaymentForRide`, {
                rideId: ride?._id,
                paymentmode: "cash"
            });

            if (res.data.success) {
                setPaymentSuccess(true);
                setTimeout(() => {
                    navigate('/home'); // Navigate to home after success
                }, 1500);
            } else {
                alert("Payment update failed ❌");
            }
        } catch (err) {
            console.error("Cash payment error:", err);
            alert("Error updating cash payment ❌");
        }
    };

    // Handle Online Payment (Razorpay)
    const handleOnlinePayment = async () => {
        try {
            if (!window.Razorpay) {
                alert("Razorpay SDK not loaded. Please try again in a moment.");
                return;
            }

            const order = {
                id: `order_${Date.now()}`,
                amount: ride.fare * 100,
                currency: "INR",
            };
            console.log(order);

            const options = {
                key: "rzp_test_Ra2SvvOWqgqNtS",
                amount: order.amount,
                currency: order.currency,
                name: "AbhiGo Payment",
                description: "Ride Fare Payment",
                // order_id: order.id,
                handler: async function (response) {
                    try {
                        console.log('run handler');

                        const verifyRes = await axios.post(
                            `${BASE_URL}/rides/makePaymentForRide`,
                            {
                                rideId: ride?._id,
                                paymentmode: "online",
                                paymentID: response.razorpay_payment_id,
                            }
                        );

                        if (verifyRes.data.success) {
                            setPaymentSuccess(true);
                            setTimeout(() => {
                                navigate('/home'); // Navigate to home after success
                            }, 1500);
                        } else {
                            alert("Payment verification failed ❌");
                        }
                    } catch (err) {
                        console.error("Payment verification error:", err);
                        alert("Error verifying payment ❌");
                    }
                },
                // prefill: {
                //   name: ride?.user?.fullname || "Customer",
                //   email: "customer@example.com",
                //   contact: "9999999999",
                // },
                // theme: { color: "#16a34a" },
            };

            const rzp = new window.Razorpay(options);
            // rzp.on("payment.failed", function (response) {
            //   console.error(response.error);
            //   alert("Payment Failed ❌");
            // });
            rzp.open();
        } catch (err) {
            console.error("Error initiating Razorpay:", err);
            alert("Could not start Razorpay payment ❌");
        }
    };

    const handleCloseModal = () => {
        setShowPaymentModal(false);
    };

    const handleMakePayment = () => {
        setShowPaymentModal(true);
    };

    return (
        <div className='h-screen relative'>
            <Link
                to='/home'
                className='fixed right-2 top-2 h-10 w-10 bg-white flex items-center justify-center rounded-full shadow z-20'
            >
                <i className='text-lg font-medium ri-home-5-line'></i>
            </Link>

            {/* Map / tracking section */}
            <div className='h-1/2'>
                <LiveTracking ride={ride} />
            </div>

            {/* Ride details section */}
            <div className='h-1/2 p-4 bg-white'>
                <div className='flex items-center justify-between'>
                    <img
                        className='h-12 rounded-md'
                        src={link}
                        alt='vehicle'
                    />
                    <div className='text-right'>
                        <h2 className='text-lg font-medium capitalize'>
                            {ride?.captain.fullname.firstname}
                        </h2>
                        <h4 className='text-xl font-semibold -mt-1 -mb-1'>
                            {ride?.captain.vehicle.plate}
                        </h4>
                        <p className='text-sm text-gray-600'></p>
                    </div>
                </div>

                <div className='w-full mt-5'>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="text-lg ri-map-pin-user-fill"></i>
                        <div>
                            {/* <h3 className='text-lg font-medium'>{ride?.pickup}</h3> */}
                            <p className='text-sm -mt-1 text-gray-600 break-words'>
                                {ride?.pickup}
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className='text-lg ri-map-pin-2-fill'></i>
                        <div>
                            {/* <h3 className='text-lg font-medium'>{ride?.pickup}</h3> */}
                            <p className='text-sm -mt-1 text-gray-600'>
                                {ride?.destination}
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3'>
                        <i className='ri-currency-line'></i>
                        <div>
                            <h3 className='text-lg font-medium'>₹{ride?.fare}</h3>
                            <p className='text-sm -mt-1 text-gray-600'>
                                {ride?.paymentmode
                                    ? `Paid via ${ride.paymentmode}`
                                    : 'Payment Pending'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* {!ride?.paymentmode && (
          <button
            onClick={handleMakePayment}
            className='w-full mt-5 bg-green-600 text-white font-semibold p-2 rounded-lg'
          >
            Make a Payment
          </button>
        )} */}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-30'>
                    <div className='bg-white w-full rounded-t-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto shadow-2xl'>
                        {!paymentSuccess ? (
                            <div className='flex flex-col items-center'>
                                {/* Success Icon */}
                                <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4'>
                                    <i className='ri-check-line text-4xl text-green-600'></i>
                                </div>

                                {/* Title */}
                                <h2 className='text-2xl font-semibold mb-2 text-center text-gray-800'>
                                    Ride Completed!
                                </h2>
                                <p className='text-gray-600 text-center mb-6'>
                                    Your ride has ended successfully. Please complete the payment.
                                </p>

                                {/* Fare Details Card */}
                                <div className='w-full bg-gray-50 rounded-xl p-4 mb-6'>
                                    <div className='flex justify-between items-center mb-3 pb-3 border-b border-gray-200'>
                                        <span className='text-gray-600 font-medium'>Total Fare</span>
                                        <span className='text-3xl font-bold text-gray-800'>
                                            ₹{ride?.fare}
                                        </span>
                                    </div>

                                    {/* Route Info */}
                                    <div className='space-y-3'>
                                        <div className='flex items-start gap-3'>
                                            <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                                                <i className='ri-map-pin-line text-green-600'></i>
                                            </div>
                                            <div className='flex-1'>
                                                <p className='text-xs text-gray-500 mb-1'>Pickup</p>
                                                <p className='text-sm font-medium text-gray-700'>{ride?.pickup}</p>
                                            </div>
                                        </div>

                                        <div className='flex items-start gap-3'>
                                            <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                                                <i className='ri-map-pin-fill text-red-600'></i>
                                            </div>
                                            <div className='flex-1'>
                                                <p className='text-xs text-gray-500 mb-1'>Destination</p>
                                                <p className='text-sm font-medium text-gray-700'>{ride?.destination}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method Selection */}
                                <div className='w-full mb-4'>
                                    <h3 className='text-lg font-medium mb-3 text-center text-gray-800'>
                                        Select Payment Method
                                    </h3>

                                    {/* Online Payment Button */}
                                    <button
                                        onClick={handleOnlinePayment}
                                        className='w-full bg-green-600 text-white py-4 rounded-xl font-semibold mb-3 active:bg-green-700 transition-colors shadow-lg'
                                    >
                                        <span className='flex items-center justify-center gap-2'>
                                            <i className='ri-smartphone-line text-xl'></i>
                                            Pay Online (Razorpay)
                                        </span>
                                    </button>

                                    {/* Cash Payment Button */}
                                    <button
                                        onClick={handleCashPayment}
                                        className='w-full bg-gray-800 text-white py-4 rounded-xl font-semibold mb-3 active:bg-gray-900 transition-colors shadow'
                                    >
                                        <span className='flex items-center justify-center gap-2'>
                                            <i className='ri-money-rupee-circle-line text-xl'></i>
                                            Pay with Cash
                                        </span>
                                    </button>
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={handleCloseModal}
                                    className='w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium active:bg-gray-200 transition-colors'
                                >
                                    I'll Pay Later
                                </button>

                                <p className='text-xs text-gray-500 text-center mt-4'>
                                    🔒 Secure payment powered by Razorpay
                                </p>
                            </div>
                        ) : (
                            // Payment Success Screen
                            <div className='flex flex-col items-center py-8'>
                                <div className='w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-scale-in'>
                                    <i className='ri-check-double-line text-5xl text-green-600'></i>
                                </div>
                                <h2 className='text-2xl font-bold mb-2 text-gray-800'>
                                    Payment Successful!
                                </h2>
                                <p className='text-gray-600 text-center mb-4'>
                                    Thank you for your payment
                                </p>
                                <div className='flex items-center gap-2 text-gray-600'>
                                    <div className='animate-spin'>
                                        <i className='ri-loader-4-line text-xl'></i>
                                    </div>
                                    <span>Redirecting to home...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
      `}</style>
        </div>
    );
};

export default Riding;
