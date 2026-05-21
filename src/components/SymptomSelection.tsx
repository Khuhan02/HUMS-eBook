import React, { useState } from 'react';
import { Thermometer, BrainCircuit, Activity, Heart, Eye, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Symptom, Appointment } from '../types';

interface SymptomSelectionProps {
  onSymptomSelect: (symptom: Symptom, customSymptomText?: string) => void;
  onBack: () => void;
}

const COMMON_SYMPTOMS: Symptom[] = [
  { symptomId: "fever", name: "Fever", icon: "🌡️", category: "General Medicine", averageWaitTime: 25, description: "High body temperature & feverish shivering" },
  { symptomId: "headache", name: "Headache", icon: "🤕", category: "Neurology", averageWaitTime: 15, description: "Pain or pressure across the head and temples" },
  { symptomId: "cough", name: "Cough", icon: "😷", category: "Respiratory", averageWaitTime: 30, description: "Persistent dry cough or wet chesty irritation" },
  { symptomId: "flu", name: "Flu", icon: "🤧", category: "Respiratory", averageWaitTime: 20, description: "Runny nose, nasal congestion & mild weakness" },
  { symptomId: "stomach_pain", name: "Stomach Pain", icon: "🫃", category: "Gastroenterology", averageWaitTime: 35, description: "Severe abdominal cramps, burning or nausea" },
  { symptomId: "back_pain", name: "Back Pain", icon: "🦴", category: "Orthopedics", averageWaitTime: 40, description: "Lower or upper spine stiffness & joint soreness" },
  { symptomId: "allergy", name: "Skin Allergy", icon: "🌿", category: "Dermatology", averageWaitTime: 25, description: "Itchy skin, hives, rashes or red patches" },
  { symptomId: "chest_pain", name: "Chest Pain", icon: "❤️", category: "Cardiology", averageWaitTime: 10, description: "Chest tightness, discomfort or heavy breathing" },
  { symptomId: "migraine", name: "Migraine", icon: "🧠", category: "Neurology", averageWaitTime: 30, description: "Throbbing unilateral headache, light sensitivity" },
  { symptomId: "joint_pain", name: "Joint Pain", icon: "🦵", category: "Orthopedics", averageWaitTime: 30, description: "Knee, wrist, or ankle inflammation and stiffness" },
  { symptomId: "other", name: "Other Symptom", icon: "✨", category: "Outpatient Services", averageWaitTime: 25, description: "Describe a different medical complaint or localized condition" },
];

export default function SymptomSelection({ onSymptomSelect, onBack }: SymptomSelectionProps) {
  const [selectedSymptom, setSelectedSymptom] = useState<Symptom | null>(null);
  const [customSymptomText, setCustomSymptomText] = useState('');

  const handleSymptomClick = (symptom: Symptom) => {
    setSelectedSymptom(symptom);
  };

  const handleContinue = () => {
    if (selectedSymptom) {
      if (selectedSymptom.symptomId === 'other' && !customSymptomText.trim()) {
        return; // require description for other symptoms
      }
      onSymptomSelect(selectedSymptom, customSymptomText);
    }
  };

  const isContinueDisabled = !selectedSymptom || (selectedSymptom.symptomId === 'other' && !customSymptomText.trim());

  return (
    <div className="space-y-6 pb-32">
      {/* Progress header */}
      <section className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Registration Phase</span>
          <span className="text-xs text-slate-400 font-bold">Step 2 of 3</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: '66%' }}></div>
        </div>
      </section>

      {/* Headings */}
      <div>
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Select your symptoms</h2>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed font-semibold">
          Please choose the symptoms that best describe your current localized condition.
        </p>
      </div>

      {/* Grid listing */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {COMMON_SYMPTOMS.map((symptom) => {
          const isSelected = selectedSymptom?.symptomId === symptom.symptomId;
          return (
            <button
              key={symptom.symptomId}
              id={`symptom-btn-${symptom.symptomId}`}
              onClick={() => handleSymptomClick(symptom)}
              className={`group flex items-start p-4 bg-white border rounded-2xl text-left transition-all active:scale-[0.98] outline-none cursor-pointer hover:bg-slate-50 ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/10'
                  : 'border-slate-200'
              }`}
            >
              <span className="text-3xl filter drop-shadow-sm mr-4 shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                {symptom.icon}
              </span>
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-base">{symptom.name}</h3>
                <p className="text-slate-500 text-xs font-semibold leading-tight">{symptom.description}</p>
                <span className="inline-block text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold uppercase mt-1">
                  {symptom.category}
                </span>
              </div>
            </button>
          );
        })}
      </section>

      {/* Interactive Other Symptom input area */}
      {selectedSymptom?.symptomId === 'other' && (
        <div className="bg-white border-2 border-blue-500 p-6 rounded-2xl shadow-md space-y-4 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
            <BrainCircuit className="text-blue-600" size={20} />
            <h4 className="font-bold text-slate-800 text-sm">Describe Your Condition</h4>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500" htmlFor="customSymptomInput">
              Provide clinical description for HUMS triage classification:
            </label>
            <textarea
              id="customSymptomInput"
              className="w-full p-4 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all resize-none h-24"
              placeholder="e.g. Sharp localized outer ear ache, toothache with gums swelling, continuous physical exhaustion..."
              value={customSymptomText}
              onChange={(e) => setCustomSymptomText(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Continue Option block */}
      {selectedSymptom && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Selected Complaint</span>
              <span className="text-sm font-bold text-slate-800">
                {selectedSymptom.symptomId === 'other' && customSymptomText.trim()
                  ? `Other Symptom: "${customSymptomText.trim()}"`
                  : selectedSymptom.name}
              </span>
            </div>
          </div>
          <button
            id="continue-symptom-booking-btn"
            onClick={handleContinue}
            disabled={isContinueDisabled}
            className="w-full h-12 bg-blue-600 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer shadow"
          >
            Continue to Live Wait Estimation
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Emergency warning note */}
      <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-start gap-4">
        <Activity size={24} className="shrink-0 text-red-600" />
        <div className="space-y-0.5">
          <h5 className="font-bold text-sm">Life-Threatening Emergency Notice</h5>
          <p className="text-xs leading-normal font-semibold text-red-600/90">
            If you are experiencing severe breathing difficulties, chest tightness, or major bleeding, please go directly to the Emergency Room or dial 999.
          </p>
        </div>
      </div>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-400 font-bold hover:text-slate-600 underline cursor-pointer"
        >
          Back to selection dashboard
        </button>
      </div>
    </div>
  );
}
