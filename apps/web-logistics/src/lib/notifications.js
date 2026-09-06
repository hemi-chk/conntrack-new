import api from "../config/api.js";

/**
 * Normalizes backend notification objects into a consistent shape for React UI components.
 * Ensures properties like `read`, `createdAt`, and `actionUrl` are populated reliably.
 */
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

/**
 * Fetches all notifications for the current authenticated logistics user from API.
 */
export async function getNotifications() {
  const { data } = await api.get("/logistics/notifications");
  return Array.isArray(data) ? data.map(normalizeNotification) : [];
}

/**
 * Marks a specific notification as read by ID.
 */
export async function markNotificationAsRead(id) {
  const { data } = await api.patch(`/logistics/notifications/${id}/read`);
  return data?.notification ? normalizeNotification(data.notification) : null;
}

/**
 * Marks all notifications as read for the current logistics user.
 */
export async function markAllNotificationsAsRead() {
  await api.patch("/logistics/notifications/read-all");
}

/**
 * Deletes all notifications for the current logistics user.
 */
export async function clearAllNotifications() {
  await api.delete("/logistics/notifications");
}

/**
 * Helper utility returning Tailwind CSS class string for priority badge styling.
 * Supports: critical (red), high (amber), medium (blue), low (slate).
 */
export function getPriorityStyles(priority = "medium") {
  const map = {
    critical: "bg-red-50 text-red-700 border-red-200",
    high: "bg-amber-50 text-amber-700 border-amber-200",
    medium: "bg-blue-50 text-blue-700 border-blue-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return map[priority] || map.medium;
}

/**
 * Helper mapping notification category type to corresponding Lucide icon identifier.
 */
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
