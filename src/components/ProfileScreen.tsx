import React from 'react';
import { User, LogOut, Shield, ShieldCheck, HelpCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileScreenProps {
  user: UserType;
  onLogout: () => void;
}

export default function ProfileScreen({ user, onLogout }: ProfileScreenProps) {
  return (
    <div className="space-y-6 pb-24">
      {/* Profile Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Health Profile</h2>
        <p className="text-sm text-slate-500 mt-1 font-semibold">
          Registered clinical record database of Hospital Universiti Malaysia Sabah.
        </p>
      </div>

      {/* Profile summary card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-xl -mr-6 -mt-6"></div>
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold uppercase shadow-sm">
          {user.fullName.charAt(0)}
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 leading-tight">{user.fullName}</h3>
          <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{user.uid === 'hums_demo_patient_101' ? "Demo Evaluator Account" : "Registered Patient ID"}</p>
        </div>
      </div>

      {/* Metadata Detail cards */}
      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 font-sans">
        <div className="p-4 flex justify-between items-center text-sm">
          <span className="text-slate-400 font-bold">MyKad / Passport ID</span>
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
          <span className="text-slate-800 font-bold">{user.email || "None added"}</span>
        </div>
        <div className="p-4 flex justify-between items-center text-sm">
          <span className="text-slate-400 font-bold">Profile Created</span>
          <span className="text-slate-800 font-bold text-xs">{new Date(user.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}</span>
        </div>
      </div>

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
