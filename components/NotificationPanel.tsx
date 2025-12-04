import React from 'react';
import { Notification, Role } from '../types';
import { Bell, X, Check, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { markAllAsRead } from '../services/mockData';

interface NotificationPanelProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  currentUser: Role;
  onRefresh: () => void;
  onSelectNotification: (ticketId: string) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ 
  notifications, 
  isOpen, 
  onClose, 
  currentUser,
  onRefresh,
  onSelectNotification
}) => {
  const handleMarkAllRead = () => {
    markAllAsRead(currentUser);
    onRefresh();
  };

  const handleNotificationClick = (n: Notification) => {
    onSelectNotification(n.ticketId);
    if (window.innerWidth < 768) {
        onClose();
    }
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'ALERT': return <AlertTriangle size={16} className="text-red-500" />;
          case 'SUCCESS': return <CheckCircle size={16} className="text-green-500" />;
          default: return <Info size={16} className="text-blue-500" />;
      }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-0 w-80 md:w-96 bg-white shadow-2xl h-[calc(100vh-64px)] z-50 border-l border-gray-200 flex flex-col animate-slide-in-right">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Bell size={18} /> 通知中心
        </h3>
        <div className="flex gap-2">
            {notifications.some(n => !n.isRead) && (
                <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                >
                    全部已读
                </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Bell size={48} className="mb-2 opacity-20" />
            <p className="text-sm">暂无新通知</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <li 
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative
                    ${!notif.isRead ? 'bg-indigo-50/40' : ''}
                `}
              >
                {!notif.isRead && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></span>
                )}
                <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                        {getIcon(notif.type)}
                        {notif.ticketId}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-1">{notif.ticketTitle}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{notif.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;