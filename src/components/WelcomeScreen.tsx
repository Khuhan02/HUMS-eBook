import React from 'react';
import { ChevronRight, FilePlus, CalendarCheck, HelpCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectAction: (actionType: 'firstTime' | 'followUp') => void;
  userName: string;
}

export default function WelcomeScreen({ onSelectAction, userName }: WelcomeScreenProps) {
  return (
    <div className="space-y-6 pb-24">
      {/* Dynamic greet header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-slate-400 text-xs tracking-wider uppercase font-semibold">Logged in Patient</span>
          <h2 className="text-lg font-bold text-slate-800">Hello, {userName || "Patient"}</h2>
        </div>
        <div className="bg-blue-50 text-blue-600 text-xs px-3 py-1.5 rounded-full font-bold">
          Sabah, MY
        </div>
      </div>

      {/* Hero card illustration & branding */}
      <section className="text-center bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-5 border border-slate-100">
          <img 
            alt="Healthcare Professional" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgwRX9vRvT4POeir83iwQ0MWjfYS8-7QNUhxk0MRvA5ibMi6dQke6M_87jQINgr0RhaRnHCzHAeS9pb-erDXNTWu9cOJR3eT5TWdhagFrrdaChctPl1MynXp48UYhiCwOR69kCknWvYjWwR9MLidOi1oQc3VGQ8LPdEn_O78ghp9ZLlAqad3zu14JujOIvdbh24hqLYsItXzA-3n_Ta5r-g5DUq0KuRoPg-BJS0W_PkqQUBNXlx7cJQsdsurkCF-HFSUMelCV1tKU-"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent"></div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-7 md:text-3xl">
          Welcome to HUMS eBook
        </h2>
        <p className="text-slate-500 font-medium text-sm md:text-base mt-2 max-w-sm mx-auto">
          Book your clinic visit and reduce waiting time.
        </p>
      </section>

      {/* IC Reminder Banner */}
      <div id="ic-reminder-banner" className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-4 shadow-xs animate-in fade-in duration-350">
        <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600 shrink-0">
          <AlertTriangle size={20} className="stroke-[2.5]" />
        </div>
        <div className="space-y-1">
          <h4 className="font-extrabold text-amber-900 text-sm">Reminder : Prepare Your Identity Card</h4>
          <p className="text-amber-800 text-xs leading-relaxed font-semibold">
            Make sure you have your IC(Identity Card) before booking your appointment.
          </p>
        </div>
      </div>

      {/* Booking Choice Cards - 44px minimum touch target size & rounded shapes */}
      <div className="grid grid-cols-1 gap-4">
        {/* Register Visit booking card */}
        <button
          onClick={() => onSelectAction('firstTime')}
          className="group flex items-center p-5 bg-white border-2 border-blue-500 hover:border-blue-600 rounded-2xl shadow-sm text-left transition-all hover:bg-slate-50 active:scale-[0.99] outline-none min-h-[100px] cursor-pointer"
        >
          <div className="bg-blue-50 text-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mr-4 shrink-0 transition-transform group-hover:scale-105">
            <FilePlus size={28} />
          </div>
          <div className="flex-grow">
            <h3 className="font-bold text-slate-800 text-lg">Register Clinic Visit</h3>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Get your virtual queue number & smart wait prediction instantly</p>
          </div>
          <ChevronRight size={20} className="text-blue-600 shrink-0 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Clinical Support guidance advice */}
      <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl flex items-start gap-4">
        <div className="bg-teal-600/10 p-2 rounded-lg text-teal-700 shrink-0">
          <HelpCircle size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-teal-900 text-sm">Need assistance?</h4>
          <p className="text-teal-700/80 text-xs leading-relaxed font-semibold">
            If you are experiencing a medical emergency, please call <span className="underline font-bold text-red-600">999</span> or visit the nearest Emergency Department immediately.
          </p>
          <a
            href="https://hums.ums.edu.my/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline pt-1.5"
          >
            View UMS Clinical FAQ
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
