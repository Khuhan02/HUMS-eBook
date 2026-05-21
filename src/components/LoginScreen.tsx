import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { Shield, Sparkles, LogIn, CheckCircle } from 'lucide-react';

interface LoginScreenProps {
  onBypassLogin: (demoUser: { uid: string; email: string; displayName: string }) => void;
}

export default function LoginScreen({ onBypassLogin }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Sign-In failed or blocked in Sandbox iframe:", err);
      setError("Google pop-up was block-restricted inside this iframe. Please open the app in a new tab or use the Fast Sandbox Access mode below.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    // Standard test user for clinic inspection
    onBypassLogin({
      uid: "hums_demo_patient_101",
      email: "khuhanmag@gmail.com",
      displayName: "Khuhan Malaysian"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Banner Graphic background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-8 text-center relative">
          <div className="absolute top-3 right-3 bg-white/25 text-white text-xs px-2.5 py-1 rounded-full font-medium tracking-wide">
            Malaysia
          </div>
          <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <span className="text-white font-bold text-3xl">🏣</span>
          </div>
          <h1 className="text-white text-2xl font-bold font-sans">HUMS eBook</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xs mx-auto">
            Poliklinik & Hospital Universiti Malaysia Sabah Digital Appointment Gate
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-slate-800">Secure Identity Access</h2>
            <p className="text-slate-500 text-sm">
              Sign in with your email to start booking consultations and tracking live queues.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700 leading-relaxed">
              <span className="font-bold underline block mb-1">Sandbox Notice:</span>
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* Primary Google Login */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-14 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-3 shadow hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
              ) : (
                <LogIn size={20} />
              )}
              Google Sign-In with Firebase
            </button>

            {/* Sandbox Bypass Access for evaluating in the iframe */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold tracking-wider uppercase">Or Test instantly</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              onClick={handleDemoAccess}
              className="w-full h-14 bg-white hover:bg-slate-50 text-blue-600 border-2 border-dashed border-blue-400 font-bold rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
            >
              <Sparkles size={18} className="text-amber-500" />
              Fast Sandbox Demo Entrance
            </button>
          </div>

          {/* Secure details info */}
          <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <Shield className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700 block mb-0.5">Compliant Patient Database Encryption</span>
              Your Malaysia MyKad/Passport records and patient profiles are governed under PDPA (Malaysian Personal Data Protection Act) standards.
            </div>
          </div>
        </div>
      </div>
      <div className="text-slate-400 text-xs mt-6 font-mono">
        HUMS Electronic Booking & Queue Tool • 2026
      </div>
    </div>
  );
}
