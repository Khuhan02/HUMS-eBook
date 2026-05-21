import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { 
  Shield, 
  Sparkles, 
  LogIn, 
  Mail, 
  User as UserIcon, 
  ExternalLink, 
  ArrowLeft, 
  KeyRound, 
  Clock, 
  Code,
  AlertTriangle,
  Fingerprint
} from 'lucide-react';

interface LoginScreenProps {
  onBypassLogin: (demoUser: { uid: string; email: string; displayName: string }) => void;
}

export default function LoginScreen({ onBypassLogin }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Interface view: 'tab' selection or 'otp' validation
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Input states
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [otpInput, setOtpInput] = useState('');

  // Status/Flow states
  const [sandboxOtp, setSandboxOtp] = useState<string | null>(null);
  const [emailSentReal, setEmailSentReal] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [checkingOtp, setCheckingOtp] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Timer countdown hook for OTP resend request lock
  useEffect(() => {
    if (otpSecondsLeft > 0) {
      const timer = setTimeout(() => {
        setOtpSecondsLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpSecondsLeft]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Sign-In failed or blocked in Sandbox iframe:", err);
      setError(
        "Google pop-up was blocked or restricted because this application is running inside a sandboxed live preview iframe (cross-origin restrictions). You can either open the app in a new tab, or use our secure email OTP authentication below to instantly authenticate!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const email = emailInput.trim();
    if (!email || !email.includes('@')) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (activeTab === 'signup' && !nameInput.trim()) {
      setFormError("Please enter your full name for clinical registration.");
      return;
    }

    setSendingOtp(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          fullName: activeTab === 'signup' ? nameInput.trim() : undefined
        })
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error(`Server returned a non-JSON response (${response.status} ${response.statusText || 'Error'}). If you are testing, please try again or restart the dev server.`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not dispatch verification code");
      }

      setSandboxOtp(data.sandboxOtp || null);
      setEmailSentReal(data.emailSent || false);
      setIsOtpSent(true);
      setOtpSecondsLeft(45); // lock button for 45s
      setFormSuccess(data.message || "Verification code dispatched!");
    } catch (err: any) {
      setFormError(err.message || "Failed to contact OTP endpoint");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const otp = otpInput.trim();
    if (!otp) {
      setFormError("Please enter the 6-digit OTP code sent in mail.");
      return;
    }

    setCheckingOtp(true);
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          otp: otp
        })
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error(`Server returned a non-JSON verification response (${response.status} ${response.statusText || 'Error'}).`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Incorrect OTP code. Please check code or try again.");
      }

      // Compute deterministic, unique database ID associated with this email
      const sanitizedEmail = emailInput.trim().toLowerCase();
      const hash = sanitizedEmail.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const uid = `hums_patient_${hash}_${sanitizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // In Sign-In tab, name is loaded from DB profile. If they are a new sign-up, we associate the entered name input field!
      const finalName = activeTab === 'signup' 
        ? nameInput.trim() 
        : sanitizedEmail.split('@')[0];

      onBypassLogin({
        uid: uid,
        email: sanitizedEmail,
        displayName: finalName
      });
    } catch (err: any) {
      setFormError(err.message || "OTP check failed.");
    } finally {
      setCheckingOtp(false);
    }
  };

  const handleBackToLoginOption = () => {
    setIsOtpSent(false);
    setOtpInput('');
    setFormError(null);
    setFormSuccess(null);
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
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Banner Graphic background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-8 text-center relative">
          <div className="absolute top-3 right-3 bg-white/25 text-white text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-widest">
            Malaysia
          </div>
          <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md shadow-sm">
            <span className="text-white font-bold text-3xl">🏢</span>
          </div>
          <h1 className="text-white text-2xl font-black font-sans tracking-tight">HUMS eBook</h1>
          <p className="text-blue-100 text-xs mt-1 max-w-xs mx-auto font-medium">
            Poliklinik & Hospital Universiti Malaysia Sabah digital Appointment Gate
          </p>
        </div>

        <div className="p-6 space-y-6">
          {!isOtpSent ? (
            <>
              {/* Tabs Switcher for Sign-In and Sign-Up */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setFormError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'signin' 
                      ? 'bg-white text-blue-600 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Registered Patient
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setFormError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'signup' 
                      ? 'bg-white text-blue-600 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  New Patient Sign-Up
                </button>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-lg font-black text-slate-800">
                  {activeTab === 'signin' ? 'Verify Registered ID' : 'Clinic Registration Initiator'}
                </h2>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {activeTab === 'signin' 
                    ? 'Enter your registered email address to receive a secure login OTP code.' 
                    : 'Initialize your electronic patient profile by verifying your email address first.'}
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
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline text-[11px]"
                    >
                      <ExternalLink size={12} /> Open app in new tab to use actual Firebase Google Login
                    </a>
                  </div>
                </div>
              )}

              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center text-xs text-red-600 font-semibold leading-relaxed">
                  ⚠️ {formError}
                </div>
              )}

              {/* Patient Identity Login trigger */}
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-3">
                  
                  {activeTab === 'signup' && (
                    <div className="relative">
                      <label className="sr-only">Full Name</label>
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <UserIcon size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name (As in MyKad/Passport)"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="block h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  )}

                  <div className="relative">
                    <label className="sr-only">Email Address</label>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="Your Email (e.g. patient@gmail.com)"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="block h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="w-full h-12 bg-blue-600 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-xs hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer text-sm disabled:opacity-50"
                >
                  {sendingOtp ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                  ) : (
                    <Fingerprint size={16} />
                  )}
                  {activeTab === 'signin' ? 'Verify Identity & Request OTP' : 'Request OTP Code & Register'}
                </button>
              </form>
            </>
          ) : (
            /* OTP Handshake input step */
            <div className="space-y-5">
              <button
                type="button"
                onClick={handleBackToLoginOption}
                className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
              >
                <ArrowLeft size={14} /> Back to email input
              </button>

              <div className="text-center space-y-1.5">
                <span className="text-3xl">🔐</span>
                <h2 className="text-lg font-black text-slate-800">Secure OTP Handshake</h2>
                <p className="text-slate-500 text-xs">
                  We sent a 6-digit verification code to
                </p>
                <p className="text-blue-600 font-mono font-bold text-xs shrink-all">{emailInput}</p>
              </div>

              {formSuccess && (
                <div className="p-3 bg-blue-50 border border-blue-100 text-center rounded-xl text-xs text-blue-800 font-medium leading-relaxed">
                  ℹ️ {formSuccess}
                </div>
              )}

              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center text-xs text-red-600 font-semibold leading-relaxed">
                  ⚠️ {formError}
                </div>
              )}

              {/* Developer Sandbox Simulator Assistant */}
              {sandboxOtp && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-black text-emerald-900 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Code size={13} /> Developer Sandbox Dispatcher</span>
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[9px]">Simulator Active</span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Since you are evaluating this app inside the browser's preview box, we have intercepted the verification email. Directly click the key below to auto-fill and test!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpInput(sandboxOtp);
                      setFormError(null);
                    }}
                    className="w-full py-2.5 bg-white hover:bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl flex items-center justify-center gap-2 group cursor-pointer transition-all active:scale-95"
                  >
                    <KeyRound size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="font-mono font-black text-emerald-700 tracking-widest text-sm">{sandboxOtp}</span>
                    <span className="text-[10px] text-emerald-500 font-bold bg-emerald-100/50 px-2 py-0.5 rounded-md ml-1">Auto-Fill Key</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="relative">
                  <label className="sr-only">Verification Code</label>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP code"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                    className="block h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-center text-sm font-mono font-bold tracking-widest placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1"><Clock size={12} /> Expiration in 5:00</span>
                  
                  {otpSecondsLeft > 0 ? (
                    <span className="text-slate-400 font-semibold">Resend OTP in {otpSecondsLeft}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleRequestOtp(e)}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Request new code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={checkingOtp}
                  className="w-full h-12 bg-blue-600 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-xs hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer text-sm disabled:opacity-50"
                >
                  {checkingOtp ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                  ) : (
                    <LogIn size={16} />
                  )}
                  Verify Handshake & Login
                </button>
              </form>
            </div>
          )}

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold tracking-widest uppercase">Or try credentials alternatives</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="space-y-3">
            {/* Secondary Google Login */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="w-full h-12 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50 text-xs cursor-pointer"
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
              className="w-full h-12 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] text-xs cursor-pointer"
            >
              <Sparkles size={14} className="text-amber-500 animate-pulse" />
              Fast Sandbox Demo Entrance
            </button>
          </div>

          {/* Secure details info */}
          <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <Shield className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700 block mb-0.5">Compliant Patient Database Encryption</span>
              Your Malaysia MyKad/Passport records and patient profiles are governed under PDPA (Personal Data Protection Act) standards.
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
