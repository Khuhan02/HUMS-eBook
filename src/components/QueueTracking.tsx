import React, { useState, useEffect } from 'react';
import { Layers, Volume2, MapPin, Check, Sparkles, Navigation, Map, X, Bell, BellRing, Coffee, Pocket, RefreshCw } from 'lucide-react';

interface QueueTrackingProps {
  queueNumber: string;
  initialWaitMinutes?: number;
  patientsAhead: number;
  roomNumber: string;
  floorNumber: number;
  symptomName?: string;
  averageWaitTime?: number;
  onPredictionReady?: (estimatedWait: number, explanation: string) => void;
  onTurnArrived?: () => void;
  onTenMinutesRemaining?: () => void;
  onDone: () => void;
}

export default function QueueTracking({
  queueNumber,
  initialWaitMinutes,
  patientsAhead,
  roomNumber,
  floorNumber,
  symptomName,
  averageWaitTime,
  onPredictionReady,
  onTurnArrived,
  onTenMinutesRemaining,
  onDone,
}: QueueTrackingProps) {
  const [loading, setLoading] = useState(!initialWaitMinutes);
  const [predictedMinutes, setPredictedMinutes] = useState(initialWaitMinutes || 0);
  const [timeLeft, setTimeLeft] = useState((initialWaitMinutes || 0) * 60); // in seconds
  const [currentPatientsAhead, setCurrentPatientsAhead] = useState(patientsAhead);
  const [status, setStatus] = useState<'waiting' | 'ready' | 'completed'>(
    initialWaitMinutes === 0 ? 'ready' : 'waiting'
  );
  
  // Modal popups & state for "Notify me when 10 minutes remain" (Wait & Walk mode)
  const [showNotification, setShowNotification] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [notifyAt10Enabled, setNotifyAt10Enabled] = useState(true); // Active by default to assist patient
  const [show10MinNotification, setShow10MinNotification] = useState(false);
  const [hasNotified10Mins, setHasNotified10Mins] = useState(false);

  // Trigger wait prediction API if not available on mount
  useEffect(() => {
    if (initialWaitMinutes !== undefined && initialWaitMinutes !== null) {
      setPredictedMinutes(initialWaitMinutes);
      setTimeLeft(initialWaitMinutes * 60);
      setStatus(initialWaitMinutes === 0 ? 'ready' : 'waiting');
      setLoading(false);
      return;
    }

    const fetchTriagePrediction = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/gemini/predict-wait', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patientsAhead: patientsAhead || 3,
            symptomName: symptomName || "General Symptoms",
            averageWaitTime: averageWaitTime || 25,
          }),
        });

        if (!response.ok) {
          throw new Error("Prediction API failed");
        }

        const data = await response.json();
        const estMinutes = Math.max(1, data.estimatedWait || 15);
        setPredictedMinutes(estMinutes);
        setTimeLeft(estMinutes * 60);
        setStatus('waiting');
        
        if (onPredictionReady) {
          onPredictionReady(estMinutes, data.explanation || `${estMinutes} minutes predicted wait.`);
        }
      } catch (err) {
        console.warn("Error loading triage prediction on tracker mount:", err);
        // Fallback calculations
        const fallbackMinutes = Math.max(5, (patientsAhead * 6) + (averageWaitTime || 20));
        setPredictedMinutes(fallbackMinutes);
        setTimeLeft(fallbackMinutes * 60);
        setStatus('waiting');

        if (onPredictionReady) {
          onPredictionReady(fallbackMinutes, `${fallbackMinutes} minutes estimated wait.`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTriagePrediction();
  }, [initialWaitMinutes, patientsAhead, symptomName, averageWaitTime]);

  // Hook sound synthesizer for Malaysian Hospital Clinic Chime alert
  const playTurnArrivedChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      
      // Chime Note 1: High crisp pleasant D5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Chime Note 2: Majestic medical A5 chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.16); // A5
      gain2.gain.setValueAtTime(0.12, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.warn("Audio chime block or not permitted by browser autoplay policy yet:", e);
    }
  };

  // Sound synthesizer for 10-minute return warning alert
  const play10MinAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      // Rising triple reminder sound (chord sweep)
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.08, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.55);
      });
    } catch (e) {
      console.warn("Audio chime block by autoplay rules:", e);
    }
  };

  // Live timer countdown & 10 minutes remaining checker
  useEffect(() => {
    if (loading) return;

    // Check for 10 minutes (600 seconds) remaining warning
    if (notifyAt10Enabled && !hasNotified10Mins && timeLeft <= 600 && timeLeft > 0) {
      setHasNotified10Mins(true);
      setShow10MinNotification(true);
      play10MinAlertChime();
      if (onTenMinutesRemaining) {
        onTenMinutesRemaining();
      }
    }

    if (timeLeft <= 0) {
      if (status !== 'ready' && status !== 'completed') {
        setStatus('ready');
        setShowNotification(true);
        playTurnArrivedChime();
        if (onTurnArrived) {
          onTurnArrived();
        }
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('ready');
          setShowNotification(true);
          playTurnArrivedChime();
          if (onTurnArrived) {
            onTurnArrived();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, status, loading, notifyAt10Enabled, hasNotified10Mins, onTurnArrived, onTenMinutesRemaining]);

  // Live simulation of ahead queue patients decrements
  useEffect(() => {
    if (status !== 'waiting' || loading) return;
    const interval = setInterval(() => {
      setCurrentPatientsAhead(prev => {
        if (prev > 1) {
          return prev - 1;
        }
        return prev;
      });
    }, 20000); // patient moves in front

    return () => clearInterval(interval);
  }, [status, loading]);

  // Skip wait utility helper
  const accelerateTimer = () => {
    if (loading) return;
    setTimeLeft(5); // skips directly to 5 seconds
  };

  // Turn seconds to formatted countdown
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Highlight: Parse queue string to subtract patients ahead and determine actual current called number
  const getCurrentNumber = () => {
    if (status === 'ready' || status === 'completed') {
      return queueNumber;
    }
    const match = queueNumber.match(/^([A-Za-z]+(?:-)??)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const num = parseInt(match[2], 10);
      const currentNum = Math.max(1, num - currentPatientsAhead);
      return `${prefix}${currentNum}`;
    }
    return queueNumber;
  };

  const handleImOnMyWay = () => {
    setShowNotification(false);
    setStatus('completed');
  };

  const progressPercentage = predictedMinutes > 0
    ? Math.max(0, Math.min(100, (1 - (timeLeft / (predictedMinutes * 60))) * 100))
    : 0;

  // Render Loader if predicting wait on top load
  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center space-y-6 shadow-xs animate-pulse max-w-lg mx-auto">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-spin">
          <RefreshCw size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="font-sans font-bold text-lg text-slate-800">Calculating Wait Time</h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xs mx-auto">
            Our medical system is using Gemini AI to evaluate triage details, clinic room occupancy, and historical consultation durations...
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-block text-[10px] bg-slate-100 text-slate-500 rounded px-2.5 py-1 font-mono uppercase font-black">
            Classifying symptom for: {symptomName || "Virtual Registration"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 relative">
      
      {/* Alert Top-Bar Banner on matching status 'ready' or YOUR TURN */}
      {status === 'ready' && (
        <div className="bg-red-500 text-white p-4 rounded-2xl flex items-center justify-between border-2 border-red-400 animate-bounce shadow-lg">
          <div className="flex items-center gap-3">
            <Volume2 className="animate-pulse shrink-0" size={24} />
            <div>
              <p className="font-black text-sm tracking-wide">IT'S YOUR TURN NOW!</p>
              <p className="text-[11px] font-bold text-white/90">Proceed to Obstetrics & Consultation {roomNumber} immediately.</p>
            </div>
          </div>
          <span className="text-[10px] bg-white text-red-600 rounded-full px-2.5 py-1 font-black shadow-xs">
            {roomNumber.toUpperCase()}
          </span>
        </div>
      )}

      {/* Visual Welcome Segment */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Queue Tracking</h2>
        <p className="text-sm text-slate-500 mt-1 font-semibold">
          Real-time updates on your consultation position.
        </p>
      </div>

      {/* Primary Queue Display Card */}
      <div className={`bg-white border-2 rounded-3xl p-6 shadow-xs relative overflow-hidden transition-all duration-500 ${
        status === 'ready' ? 'border-red-500 ring-4 ring-red-100 bg-red-50/10' : 'border-slate-100'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/40 rounded-full blur-2xl -mr-6 -mt-6"></div>

        <div className="text-center relative">
          <span className="text-xs text-slate-400 font-bold tracking-widest uppercase block mb-1">Your Personal Queue ID</span>
          
          {status === 'ready' ? (
            <div className="py-2 animate-pulse">
              <span className="text-red-600 text-5xl font-black tracking-wider block">IT'S YOUR TURN</span>
              <span className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-widest block">Queue ID: {queueNumber}</span>
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-blue-600 tracking-wider font-sans leading-none">{queueNumber}</h1>
              
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-sans font-extrabold text-sm shadow-xs transition-all hover:scale-105 duration-250">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>Current number:</span>
                <span className="font-mono text-base text-emerald-700 tracking-wide">{getCurrentNumber()}</span>
              </div>
            </div>
          )}

          {/* Queue Status Badge */}
          <div className="flex justify-center gap-2 mt-4">
            <span className={`px-3 py-1 text-xs rounded-full font-bold flex items-center gap-1.5 ${
              status === 'waiting' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              status === 'ready' ? 'bg-red-500 text-white animate-pulse border border-red-400' :
              'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                status === 'waiting' ? 'bg-amber-500 animate-pulse' :
                status === 'ready' ? 'bg-white animate-ping' :
                'bg-emerald-500'
              }`}></span>
              {status === 'waiting' && 'Waiting in Line'}
              {status === 'ready' && "IT'S YOUR TURN"}
              {status === 'completed' && 'Completed/Discharged'}
            </span>
          </div>
        </div>

        {/* Countdown wait time and visual progress */}
        <div className="mt-8 bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col items-center">
          <span className="text-xs text-slate-400 font-bold block mb-1">Estimated Wait Countdown</span>
          
          <span className={`text-3xl font-mono font-bold tracking-widest ${
            status === 'ready' ? 'text-red-600 animate-pulse' : 'text-slate-800'
          }`}>
            {formatTime(timeLeft)}
          </span>

          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mt-4">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                status === 'ready' ? 'bg-red-500' : 'bg-blue-500'
              }`} 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <p className="text-xs text-slate-500 font-semibold mt-2.5 text-center">
            {status === 'waiting' ? (
              <span className="text-slate-600">
                Approximately <b>{currentPatientsAhead}</b> patient{currentPatientsAhead > 1 ? 's' : ''} remaining before your turn.
              </span>
            ) : status === 'ready' ? (
              <span className="text-red-700 font-extrabold text-xs block">
                🔔 Please proceed immediately to Obstetrics & Consultation Room {roomNumber} — Floor {floorNumber}!
              </span>
            ) : (
              <span className="text-slate-800 font-bold">Please stand by. Proceeding immediately to Room!</span>
            )}
          </p>
        </div>
      </div>

      {/* Wait and Walk Mode Options */}
      <div className="bg-white border-2 border-dashed border-blue-500/40 hover:border-blue-500 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Coffee size={20} className="animate-bounce" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Wait & Walk Freedom Mode</h4>
            <p className="text-slate-500 text-xs mt-0.5 leading-relaxed font-semibold">
              Want to visit the café, go outside, or walk around instead of sitting doing nothing? Toggle this to receive an alert when exactly 10 minutes remain!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
          <button
            onClick={() => setNotifyAt10Enabled(!notifyAt10Enabled)}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              notifyAt10Enabled 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            {notifyAt10Enabled ? (
              <>
                <Check size={14} />
                Notify on 10 Mins (Active)
              </>
            ) : (
              'Enable 10 Min Alert'
            )}
          </button>
        </div>
      </div>

      {/* Consultation Location Widget */}
      <div className={`border shadow-xs p-5 rounded-2xl flex items-center gap-4 transition-all ${
        status === 'ready' ? 'bg-red-50/50 border-red-200 animate-pulse' : 'bg-white border-slate-100'
      }`}>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
          status === 'ready' ? 'bg-red-500 text-white' : 'bg-blue-50 text-blue-600'
        }`}>
          <Layers size={22} />
        </div>
        <div className="flex-grow">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Clinic Destination</span>
          <h3 className="font-bold text-slate-800 text-sm">Obstetrics & Consultation {roomNumber} — Floor {floorNumber}</h3>
          <p className="text-slate-500 text-xs font-semibold">Primary Wing • Sabah General Hospital Complex</p>
        </div>
      </div>

      {/* Accelerator testing support block */}
      <div className="bg-amber-50 border border-dashed border-amber-300 rounded-2xl p-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 text-amber-800">
          <Sparkles size={16} className="text-amber-500 animate-spin" />
          <span className="text-xs font-bold font-sans">AI Studio Evaluation Accelerator</span>
        </div>
        <p className="text-[11px] text-amber-700/80 text-center font-medium leading-normal max-w-sm">
          Instead of waiting {predictedMinutes} minutes to see the alerts, click below to fast-forward the countdown to 12 minutes (so you approach the 10-minutes alert, then finish)!
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              if (loading) return;
              setTimeLeft(605); // Skip to 10 minutes and 5 seconds so they experience transition
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            Go to 10 Mins Remaining
          </button>
          <button
            onClick={accelerateTimer}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer animate-pulse"
          >
            Fast-Forward to Turn
          </button>
        </div>
      </div>

      {/* Clinical Map and Dismiss Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setShowMapModal(true)}
          className="h-12 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
        >
          <Map size={18} />
          View Clinic Map
        </button>

        <button
          onClick={onDone}
          className="h-12 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-[0.99]"
        >
          Complete Visit
        </button>
      </div>

      {/* POPUP MODAL DIALOG: 10 minutes remaining returning warn */}
      {show10MinNotification && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShow10MinNotification(false)}></div>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative z-10 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Coffee size={32} className="text-blue-600 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-800">PLEASE RETURN TO CLINIC</h3>
              <p className="text-xs text-slate-500 font-bold">Estimated consultation in 10 minutes</p>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-1.5">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Designated Consultation room</span>
              <p className="text-lg font-extrabold text-slate-800">Obstetrics & Consultation {roomNumber} — Floor {floorNumber}</p>
              <p className="text-[11px] text-slate-500 font-semibold">Primary Wing • Sabah General Hospital Complex</p>
            </div>

            <div className="p-3 bg-amber-50 text-amber-800 text-xs font-semibold rounded-xl text-center">
              Please head back to wait near the clinic suite now so you don't miss your upcoming turn!
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setShow10MinNotification(false)}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                I'm Returning Now
              </button>
              <button
                onClick={() => {
                  setShow10MinNotification(false);
                  setShowMapModal(true);
                }}
                className="w-full text-xs text-blue-600 font-bold underline cursor-pointer hover:text-blue-800"
              >
                Open location directional map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL DIALOG: Waiting Zero Notification */}
      {showNotification && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowNotification(false)}></div>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative z-10 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Volume2 size={32} />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-red-600 animate-pulse">IT'S YOUR TURN NOW!</h3>
              <p className="text-xs text-slate-500 font-bold">Please proceed to your assigned destination promptly</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider block">Assigned consultation destination</span>
              <p className="text-lg font-extrabold text-slate-800">Obstetrics & Consultation {roomNumber} — Floor {floorNumber}</p>
              <p className="text-[11px] text-slate-500 font-semibold">Primary Wing • Sabah General Hospital Complex</p>
            </div>

            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl text-center">
              Our clinical nurse practitioner is waiting to receive you for {symptomName || "your medical check-up"}.
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleImOnMyWay}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                I'm On My Way
              </button>
              <button
                onClick={() => {
                  setShowNotification(false);
                  setShowMapModal(true);
                }}
                className="w-full text-xs text-blue-600 font-bold underline cursor-pointer hover:text-blue-800"
              >
                Open location directional map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLINIC MAP ISOMETRIC VIEW MODAL */}
      {showMapModal && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowMapModal(false)}></div>
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-800">
                <MapPin className="text-red-500" size={18} />
                <span className="text-sm font-bold font-sans">HUMS PolyClinic Level {floorNumber} Floor Plan</span>
              </div>
              <button 
                onClick={() => setShowMapModal(false)}
                className="p-1.5 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Isometric floor visualization */}
            <div className="p-6 space-y-4">
              <div className="relative aspect-[16/10] bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shadow-inner flex items-center justify-center">
                <img 
                  alt="Isometric Floor Plan Layout" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQ_IWDETJLMq4cqvdkl2ov5DvoGqDlqj5_fChzHQ2-01-WtXHT0Rd6_hdYclixn7JhKqgf4s-kYZf2mhPaKdTHeGy8jkyMjBs_4L5oeWbzA57NAU4U5fpmYnX0T05yKcVOeAjiGrjc694rVaiY85oezazTye9ZvctfDxwkryy0tcrNcDr1gV_yM0E7Ow0gs_FM9fape2rH7o5SGQDO9Zwg03I2GoytRu7ePQqIib15vPOmYuyRATL_KBU1dtNtswvQEcWDNu80Aoot"
                />
                
                {/* Highlight active room */}
                <div className="absolute top-1/4 left-1/3 bg-blue-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-xl border-2 border-white shadow-lg animate-bounce">
                  🚩 Destination: Room {roomNumber}
                </div>

                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-slate-100 text-[10px] px-2 py-1 rounded font-mono">
                  You are here: Level {floorNumber} Lobby Elevator
                </div>
              </div>

              <div className="space-y-1 p-2">
                <h4 className="text-xs font-bold text-slate-800">Clear navigation directions</h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-normal font-sans">
                  Exit the elevator lobby. Walk past the General Practitioner waiting area. {roomNumber} is straight ahead in the Healthcare Wing.
                </p>
              </div>

              <button
                onClick={() => setShowMapModal(false)}
                className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-all"
              >
                Dismiss Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
