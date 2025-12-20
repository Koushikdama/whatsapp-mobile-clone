
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../../shared/context/AppContext';
import AuthLayout from './AuthLayout';
import Lottie from 'lottie-react';

const VerifyOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, updateUserProfile } = useApp();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);
    const [isLoading, setIsLoading] = useState(false);
    const [animationData, setAnimationData] = useState(null);

    // Get passed state (email/name) or defaults
    const email = location.state?.email || 'your email';
    const name = location.state?.name;

    // Fetch Lottie Animation
    useEffect(() => {
        fetch('https://lottie.host/80362206-8207-4467-bc82-9694e9f7336e/Gu7XQ72ZkZ.json')
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error("Lottie Load Error", err));
    }, []);

    const handleChange = (index, value) => {
        if (value.length > 1) {
            // Handle paste
            const chars = value.split('').slice(0, 6);
            const newOtp = [...otp];
            chars.forEach((c, i) => {
                if (index + i < 6) newOtp[index + i] = c;
            });
            setOtp(newOtp);
            if (index + chars.length < 6) {
                inputRefs.current[index + chars.length]?.focus();
            } else {
                inputRefs.current[5]?.focus();
            }
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-advance
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) return;

        setIsLoading(true);
        // Simulate verification
        setTimeout(() => {
            if (name) {
                // If coming from signup, update profile
                updateUserProfile(name, "Available", "https://picsum.photos/seed/newuser/200");
            }
            login();
            navigate('/chats');
            setIsLoading(false);
        }, 1500);
    };

    return (
        <AuthLayout title="Verify your email" subtitle={`We've sent a 6-digit code to ${email}.`}>
            <form onSubmit={handleVerify} className="flex flex-col items-center gap-6">

                {/* Lottie Animation */}
                <div className="w-32 h-32 md:w-40 md:h-40 -mt-4">
                    {animationData && <Lottie animationData={animationData} loop={true} />}
                </div>

                <div className="flex gap-2 justify-center w-full">
                    {otp.map((digit, idx) => (
                        <input
                            key={idx}
                            ref={(el) => { inputRefs.current[idx] = el; }}
                            type="text"
                            maxLength={6}
                            className="w-10 h-12 md:w-12 md:h-14 border-b-2 border-gray-300 dark:border-gray-600 focus:border-wa-teal bg-transparent text-center text-xl font-medium outline-none text-[#111b21] dark:text-gray-100 transition-all focus:scale-110 focus:border-b-4"
                            value={digit}
                            onChange={(e) => handleChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                        />
                    ))}
                </div>

                <div className="text-center space-y-4 w-full">
                    <button type="button" className="text-wa-teal font-medium text-sm hover:underline flex items-center justify-center gap-1 mx-auto">
                        Resend Email
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={otp.join('').length < 6 || isLoading}
                    className={`w-full py-3 rounded-full font-bold text-white transition-all mt-2
                        ${otp.join('').length < 6 || isLoading ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-wa-teal hover:bg-wa-tealDark shadow-md active:scale-95'}
                    `}
                >
                    {isLoading ? 'Verifying...' : 'Verify'}
                </button>
            </form>
        </AuthLayout>
    );
};

export default VerifyOtp;
