import React, { useState } from 'react';
import { User, LogOut, ShieldCheck, Edit3, Save, X, Phone, IdCard, Calendar, Mail, Check, Sparkles } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileScreenProps {
  user: UserType;
  onLogout: () => void;
  onUpdateProfile: (updated: UserType) => Promise<void>;
}

export default function ProfileScreen({ user, onLogout, onUpdateProfile }: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [icPassport, setIcPassport] = useState(user.icPassport);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [age, setAge] = useState(user.age.toString());
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(user.gender);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) return setError('Full name is required.');
    if (!icPassport.trim()) return setError('MyKad / Passport ID is required.');
    if (!phone.trim()) return setError('Phone number is required.');
    if (!age || parseInt(age, 10) <= 0) return setError('Please enter a valid age.');

    setSaving(true);
    try {
      const updatedUser: UserType = {
        ...user,
        fullName: fullName.trim(),
        icPassport: icPassport.trim(),
        phone: phone.trim(),
        email: email.trim(),
        age: parseInt(age, 10),
        gender,
      };
      await onUpdateProfile(updatedUser);
      setSuccess(true);
      setIsEditing(false);
      // Let success state show for 3 seconds
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(user.fullName);
    setIcPassport(user.icPassport);
    setPhone(user.phone);
    setEmail(user.email);
    setAge(user.age.toString());
    setGender(user.gender);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Profile Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Health Profile</h2>
          <p className="text-sm text-slate-500 mt-1 font-semibold">
            Registered clinical record database of Hospital Universiti Malaysia Sabah.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition cursor-pointer"
          >
            <Edit3 size={14} />
            Edit Profile
          </button>
        )}
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 text-xs text-emerald-800 font-bold border border-emerald-200 rounded-xl flex items-center gap-2 animate-in fade-in duration-300">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>Patient clinical database successfully refreshed! Your updated records are active.</span>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            ✏️ Update Patient Identity
          </h3>

          {error && (
            <div className="p-3 bg-red-50 text-xs text-red-600 font-semibold rounded-xl border border-red-100">
              ⚠ {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Full Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name (As per MyKad)</label>
              <input
                type="text"
                className="h-11 w-full px-4 rounded-xl border border-slate-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* MyKad/Passport Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">MyKad / Passport ID</label>
              <input
                type="text"
                className="h-11 w-full px-4 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={icPassport}
                placeholder="e.g. 900101-12-3456"
                onChange={(e) => setIcPassport(e.target.value)}
              />
            </div>

            {/* Phone & Age columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  className="h-11 w-full px-4 rounded-xl border border-slate-200 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Age</label>
                <input
                  type="number"
                  className="h-11 w-full px-4 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>

            {/* Gender Toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</label>
              <div className="grid grid-cols-3 gap-3">
                {(['male', 'female', 'other'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`h-10 rounded-xl border text-xs font-bold capitalize flex items-center justify-center transition ${
                      gender === g
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                className="h-11 w-full px-4 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
              ) : (
                <Save size={14} />
              )}
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Profile summary card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-xl -mr-6 -mt-6"></div>
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold uppercase shadow-sm">
              {user.fullName ? user.fullName.charAt(0) : 'P'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 leading-tight">{user.fullName}</h3>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
                {user.uid === 'hums_demo_patient_101' ? 'Demo Evaluator Account' : 'Registered Patient ID'}
              </p>
            </div>
          </div>

          {/* Metadata Detail cards */}
          <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 font-sans">
            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-slate-400 font-bold animate-in fade-in duration-300">MyKad / Passport ID</span>
              <span className="text-slate-800 font-bold font-mono">{user.icPassport}</span>
            </div>
            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-slate-400 font-bold">Age</span>
              <span className="text-slate-800 font-bold">{user.age} Years Old</span>
            </div>
            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-slate-400 font-bold">Gender</span>
              <span className="text-slate-800 font-bold capitalize">{user.gender}</span>
            </div>
            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-slate-400 font-bold">Phone Number</span>
              <span className="text-slate-800 font-bold font-mono">{user.phone}</span>
            </div>
            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-slate-400 font-bold">Email Address</span>
              <span className="text-slate-800 font-bold">{user.email || 'None added'}</span>
            </div>
            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-slate-400 font-bold">Profile Created</span>
              <span className="text-slate-800 font-bold text-xs">
                {new Date(user.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
              </span>
            </div>
          </div>
        </>
      )}

      {/* PDPA Protection Certificate badge */}
      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-4">
        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-blue-900">Patient Data Protection Act Compliance</p>
          <p className="text-[11px] text-blue-800/80 leading-relaxed font-semibold">
            All database operations, including tokenized logins and Firestore snapshots, are fully secured under the Malaysia Personal Data Protection Act (PDPA) 2010 rules.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Logout action */}
        <button
          onClick={onLogout}
          className="w-full h-12 border border-red-200 hover:border-red-300 bg-red-50 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
        >
          <LogOut size={18} />
          Sign Out of Account
        </button>
      </div>
    </div>
  );
}
