import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { User } from '../types';

interface PatientRegistrationProps {
  initialEmail: string;
  initialName: string;
  onRegister: (data: Omit<User, 'uid' | 'createdAt'>) => void;
  onBack: () => void;
}

export default function PatientRegistration({ initialEmail, initialName, onRegister, onBack }: PatientRegistrationProps) {
  const [fullName, setFullName] = useState(initialName || '');
  const [icPassport, setIcPassport] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(initialEmail || '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim()) return setError('Please enter your full name as per MyKad/Passport.');
    if (!icPassport.trim()) return setError('Please enter a valid IC or Passport Number.');
    if (!phone.trim()) return setError('Please enter your phone number.');
    if (!age || parseInt(age, 10) <= 0) return setError('Please enter a valid age.');
    if (!gender) return setError('Please select your gender.');

    onRegister({
      fullName: fullName.trim(),
      icPassport: icPassport.trim(),
      phone: phone.trim().startsWith('+60') ? phone.trim() : `+60${phone.trim().replace(/^0/, '')}`,
      email: email.trim(),
      age: parseInt(age, 10),
      gender: gender as 'male' | 'female' | 'other',
      isFirstTime: true,
    });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Step progress bar standard indicator */}
      <section className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Registration Phase</span>
          <span className="text-xs text-slate-400 font-bold">Step 1 of 3</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: '33%' }}></div>
        </div>
      </section>

      {/* Header and instruction */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Information</h1>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed font-semibold">
          Please provide your details exactly as shown in your identity document for Sabah clinical records.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        {error && (
          <div className="p-3 bg-red-50 text-xs text-red-600 font-semibold rounded-lg border border-red-100">
            ⚠ {error}
          </div>
        )}

        {/* Full Name Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-700" htmlFor="fullName">
            Full Name (As per IC)
          </label>
          <input
            id="fullName"
            type="text"
            className="h-12 w-full px-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 transition-all"
            placeholder="e.g. Ahmad bin Abdullah"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        {/* IC / Passport Number Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-700" htmlFor="icPassport">
            IC / Passport Number
          </label>
          <input
            id="icPassport"
            type="text"
            className="h-12 w-full px-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 transition-all"
            placeholder="e.g. 900101-12-3456"
            value={icPassport}
            onChange={(e) => setIcPassport(e.target.value)}
          />
        </div>

        {/* Phone Number Input & Age in two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700" htmlFor="phone">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold leading-none">+60</span>
              <input
                id="phone"
                type="tel"
                className="h-12 w-full pl-13 pr-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 transition-all"
                placeholder="12-3456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700" htmlFor="age">
              Age
            </label>
            <input
              id="age"
              type="number"
              className="h-12 w-full px-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 transition-all"
              placeholder="e.g. 32"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
        </div>

        {/* Gender Choice Segment */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold text-slate-700">Gender</span>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`h-12 rounded-xl border font-bold text-sm flex items-center justify-center transition-all cursor-pointer ${
                gender === 'male'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`h-12 rounded-xl border font-bold text-sm flex items-center justify-center transition-all cursor-pointer ${
                gender === 'female'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Female
            </button>
          </div>
        </div>

        {/* Email Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-slate-700" htmlFor="email">
              Email Address
            </label>
            <span className="text-xs text-slate-400 font-semibold">Optional</span>
          </div>
          <input
            id="email"
            type="email"
            className="h-12 w-full px-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 transition-all"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Continue Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full h-12 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
          >
            Continue
            <ArrowRight size={18} />
          </button>
        </div>
      </form>

      {/* Contextual Guidance Card using compliant UMS standards */}
      <section className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex gap-3.5 items-start">
        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg shrink-0">
          <UserCheck size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800">Your Privacy Matters</h4>
          <p className="text-slate-500 text-xs mt-0.5 leading-relaxed font-semibold">
            All clinical and private information provided is encrypted and saved strictly in accordance with the Malaysian Personal Data Protection Act (PDPA) safety legislation standards.
          </p>
        </div>
      </section>

      {/* Back to Home Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-400 font-bold hover:text-slate-600 underline cursor-pointer"
        >
          Cancel registration and return back
        </button>
      </div>
    </div>
  );
}
