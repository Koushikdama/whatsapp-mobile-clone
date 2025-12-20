
import React from 'react';



const AuraLogo = () => (
    <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
        {/* Background Gradient Circle */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-400 via-wa-teal to-blue-600 opacity-20 blur-xl animate-pulse"></div>

        <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-lg"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="auraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2DD4BF" /> {/* Teal-400 */}
                    <stop offset="100%" stopColor="#008069" /> {/* WA Teal */}
                </linearGradient>
            </defs>

            {/* Main Shape: Abstract Chat/Signal Fusion */}
            <path
                d="M50 10 C27.9 10 10 27.9 10 50 C10 65.5 18.8 78.9 31.5 85.5 L28 95 L42 89 C44.6 89.6 47.3 90 50 90 C72.1 90 90 72.1 90 50 C90 27.9 72.1 10 50 10 Z"
                fill="url(#auraGradient)"
            />

            {/* Inner "Aura" Wave */}
            <path
                d="M35 50 Q50 25 65 50 T95 50"
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.3"
            />

            {/* Core Spark */}
            <circle cx="50" cy="50" r="8" fill="white" />
        </svg>
    </div>
);

const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen w-full bg-[#EFEAE2] dark:bg-[#0b141a] relative flex flex-col items-center justify-start md:justify-center overflow-hidden">
            {/* Background Pattern */}
            <div
                className="absolute inset-0 opacity-40 pointer-events-none z-0"
                style={{
                    backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                    backgroundRepeat: 'repeat',
                    backgroundSize: '400px'
                }}
            ></div>

            {/* Top Gradient Band (Desktop) */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-wa-teal to-transparent -z-10 hidden md:block opacity-90"></div>

            {/* Logo/Header */}
            <div className="z-10 flex flex-col items-center gap-4 mb-8 md:mb-10 pt-12 md:pt-0">
                <AuraLogo />
                <h1 className="text-4xl font-extrabold text-wa-teal dark:text-gray-100 md:text-white tracking-tight drop-shadow-sm">
                    Aura
                </h1>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 md:text-white/80 uppercase tracking-widest">
                    Connect Beyond Words
                </p>
            </div>

            {/* Main Card */}
            <div className="w-full max-w-md bg-white/95 dark:bg-wa-dark-paper/95 backdrop-blur-md rounded-t-3xl md:rounded-2xl shadow-2xl p-8 z-10 flex-1 md:flex-none animate-in slide-in-from-bottom-10 duration-300 border border-white/20">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-[#111b21] dark:text-gray-100">{title}</h2>
                    {subtitle && <p className="text-[#667781] dark:text-gray-400 mt-2 text-sm leading-relaxed">{subtitle}</p>}
                </div>
                {children}
            </div>

            {/* Footer */}
            <div className="py-6 text-center z-10 hidden md:block">
                <p className="text-gray-500 text-xs">Powered by <span className="font-bold text-wa-teal">Aura Systems</span></p>
            </div>
        </div>
    );
};

export default AuthLayout;
