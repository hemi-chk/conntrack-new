import api from "../config/api";

const normalizeNotification = (item = {}) => ({
  id: item.id,
  title: item.title || "System update",
  message: item.message || "New update available.",
  type: item.type || "info",
  priority: item.priority || "medium",
  read: Boolean(item.read ?? item.is_read),
  createdAt: item.createdAt || item.created_at,
  actionUrl: item.actionUrl || item.action_url || "/",
});

export async function getNotifications() {
  try {
    const { data } = await api.get("/logistics/notifications");
    return Array.isArray(data) ? data.map(normalizeNotification) : [];
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(id) {
  try {
    const { data } = await api.patch(`/logistics/notifications/${id}/read`);
    const notifications = data?.notifications || [];
    return notifications.map(normalizeNotification);
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return [];
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const { data } = await api.patch("/logistics/notifications/read-all");
    const notifications = data?.notifications || [];
    return notifications.map(normalizeNotification);
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return [];
  }
}

export function getPriorityStyles(priority = "medium") {
  const map = {
    critical: "bg-red-50 text-red-700 border-red-200",
    high: "bg-amber-50 text-amber-700 border-amber-200",
    medium: "bg-blue-50 text-blue-700 border-blue-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return map[priority] || map.medium;
}

export function getTypeIcon(type = "info") {
  const map = {
    order: "Package",
    issue: "AlertTriangle",
    tracking: "MapPin",
    document: "FileText",
    info: "Bell",
  };

  return map[type] || map.info;
}
