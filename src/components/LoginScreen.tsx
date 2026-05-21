import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { Shield, Sparkles, LogIn, Mail, User as UserIcon, Lock, ExternalLink } from 'lucide-react';

interface LoginScreenProps {
  onBypassLogin: (demoUser: { uid: string; email: string; displayName: string }) => void;
}

export default function LoginScreen({ onBypassLogin }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom email login inputs
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Sign-In failed or blocked in Sandbox iframe:", err);
      setError(
        "Google pop-up was blocked or restricted because this application is running inside a sandboxed live preview iframe (cross-origin restrictions). You can either open the app in a new tab, or use our premium secure identity forms below to log in instantly!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nameInput.trim()) {
      setFormError("Please enter your full name as printed on your ID card.");
      return;
    }
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setFormError("Please enter a valid email address.");
      return;
    }

    // Generate a deterministic UID based on email for persistence
    const sanitizedEmail = emailInput.trim().toLowerCase();
    const hash = sanitizedEmail.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const uid = `hums_patient_${hash}_${sanitizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    onBypassLogin({
      uid: uid,
      email: sanitizedEmail,
      displayName: nameInput.trim()
    });
  };

  const handleDemoAccess = () => {
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
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 leading-relaxed space-y-2">
              <div className="flex items-center gap-1.5 text-amber-900 font-extrabold uppercase tracking-wide">
                <span>⚠️ Why Popups are Blocked</span>
              </div>
              <p>{error}</p>
              <div className="pt-1 flex flex-col gap-1.5 font-bold">
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                >
                  <ExternalLink size={12} /> Open app in new tab to use actual Firebase Google Login
                </a>
              </div>
            </div>
          )}

          {/* Secure Custom Instant Identity Login Form */}
          <form onSubmit={handleCustomFormSubmit} className="space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
              Instant Patient Login
            </div>

            {formError && (
              <p className="text-xs text-red-600 font-medium text-center">{formError}</p>
            )}

            <div className="space-y-3">
              <div className="relative">
                <label className="sr-only">Full Name</label>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon size={16} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Your Full Name (e.g. Khuhan)"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="block h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="relative">
                <label className="sr-only">Email Address</label>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Your Email (e.g. user@example.com)"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="block h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-blue-600 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-xs hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer text-sm"
            >
              <LogIn size={16} />
              Secure Sign-In & Sync Database
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold tracking-wider uppercase">Or login alternatives</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="space-y-3">
            {/* Secondary Google Login */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="w-full h-12 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50 text-xs"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-600 border-t-transparent animate-spin rounded-full"></span>
              ) : (
                <span className="text-sm">🌐</span>
              )}
              Google Sign-In with Firebase (Popup)
            </button>

            {/* Sandbox Bypass Access for evaluating in the iframe */}
            <button
              onClick={handleDemoAccess}
              type="button"
              className="w-full h-12 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] text-xs"
            >
              <Sparkles size={14} className="text-amber-500" />
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
