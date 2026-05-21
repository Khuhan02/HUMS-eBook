export interface User {
  uid: string;
  fullName: string;
  icPassport: string;
  phone: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  isFirstTime: boolean;
  createdAt: string; // ISO String
}

export interface Appointment {
  appointmentId: string;
  userId: string;
  appointmentType: 'firstTime' | 'followUp';
  department: string;
  symptomId: string;
  doctorName: string;
  appointmentDate: string; // YYYY-MM-DD
  status: 'pending' | 'confirmed' | 'completed';
  createdAt: string; // ISO String;
}

export interface Symptom {
  symptomId: string;
  name: string;
  icon: string; // large emoji or icon string
  category: string;
  averageWaitTime: number; // minutes
  description: string;
}

export interface Queue {
  queueId: string;
  appointmentId: string;
  queueNumber: string;
  estimatedWait: number; // in minutes
  patientsAhead: number;
  roomNumber: string;
  floorNumber: number;
  queueStatus: 'waiting' | 'ready' | 'completed';
  updatedAt: string; // ISO String
}

export interface FollowUp {
  followUpId: string;
  userId: string;
  previousDiagnosis: string;
  doctorName: string;
  appointmentDate: string; // YYYY-MM-DD
  department: string;
  attendanceConfirmed: boolean;
}

export interface Notification {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: 'queue' | 'appointment';
  isRead: boolean;
  sentAt: string; // ISO String
}
