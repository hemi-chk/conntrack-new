import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Inbox, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead } = useNotifications();

  const handleOpenNotification = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.type === 'new_bidding') {
      navigate('/biddings', { state: { highlightBiddingId: notification.bidding_id } });
    } else {
      // 'bid_status' or 'bidding_status' - supplier already has a bid on this bidding
      navigate('/my-bids', { state: { highlightBiddingId: notification.bidding_id } });
    }
  };

  return (
    <div className="flex flex-col gap-6 duration-500 text-dark animate-in fade-in slide-in-from-bottom-4">

      {/* Header Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Updates on your bids and open biddings</p>
        </div>
        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="flex gap-2 items-center px-4 py-2.5 text-sm font-semibold bg-white rounded-lg border border-gray-200 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:disabled:hover:bg-slate-800"
        >
          <CheckCheck size={16} />
          Mark all as read
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex gap-3 items-center px-4 py-3 text-red-700 bg-red-50 rounded-xl border border-red-200">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col gap-2 items-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="w-6 h-6 rounded-full border-2 animate-spin border-primary border-t-transparent"></div>
            <p className="text-sm font-medium text-gray-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col gap-3 items-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 bg-gray-50 rounded-full">
              <Inbox size={40} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-1 items-center">
              <p className="text-lg font-bold tracking-tight text-gray-500">No notifications yet</p>
              <p className="max-w-xs text-sm text-center text-gray-400">Updates about your bids and new open biddings will show up here.</p>
            </div>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleOpenNotification(notification)}
              className={`flex gap-4 items-start p-4 text-left rounded-xl border shadow-sm transition-colors hover:shadow-md ${
                notification.is_read
                  ? 'bg-white border-gray-200'
                  : 'bg-blue-50 border-blue-100 border-l-4 border-l-primary'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${notification.is_read ? 'bg-gray-50 text-gray-400' : 'bg-blue-100 text-primary'}`}>
                <Bell size={18} />
              </div>
              <div className="flex flex-col flex-1 gap-1 min-w-0">
                <div className="flex gap-2 items-center">
                  <span className={`text-sm ${notification.is_read ? 'font-semibold text-gray-600' : 'font-bold text-dark'}`}>
                    {notification.title}
                  </span>
                  {!notification.is_read && (
                    <span className="w-2 h-2 bg-primary rounded-full shrink-0"></span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{notification.message}</p>
                {notification.bidding_id && (
                  <span className="text-xs font-bold tracking-tight text-primary">#{notification.bidding_id}</span>
                )}
              </div>
              {notification.created_at && (
                <span className="text-xs font-medium text-gray-400 shrink-0 whitespace-nowrap">
                  {new Date(notification.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
