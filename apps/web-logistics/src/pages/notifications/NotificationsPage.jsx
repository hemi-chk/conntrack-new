import {
    AlertTriangle,
    Bell,
    CheckCheck,
    ChevronRight,
    Clock3,
    FileText,
    MapPin,
    Package,
    Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getNotifications,
    getPriorityStyles,
    markAllNotificationsAsRead,
    markNotificationAsRead
} from "../../lib/notifications";

const typeMap = {
  order: Package,
  issue: AlertTriangle,
  tracking: MapPin,
  document: FileText,
  info: Bell,
};

const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadNotifications = async () => {
      const data = await getNotifications();
      setNotifications(data);
    };

    loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const handleOpen = async (notification) => {
    if (!notification.read) {
      const updated = await markNotificationAsRead(notification.id);
      setNotifications(updated);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    const updated = await markAllNotificationsAsRead();
    setNotifications(updated);
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#052659] text-white flex items-center justify-center">
              <Bell size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Notifications</h1>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                {unreadCount} unread updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
            >
              <Trash2 size={14} />
              Clear all
            </button>
          </div>
        </div>

        <div className="p-5">
          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Bell size={22} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">No notifications yet</h2>
              <p className="mt-2 text-sm text-slate-500">
                You will see shipment, issue, and document alerts here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = typeMap[notification.type] || Bell;

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleOpen(notification)}
                    className={`w-full text-left rounded-2xl border p-4 transition ${
                      notification.read
                        ? "border-slate-200 bg-white hover:bg-slate-50"
                        : "border-blue-200 bg-blue-50/60 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Icon size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="inline-flex rounded-full bg-[#052659] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                              New
                            </span>
                          )}
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ${getPriorityStyles(notification.priority)}`}
                          >
                            {notification.priority || "medium"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-600">
                          {notification.message}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 size={12} />
                            {formatTime(notification.createdAt)}
                          </span>

                          {notification.actionUrl && (
                            <span className="inline-flex items-center gap-1 font-semibold text-[#052659]">
                              View details
                              <ChevronRight size={13} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
