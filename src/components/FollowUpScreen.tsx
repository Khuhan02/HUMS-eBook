import React, { useState } from 'react';
import { Calendar, User, Clock, CheckCircle, Navigation, Stethoscope, AlertCircle } from 'lucide-react';

interface FollowUpScreenProps {
  onConfirmAttendance: (queueNumber: string, estimatedWait: number, roomNumber: string, floorNumber: number) => void;
  onBack: () => void;
}

export default function FollowUpScreen({ onConfirmAttendance, onBack }: FollowUpScreenProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = () => {
    setSubmitting(true);
    // Simulate Malaysian Queue entry allocation
    setTimeout(() => {
      setSuccess(true);
      setSubmitting(false);
      // Allocate Queue format F-108, wait 18 mins, Room 5, Floor 2
      setTimeout(() => {
        onConfirmAttendance("A-142", 35, "Room 5", 2);
      }, 1000);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Appointment Details</h2>
        <p className="text-sm text-slate-500 mt-1 font-semibold">
          Review your upcoming follow-up session information.
        </p>
      </div>

      {/* Structured Card Grid in 1 column */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={22} />
            </div>
            <div>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Scheduled Date</span>
              <p className="text-lg font-bold text-slate-800 leading-tight">October 24, 2026</p>
              <p className="text-xs text-slate-500 font-bold mt-0.5">Thursday • 10:30 AM (MYT)</p>
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold">
            Confirmed
          </span>
        </div>

        <hr className="border-slate-100" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Healthcare Professional Detail */}
          <div className="space-y-1.5 animate-in fade-in duration-300">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Healthcare Professional</span>
            <div className="flex items-center gap-3">
              <img 
                alt="Doctor Profile" 
                className="w-12 h-12 rounded-lg object-cover border border-slate-100 shadow-xs"
                referrerPolicy="no-referrer"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcrsJUfGybjds4UPVrJ0K7R_XHtidOE8y7YslVX4J42hF9bBb_9RqzsLHAdARRhJ49RmVPSmGVn0UMwz_yfzUWT_Q2wKr-EBis3dhwtlr7cQf3cISFR7cCv44eVOOJvAmqS1Wvb40L8KcDu-pK1cZmB-rIomnEVQIr9QjWNNlMc2iZpjjbRptwsJPxzax-iTu_Q7lr7WkUoatuk0YgZs8r-8nWudskFsNUzGUR-sTRi6v9J5jFZbu0ttPEbE1XKpQaEZgeRomlv2Ny"
              />
              <div>
                <p className="text-sm font-bold text-slate-800">Dr. Ahmad Faisal</p>
                <p className="text-xs text-slate-500 font-semibold">General Practitioner</p>
              </div>
            </div>
          </div>

          {/* Department Detail */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Clinical Department</span>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Stethoscope size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">General Practice</p>
                <p className="text-xs text-slate-500 font-semibold">Level 2, Block B</p>
              </div>
            </div>
          </div>
        </div>

        {/* Previous Diagnosis Notes */}
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-700">Previous Clinical Diagnosis</span>
          </div>
          <p className="text-xs text-slate-500 italic font-semibold leading-relaxed">
            "Mild respiratory infection noted on previous visit. Prescribed supportive care. Follow-up required to ensure full resolution of symptoms and check lung function integrity."
          </p>
        </div>
      </div>

      {/* Preparation advice banner */}
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3">
        <AlertCircle className="text-emerald-700 shrink-0 mt-0.5" size={18} />
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-emerald-900">Patient Preparation Guide</p>
          <p className="text-xs text-emerald-800 leading-normal font-semibold">
            Please arrive 15 minutes early and bring your identity card (IC/MyKad/Passport) for counter registration. Fasting is not required.
          </p>
        </div>
      </div>

      {/* Confirm Attendance Action container */}
      <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Confirm Attendance</h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-relaxed">
            Will you attend your scheduled follow-up appointment on Oct 24, 2026 at 10:30 AM?
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            disabled={submitting || success}
            className={`w-full h-12 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              success
                ? 'bg-emerald-600'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'
            }`}
          >
            {submitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
            ) : success ? (
              <>
                <CheckCircle size={18} /> Registered in Virtual Queue!
              </>
            ) : (
              <>
                Confirm Attendance
              </>
            )}
          </button>

          <button
            onClick={onBack}
            className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-[0.99]"
          >
            Cancel & Return
          </button>
        </div>
      </div>

      {/* Hospital isometric map preview */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Navigation size={15} className="text-red-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700">HUMS Medical Centre, Kota Kinabalu</span>
        </div>
        <img 
          alt="Clinic location map" 
          className="w-full h-32 object-cover" 
          referrerPolicy="no-referrer"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQ_IWDETJLMq4cqvdkl2ov5DvoGqDlqj5_fChzHQ2-01-WtXHT0Rd6_hdYclixn7JhKqgf4s-kYZf2mhPaKdTHeGy8jkyMjBs_4L5oeWbzA57NAU4U5fpmYnX0T05yKcVOeAjiGrjc694rVaiY85oezazTye9ZvctfDxwkryy0tcrNcDr1gV_yM0E7Ow0gs_FM9fape2rH7o5SGQDO9Zwg03I2GoytRu7ePQqIib15vPOmYuyRATL_KBU1dtNtswvQEcWDNu80Aoot"
        />
      </div>
    </div>
  );
}
