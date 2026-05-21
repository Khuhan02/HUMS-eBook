import { createClient } from '@supabase/supabase-js';
import { User, Appointment, Queue, FollowUp, Notification } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl !== 'MY_SUPABASE_URL' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'MY_SUPABASE_ANON_KEY'
);

// Initialize Supabase client
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.info('Supabase database credentials not detected in Environment yet. Running in offline-first localStorage simulation.');
} else {
  console.info('Supabase dynamic client initialization succeeded! Syncing queue operations.');
}

// Transparent localStorage backup state helper
const getLocalData = <T>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalData = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save local fallback database:', err);
  }
};

export const dbService = {
  // Users Profile Mapping
  async saveUserProfile(user: User): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('users')
        .upsert({
          uid: user.uid,
          full_name: user.fullName,
          ic_passport: user.icPassport,
          phone: user.phone,
          email: user.email,
          age: user.age,
          gender: user.gender,
          is_first_time: user.isFirstTime,
          created_at: user.createdAt,
        });
      if (error) {
        console.error('Supabase user save error:', error);
        throw error;
      }
    } else {
      const users = getLocalData<User>('hums_users');
      const filtered = users.filter(u => u.uid !== user.uid);
      saveLocalData('hums_users', [...filtered, user]);
    }
  },

  async getUserProfile(uid: string): Promise<User | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('uid', uid)
          .maybeSingle();
        if (error) {
          console.error('Supabase getUserProfile error:', error);
          throw error;
        }
        if (!data) return null;
        return {
          uid: data.uid,
          fullName: data.full_name,
          icPassport: data.ic_passport,
          phone: data.phone,
          email: data.email,
          age: data.age,
          gender: data.gender,
          isFirstTime: data.is_first_time,
          createdAt: data.created_at,
        };
      } catch (err) {
        console.error('Supabase query exception, falling back to local storage:', err);
        const users = getLocalData<User>('hums_users');
        return users.find(u => u.uid === uid) || null;
      }
    } else {
      const users = getLocalData<User>('hums_users');
      return users.find(u => u.uid === uid) || null;
    }
  },

  async getUserProfileByEmail(email: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();
        if (error) {
          console.error('Supabase getUserProfileByEmail error:', error);
          throw error;
        }
        if (!data) return null;
        return {
          uid: data.uid,
          fullName: data.full_name,
          icPassport: data.ic_passport,
          phone: data.phone,
          email: data.email,
          age: data.age,
          gender: data.gender,
          isFirstTime: data.is_first_time,
          createdAt: data.created_at,
        };
      } catch (err) {
        console.error('Supabase query exception, falling back to local storage:', err);
        const users = getLocalData<User>('hums_users');
        return users.find(u => u.email?.trim().toLowerCase() === cleanEmail) || null;
      }
    } else {
      const users = getLocalData<User>('hums_users');
      return users.find(u => u.email?.trim().toLowerCase() === cleanEmail) || null;
    }
  },

  // Appointments
  async saveAppointment(appt: Appointment): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('appointments')
        .upsert({
          appointment_id: appt.appointmentId,
          user_id: appt.userId,
          appointment_type: appt.appointmentType,
          department: appt.department,
          symptom_id: appt.symptomId,
          doctor_name: appt.doctorName,
          appointment_date: appt.appointmentDate,
          status: appt.status,
          created_at: appt.createdAt,
        });
      if (error) {
        console.error('Supabase saveAppointment error:', error);
        throw error;
      }
    } else {
      const appointments = getLocalData<Appointment>('hums_appointments');
      const filtered = appointments.filter(a => a.appointmentId !== appt.appointmentId);
      saveLocalData('hums_appointments', [...filtered, appt]);
    }
  },

  async getAppointments(userId: string): Promise<Appointment[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Supabase getAppointments error:', error);
          throw error;
        }
        return (data || []).map(d => ({
          appointmentId: d.appointment_id,
          userId: d.user_id,
          appointmentType: d.appointment_type,
          department: d.department,
          symptomId: d.symptom_id,
          doctorName: d.doctor_name,
          appointmentDate: d.appointment_date,
          status: d.status,
          createdAt: d.created_at,
        }));
      } catch (err) {
        console.error('Supabase query exception, fallback to local:', err);
        const appointments = getLocalData<Appointment>('hums_appointments');
        return appointments.filter(a => a.userId === userId);
      }
    } else {
      const appointments = getLocalData<Appointment>('hums_appointments');
      return appointments.filter(a => a.userId === userId);
    }
  },

  // Queue
  async saveQueue(q: Queue): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('queue')
        .upsert({
          queue_id: q.queueId,
          appointment_id: q.appointmentId,
          queue_number: q.queueNumber,
          estimated_wait: q.estimatedWait,
          patients_ahead: q.patientsAhead,
          room_number: q.roomNumber,
          floor_number: q.floorNumber,
          queue_status: q.queueStatus,
          updated_at: q.updatedAt,
        });
      if (error) {
        console.error('Supabase saveQueue error:', error);
        throw error;
      }
    } else {
      const queues = getLocalData<Queue>('hums_queues');
      const filtered = queues.filter(item => item.queueId !== q.queueId);
      saveLocalData('hums_queues', [...filtered, q]);
    }
  },

  async getQueue(queueId: string): Promise<Queue | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('queue')
          .select('*')
          .eq('queue_id', queueId)
          .maybeSingle();
        if (error) {
          console.error('Supabase getQueue error:', error);
          throw error;
        }
        if (!data) return null;
        return {
          queueId: data.queue_id,
          appointmentId: data.appointment_id,
          queueNumber: data.queue_number,
          estimatedWait: data.estimated_wait,
          patientsAhead: data.patients_ahead,
          roomNumber: data.room_number,
          floorNumber: data.floor_number,
          queueStatus: data.queue_status,
          updatedAt: data.updated_at,
        };
      } catch (err) {
        console.error('Supabase getQueue exception, fallback to local:', err);
        const queues = getLocalData<Queue>('hums_queues');
        return queues.find(q => q.queueId === queueId) || null;
      }
    } else {
      const queues = getLocalData<Queue>('hums_queues');
      return queues.find(q => q.queueId === queueId) || null;
    }
  },

  // Follow-ups
  async saveFollowUp(f: FollowUp): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('follow_ups')
        .upsert({
          follow_up_id: f.followUpId,
          user_id: f.userId,
          previous_diagnosis: f.previousDiagnosis,
          doctor_name: f.doctorName,
          appointment_date: f.appointmentDate,
          department: f.department,
          attendance_confirmed: f.attendanceConfirmed,
        });
      if (error) {
        console.error('Supabase saveFollowUp error:', error);
        throw error;
      }
    } else {
      const followups = getLocalData<FollowUp>('hums_followups');
      const filtered = followups.filter(item => item.followUpId !== f.followUpId);
      saveLocalData('hums_followups', [...filtered, f]);
    }
  },

  async getFollowUps(userId: string): Promise<FollowUp[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('follow_ups')
          .select('*')
          .eq('user_id', userId);
        if (error) {
          console.error('Supabase getFollowUps error:', error);
          throw error;
        }
        return (data || []).map(f => ({
          followUpId: f.follow_up_id,
          userId: f.user_id,
          previousDiagnosis: f.previous_diagnosis,
          doctorName: f.doctor_name,
          appointmentDate: f.appointment_date,
          department: f.department,
          attendanceConfirmed: f.attendance_confirmed,
        }));
      } catch (err) {
        console.error('Supabase getFollowUps exception, fallback to local:', err);
        const followups = getLocalData<FollowUp>('hums_followups');
        return followups.filter(f => f.userId === userId);
      }
    } else {
      const followups = getLocalData<FollowUp>('hums_followups');
      return followups.filter(f => f.userId === userId);
    }
  },

  // Notifications
  async saveNotification(n: Notification): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('notifications')
        .upsert({
          notification_id: n.notificationId,
          user_id: n.userId,
          title: n.title,
          message: n.message,
          type: n.type,
          is_read: n.isRead,
          sent_at: n.sentAt,
        });
      if (error) {
        console.error('Supabase saveNotification error:', error);
        throw error;
      }
    } else {
      const notifications = getLocalData<Notification>('hums_notifications');
      const filtered = notifications.filter(item => item.notificationId !== n.notificationId);
      saveLocalData('hums_notifications', [...filtered, n]);
    }
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('sent_at', { ascending: false });
        if (error) {
          console.error('Supabase getNotifications error:', error);
          throw error;
        }
        return (data || []).map(n => ({
          notificationId: n.notification_id,
          userId: n.user_id,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.is_read,
          sentAt: n.sent_at,
        }));
      } catch (err) {
        console.error('Supabase getNotifications exception, fallback to local:', err);
        const notifications = getLocalData<Notification>('hums_notifications');
        return notifications.filter(n => n.userId === userId);
      }
    } else {
      const notifications = getLocalData<Notification>('hums_notifications');
      return notifications.filter(n => n.userId === userId);
    }
  },
};
