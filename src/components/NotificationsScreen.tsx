import React, { useState } from 'react';
import { Bell, CheckCircle, Clock, Volume2, Calendar, Trash2, MailOpen } from 'lucide-react';
import { Notification } from '../types';

interface NotificationsScreenProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationsScreen({ notifications, onMarkAsRead, onClearAll }: NotificationsScreenProps) {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const handleRowClick = (notif: Notification) => {
    onMarkAsRead(notif.notificationId);
    setSelectedNotification(notif);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clinic Notifications</h2>
          <p className="text-sm text-slate-500 mt-1 font-semibold">
            Track scheduling confirmations and virtual queue alerts.
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100/60 px-3 py-1.5 rounded-xl border border-red-100/50 cursor-pointer transition-colors"
          >
            <Trash2 size={14} />
            Clear
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3.5">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Bell size={26} />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-sm block">No Notifications</span>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">You don't have any health alerts logged at this moment.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <button
              key={notif.notificationId}
              onClick={() => handleRowClick(notif)}
              className={`w-full flex items-start p-4 bg-white border rounded-2xl text-left transition-all active:scale-[0.99] outline-none cursor-pointer hover:bg-slate-50 ${
                notif.isRead ? 'border-slate-200 opacity-75' : 'border-blue-500 shadow-xs ring-1 ring-blue-50 bg-blue-50/5'
              }`}
            >
              {/* Icon classification mapping */}
              <div className={`w-10 h-10 rounded-xl shrink-0 mr-4 flex items-center justify-center ${
                notif.type === 'queue' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {notif.type === 'queue' ? <Volume2 size={20} /> : <Calendar size={20} />}
              </div>

              <div className="flex-grow space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold truncate pr-3 ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                    {notif.title}
                  </h3>
                  {!notif.isRead && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0"></span>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-semibold">
                  {notif.message}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold">
                    {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-slate-300 text-[10px]">•</span>
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                    {notif.type}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* DETAIL DIALOG MODAL: Reveal on row selection */}
      {selectedNotification && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setSelectedNotification(null)}></div>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative z-10 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                selectedNotification.type === 'queue' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {selectedNotification.type === 'queue' ? <Volume2 size={22} /> : <Calendar size={22} />}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">HUMS Medical Log</span>
                <h3 className="font-bold text-slate-900 text-base">{selectedNotification.title}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed font-semibold">
              {selectedNotification.message}
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-bold">
              <span>Type: {selectedNotification.type.toUpperCase()}</span>
              <span>{new Date(selectedNotification.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>

            <button
              onClick={() => setSelectedNotification(null)}
              className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
