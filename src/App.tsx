import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { User, Appointment, Symptom, Queue, FollowUp, Notification } from './types';
import { dbService, isSupabaseConfigured } from './supabase';

// Components
import LoginScreen from './components/LoginScreen';
import WelcomeScreen from './components/WelcomeScreen';
import PatientRegistration from './components/PatientRegistration';
import SymptomSelection from './components/SymptomSelection';
import FollowUpScreen from './components/FollowUpScreen';
import QueueTracking from './components/QueueTracking';
import NotificationsScreen from './components/NotificationsScreen';
import ProfileScreen from './components/ProfileScreen';

// Icons
import { HeartHandshake, Home, Layers, Bell, User as UserIcon, Search } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; displayName?: string } | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Layout navigation state
  const [currentView, setCurrentView] = useState<'welcome' | 'firstTimeRegister' | 'symptoms' | 'followUp' | 'queue' | 'notifications' | 'profile'>('welcome');
  const [activeTab, setActiveTab] = useState<'home' | 'queue' | 'notifications' | 'profile'>('home');

  // Active virtual queue details State
  const [activeQueue, setActiveQueue] = useState<{
    queueNumber: string;
    estimatedWait?: number;
    roomNumber: string;
    floorNumber: number;
    explanation?: string;
    symptomName?: string;
    symptomCategory?: string;
    patientsAhead?: number;
    averageWaitTime?: number;
  } | null>(null);

  // List of notification alerts
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Listen for real Firebase auth states
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || undefined,
        });
        await fetchOrCreateUserProfile(user.uid, user.email || '', user.displayName || '');
      } else {
        // Only wipe user if we aren't in developer sandbox bypass mode
        setCurrentUser(prev => {
          if (prev && prev.uid === 'hums_demo_patient_101') {
            return prev; // keep bypass user active
          }
          return null;
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch or setup User record in Supabase database
  const fetchOrCreateUserProfile = async (uid: string, email: string, displayName: string) => {
    try {
      const data = await dbService.getUserProfile(uid);
      if (data) {
        setDbUser(data);
        if (data.fullName) {
          setCurrentView('welcome');
        } else {
          setCurrentView('firstTimeRegister');
        }
      } else {
        // User profile does not exist yet under this UID, let them register
        setCurrentView('firstTimeRegister');
      }
    } catch (err: any) {
      console.warn("Database user lookup failed - standard rules configuration:", err);
      // Construct logical bypass context
      setCurrentView('firstTimeRegister');
    }
  };

  // Pre-seed or load database tracked notifications for a professional experience
  useEffect(() => {
    if (!currentUser) return;

    const loadUserNotifications = async () => {
      try {
        const savedNotifs = await dbService.getNotifications(currentUser.uid);
        if (savedNotifs && savedNotifs.length > 0) {
          setNotifications(savedNotifs);
        } else {
          // Seed realistic notifications in memory
          const dummyNotifs: Notification[] = [
            {
              notificationId: "seed-notif-1",
              userId: currentUser.uid,
              title: "🏥 HUMS Virtual Queue Portal Activated",
              message: "Welcome to Poliklinik Hospital Universiti Malaysia Sabah. Stay safe and avoid long waiting queues by booking and monitoring your estimates digitally.",
              type: "appointment",
              isRead: false,
              sentAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              notificationId: "seed-notif-2",
              userId: currentUser.uid,
              title: "😷 Clinical Sanitization Advisory",
              message: "If you are experiencing strong symptoms of fever or chest cough, please make sure to approach our sanitizer portals at the main clinic lobby.",
              type: "queue",
              isRead: true,
              sentAt: new Date(Date.now() - 7200000).toISOString(),
            }
          ];
          setNotifications(dummyNotifs);
          // Try to back-save them to database
          for (const notif of dummyNotifs) {
            await dbService.saveNotification(notif).catch(() => {});
          }
        }
      } catch (err) {
        console.warn("Error loading user notifications from db:", err);
      }
    };

    loadUserNotifications();
  }, [currentUser]);

  // Auth Fast developer bypass handle
  const handleBypassLogin = async (demoUser: { uid: string; email: string; displayName: string }) => {
    setLoading(true);
    setCurrentUser(demoUser);
    
    try {
      const userProfile = await dbService.getUserProfile(demoUser.uid);
      if (userProfile) {
        setDbUser(userProfile);
        setCurrentView('welcome');
      } else {
        // Only auto-seed a mock profile if it's the standard quick demo button
        if (demoUser.uid === 'hums_demo_patient_101') {
          const initialProfile: User = {
            uid: demoUser.uid,
            fullName: demoUser.displayName,
            icPassport: "900101-12-3456",
            phone: "+60123456789",
            email: demoUser.email,
            age: 32,
            gender: 'male',
            isFirstTime: true,
            createdAt: new Date().toISOString()
          };
          await dbService.saveUserProfile(initialProfile);
          setDbUser(initialProfile);
          setCurrentView('welcome');
        } else {
          // Send dynamic custom users to fill out their actual registration details
          setDbUser(null);
          setCurrentView('firstTimeRegister');
        }
      }
    } catch (err: any) {
      if (demoUser.uid === 'hums_demo_patient_101') {
        // Fall back to memory for the quick demo
        const demoProfile: User = {
          uid: demoUser.uid,
          fullName: demoUser.displayName,
          icPassport: "900101-12-3456",
          phone: "+60123456789",
          email: demoUser.email,
          age: 32,
          gender: 'male',
          isFirstTime: true,
          createdAt: new Date().toISOString()
        };
        setDbUser(demoProfile);
        setCurrentView('welcome');
      } else {
        setDbUser(null);
        setCurrentView('firstTimeRegister');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign out handle
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out err:", e);
    }
    setCurrentUser(null);
    setDbUser(null);
    setActiveQueue(null);
    setCurrentView('welcome');
    setActiveTab('home');
  };

  // Update Patient Profile database record
  const handleUpdateProfile = async (updatedUser: User) => {
    try {
      await dbService.saveUserProfile(updatedUser);
      setDbUser(updatedUser);
    } catch (err: any) {
      console.error("Failed to update profile record:", err);
      throw new Error(err?.message || "Could not register update with server.");
    }
  };

  // Submit Patient Registration Form (Step 1)
  const handleProfileRegistration = async (formData: Omit<User, 'uid' | 'createdAt'>) => {
    if (!currentUser) return;
    const profileId = currentUser.uid;
    const completeUser: User = {
      ...formData,
      uid: profileId,
      createdAt: new Date().toISOString()
    };

    try {
      await dbService.saveUserProfile(completeUser);
    } catch (err: any) {
      console.warn("Saving profile to Database failed, holding in client state:", err);
    }

    setDbUser(completeUser);
    // Proceed to Symptom selection (Step 2)
    setCurrentView('symptoms');
  };

  // Triggered on clinical symptom selection (First-Time booking complete)
  const handleSymptomBookingComplete = async (
    symptom: Symptom,
    customSymptomText?: string
  ) => {
    if (!currentUser || !dbUser) return;

    // Simulate standard patients ahead (3 to 7) for real-time Malaysian hospital volume
    const patientsAhead = Math.floor(Math.random() * 5) + 3; 
    
    // Generate simulated Malaysia Clinic Queue format, e.g., A-142
    const queueChar = symptom.category === 'Respiratory' ? 'R' : symptom.category === 'Neurology' ? 'N' : 'A';
    const queueNo = `${queueChar}-${Math.floor(Math.random() * 90) + 110}`;

    const roomNumber = symptom.category === 'Cardiology' ? "Room 10" : "Room 5";
    const floorNumber = symptom.category === 'Cardiology' ? 3 : 2;

    const finalSymptomName = symptom.symptomId === 'other' && customSymptomText?.trim()
      ? `Other: ${customSymptomText.trim()}`
      : symptom.name;

    // Set virtual queue details with undefined wait so it is handled dynamically on the tracker page mount
    setActiveQueue({
      queueNumber: queueNo,
      estimatedWait: undefined, // means wait estimation will load on the tracking page
      roomNumber,
      floorNumber,
      symptomName: finalSymptomName,
      symptomCategory: symptom.category,
      patientsAhead,
      averageWaitTime: symptom.averageWaitTime,
    });

    // View tracking
    setCurrentView('queue');
    setActiveTab('queue');
  };

  // Called when the wait time prediction finishes loading on the next page
  const handleRegisterLivePredictionReady = async (
    estimatedWait: number,
    explanation: string
  ) => {
    if (!currentUser || !dbUser || !activeQueue) return;

    const appointmentId = `apt-${Date.now()}`;
    const newAppointment: Appointment = {
      appointmentId: appointmentId,
      userId: currentUser.uid,
      appointmentType: 'firstTime',
      department: activeQueue.symptomCategory || 'Outpatient Services',
      symptomId: 'custom',
      doctorName: "Duty Officer (Poliklinik)",
      appointmentDate: new Date().toISOString().split('T')[0],
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const newQueueEntry: Queue = {
      queueId: `que-${Date.now()}`,
      appointmentId: appointmentId,
      queueNumber: activeQueue.queueNumber,
      estimatedWait: estimatedWait,
      patientsAhead: activeQueue.patientsAhead || 3,
      roomNumber: activeQueue.roomNumber,
      floorNumber: activeQueue.floorNumber,
      queueStatus: 'waiting',
      updatedAt: new Date().toISOString(),
    };

    try {
      // Execute database writes
      await dbService.saveAppointment(newAppointment);
      await dbService.saveQueue(newQueueEntry);
    } catch (err: any) {
      console.warn("Failed to write live booking to database, tracking using client state:", err);
    }

    // Merge prediction details into state
    setActiveQueue(prev => prev ? {
      ...prev,
      estimatedWait,
      explanation,
    } : null);

    // Trigger initial clinical booking notification
    const bookingAlert: Notification = {
      notificationId: `notif-${Date.now()}`,
      userId: currentUser.uid,
      title: "✅ Wait Estimation Complete",
      message: `Your appointment for ${activeQueue.symptomName} has been processed. Assigned Room: ${activeQueue.roomNumber} (Floor ${activeQueue.floorNumber}). Estimated Wait: ~${estimatedWait} minutes.`,
      type: "appointment",
      isRead: false,
      sentAt: new Date().toISOString(),
    };

    setNotifications(prev => [bookingAlert, ...prev]);
    await dbService.saveNotification(bookingAlert).catch(() => {});
  };

  // Called when countdown reaches 10 minutes to issue an in-app system notification
  const handleTenMinutesRemaining = () => {
    if (!currentUser || !activeQueue) return;

    const tenMinAlert: Notification = {
      notificationId: `notif-10min-${Date.now()}`,
      userId: currentUser.uid,
      title: "⏳ Return to Clinic: 10 Mins Remaining",
      message: `Please return to clinic. Estimated consultation in 10 minutes. Go to Obstetrics & Consultation ${activeQueue.roomNumber} — Floor ${activeQueue.floorNumber} (Primary Wing • Sabah General Hospital Complex)`,
      type: "queue",
      isRead: false,
      sentAt: new Date().toISOString(),
    };

    setNotifications(prev => [tenMinAlert, ...prev]);
    dbService.saveNotification(tenMinAlert).catch(() => {});
  };

  // Called when countdown reaches 0 to issue an in-app system notification
  const handleTurnArrived = () => {
    if (!currentUser || !activeQueue) return;

    const turnAlert: Notification = {
      notificationId: `notif-turn-${Date.now()}`,
      userId: currentUser.uid,
      title: "🚨 IT'S YOUR TURN!",
      message: `IT'S YOUR TURN. Please proceed to Obstetrics & Consultation ${activeQueue.roomNumber} — Floor ${activeQueue.floorNumber} (Primary Wing • Sabah General Hospital Complex).`,
      type: "queue",
      isRead: false,
      sentAt: new Date().toISOString(),
    };

    setNotifications(prev => [turnAlert, ...prev]);
    dbService.saveNotification(turnAlert).catch(() => {});
  };

  // Confirmed follow up attendance
  const handleFollowUpConfirmed = async (
    queueNo: string,
    estimatedWait: number,
    roomNumber: string,
    floorNumber: number
  ) => {
    if (!currentUser) return;

    // Create follow up queue alert
    const followAlert: Notification = {
      notificationId: `notif-${Date.now()}`,
      userId: currentUser.uid,
      title: "🗓 Attendance Confirmed",
      message: `You confirmed attendance for Oct 24 follow-up. Virtual Queue ID issued: ${queueNo}. Doctor Faisal is preparing.`,
      type: "queue",
      isRead: false,
      sentAt: new Date().toISOString(),
    };

    setNotifications(prev => [followAlert, ...prev]);

    const newFollowUp: FollowUp = {
      followUpId: `flw-${Date.now()}`,
      userId: currentUser.uid,
      previousDiagnosis: "Chronic Hypertension Checkup",
      doctorName: "Doctor Faisal",
      appointmentDate: new Date().toISOString().split('T')[0],
      department: "General Medicine",
      attendanceConfirmed: true,
    };

    try {
      await dbService.saveFollowUp(newFollowUp);
      await dbService.saveNotification(followAlert);
    } catch (err: any) {
      console.warn("Failed to write follow up to database:", err);
    }

    setActiveQueue({
      queueNumber: queueNo,
      estimatedWait: estimatedWait,
      roomNumber: roomNumber,
      floorNumber: floorNumber,
      explanation: "35 minutes. Slower wait due to incoming General Practitioner scheduled cases.",
      symptomName: "Follow-up Checks",
    });

    setCurrentView('queue');
    setActiveTab('queue');
  };

  // Notifications read/clear utilities
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
  };

  const handleClearAllNotifs = () => {
    setNotifications([]);
  };

  // Handle bottom navigation tab clicks
  const handleTabClick = (tab: 'home' | 'queue' | 'notifications' | 'profile') => {
    if (!currentUser) return;
    setActiveTab(tab);

    if (tab === 'home') {
      setCurrentView('welcome');
    } else if (tab === 'queue') {
      setCurrentView('queue');
    } else if (tab === 'notifications') {
      setCurrentView('notifications');
    } else if (tab === 'profile') {
      setCurrentView('profile');
    }
  };

  const handleHomeChoiceLink = (choice: 'firstTime' | 'followUp') => {
    if (choice === 'firstTime') {
      if (dbUser) {
        // Patient profile already created, skip registration and go directly to symptoms selection
        setCurrentView('symptoms');
      } else {
        setCurrentView('firstTimeRegister');
      }
    } else {
      setCurrentView('followUp');
    }
  };

  // Calculate unread badge counter on Bell icon button
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-semibold tracking-wide">Loading HUMS eBook records...</p>
      </div>
    );
  }

  // Redirect unauthenticated user to credential gateway
  if (!currentUser) {
    return <LoginScreen onBypassLogin={handleBypassLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased font-sans">
      
      {/* Top Clinical App Bar Header standard */}
      <header className="w-full top-0 sticky bg-white z-40 border-b border-slate-100 shadow-xs">
        <div className="flex items-center justify-between px-5 h-14 w-full max-w-2xl mx-auto">
          <button 
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-2 cursor-pointer outline-none focus:ring-1 focus:ring-blue-100 rounded-lg p-1"
          >
            <span className="text-blue-600 bg-blue-50 p-1.5 rounded-lg shrink-0">
              <HeartHandshake size={20} />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-bold text-slate-800 tracking-tight text-base md:text-lg">
                HUMS eBook
              </span>
              {isSupabaseConfigured ? (
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-emerald-200">
                  ⚡ Supabase
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-amber-200" title="Offline-first backup database storage is active.">
                  ✓ Offline DB
                </span>
              )}
            </div>
          </button>
          
          <div className="flex items-center gap-1.5">
            {/* Notifications icon */}
            <button 
              onClick={() => handleTabClick('notifications')}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition rounded-full shrink-0 outline-none cursor-pointer"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-500 text-white font-mono text-[9px] font-black h-4 min-w-4 px-1 flex items-center justify-center rounded-full border border-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main clinical canvas area */}
      <main className="flex-grow w-full max-w-2xl mx-auto px-5 pt-5 pb-28">
        {activeTab === 'home' && (
          <>
            {currentView === 'welcome' && (
              <WelcomeScreen 
                onSelectAction={handleHomeChoiceLink} 
                userName={dbUser?.fullName || currentUser.displayName || "Patient"} 
              />
            )}
            {currentView === 'firstTimeRegister' && (
              <PatientRegistration
                initialEmail={currentUser.email}
                initialName={currentUser.displayName || ''}
                onRegister={handleProfileRegistration}
                onBack={() => setCurrentView('welcome')}
              />
            )}
            {currentView === 'symptoms' && (
              <SymptomSelection
                onSymptomSelect={handleSymptomBookingComplete}
                onBack={() => setCurrentView('welcome')}
              />
            )}
            {currentView === 'followUp' && (
              <FollowUpScreen
                onConfirmAttendance={handleFollowUpConfirmed}
                onBack={() => setCurrentView('welcome')}
              />
            )}
          </>
        )}

        {activeTab === 'queue' && (
          <>
            {activeQueue ? (
              <QueueTracking
                queueNumber={activeQueue.queueNumber}
                initialWaitMinutes={activeQueue.estimatedWait}
                patientsAhead={activeQueue.patientsAhead || 3}
                roomNumber={activeQueue.roomNumber}
                floorNumber={activeQueue.floorNumber}
                symptomName={activeQueue.symptomName}
                averageWaitTime={activeQueue.averageWaitTime}
                onPredictionReady={handleRegisterLivePredictionReady}
                onTurnArrived={handleTurnArrived}
                onTenMinutesRemaining={handleTenMinutesRemaining}
                onDone={() => {
                  setActiveQueue(null);
                  setCurrentView('welcome');
                  setActiveTab('home');
                }}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-4">
                <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <Layers size={26} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 text-sm block">No Active Queue</span>
                  <p className="text-slate-500 text-xs mt-0.5 leading-normal font-medium max-w-xs mx-auto">
                    You have not registered for any clinical queues today. Create an appointment under the Home tab to get started.
                  </p>
                </div>
                <button
                  onClick={() => handleTabClick('home')}
                  className="bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-700 transition active:scale-95 cursor-pointer"
                >
                  Book Appointment Now
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'notifications' && (
          <NotificationsScreen
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onClearAll={handleClearAllNotifs}
          />
        )}

        {activeTab === 'profile' && (
          dbUser ? (
            <ProfileScreen
              user={dbUser}
              onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <UserIcon size={30} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-lg">Identity Registration Requested</h3>
                <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
                  To view and protect your electronic patient card, please complete the official clinical registration form with your MyKad/Passport details.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('home');
                  setCurrentView('firstTimeRegister');
                }}
                className="bg-blue-600 text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-blue-700 transition active:scale-95 cursor-pointer shadow-xs"
              >
                Complete Patient Profile
              </button>
              <div className="pt-2">
                <button 
                  onClick={handleLogout} 
                  className="text-xs text-red-500 font-bold hover:underline"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Structured accessible BottomNavBar selector template - minimal height of 80px */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-lg z-45">
        <div className="flex justify-around items-center h-20 w-full max-w-2xl mx-auto px-2">
          
          {/* Home Nav Item */}
          <button
            onClick={() => handleTabClick('home')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-xl cursor-pointer ${
              activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home size={20} className={activeTab === 'home' ? 'stroke-[2.5]' : ''} />
            <span className="text-[10px] font-bold tracking-wider">Home</span>
          </button>

          {/* Queue Nav Item */}
          <button
            onClick={() => handleTabClick('queue')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-xl cursor-pointer ${
              activeTab === 'queue' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Layers size={20} className={activeTab === 'queue' ? 'stroke-[2.5]' : ''} />
            <span className="text-[10px] font-bold tracking-wider">Queue</span>
          </button>

          {/* Notifications Nav Item */}
          <button
            onClick={() => handleTabClick('notifications')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-xl cursor-pointer relative ${
              activeTab === 'notifications' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Bell size={20} className={activeTab === 'notifications' ? 'stroke-[2.5]' : ''} />
            <span className="text-[10px] font-bold tracking-wider">Alerts</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 w-2 h-2 rounded-full"></span>
            )}
          </button>

          {/* Profile Nav Item */}
          <button
            onClick={() => handleTabClick('profile')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-xl cursor-pointer ${
              activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserIcon size={20} className={activeTab === 'profile' ? 'stroke-[2.5]' : ''} />
            <span className="text-[10px] font-bold tracking-wider">Profile</span>
          </button>

        </div>
      </nav>

    </div>
  );
}
