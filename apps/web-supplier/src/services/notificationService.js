import { BASE_URL } from './api';

export const getNotifications = async () => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/notifications`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch notifications');
    }
    return await res.json();
  } catch (error) {
    console.error('Service: getNotifications error:', error);
    throw error;
  }
};

export const markNotificationRead = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/notifications/${id}/read`, {
      method: 'PATCH'
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to mark notification as read');
    }
    return await res.json();
  } catch (error) {
    console.error('Service: markNotificationRead error:', error);
    throw error;
  }
};

export const markAllNotificationsRead = async () => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/notifications/mark-all-read`, {
      method: 'PATCH'
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to mark all notifications as read');
    }
    return await res.json();
  } catch (error) {
    console.error('Service: markAllNotificationsRead error:', error);
    throw error;
  }
};
