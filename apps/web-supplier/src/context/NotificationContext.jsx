import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../services/notificationService';
import { CURRENT_SUPPLIER_ID } from '../hooks/useProfile';

const NotificationContext = createContext(null);

// One instance shared by the Header bell and the Notifications page, so marking
// something as read in one place is instantly reflected in the other (plain
// per-component useState would give each caller its own isolated copy).
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getNotifications(CURRENT_SUPPLIER_ID);
      setNotifications(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = useCallback(async (id) => {
    // Optimistic update so the UI feels instant; refetch isn't required on success.
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await markNotificationRead(id, CURRENT_SUPPLIER_ID);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsRead(CURRENT_SUPPLIER_ID);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
