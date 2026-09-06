import { BASE_URL } from './api';

export const getNotifications = async (supplierId) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/notifications?supplier_id=${supplierId}`);
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

export const markNotificationRead = async (id, supplierId) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplier_id: supplierId })
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

export const markAllNotificationsRead = async (supplierId) => {
  try {
    const res = await fetch(`${BASE_URL}/supplier/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplier_id: supplierId })
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
