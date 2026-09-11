import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AuthContext } from './AuthProvider';

export const NotificationContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Format relative time in clean Arabic
 */
export function formatRelativeTimeArabic(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

  if (diffInSeconds < 45) return 'الآن';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes === 1) return 'منذ دقيقة';
  if (diffInMinutes === 2) return 'منذ دقيقتين';
  if (diffInMinutes >= 3 && diffInMinutes <= 10) return `منذ ${diffInMinutes} دقائق`;
  if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return 'منذ ساعة';
  if (diffInHours === 2) return 'منذ ساعتين';
  if (diffInHours >= 3 && diffInHours <= 10) return `منذ ${diffInHours} ساعات`;
  if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'منذ يوم';
  if (diffInDays === 2) return 'منذ يومين';
  if (diffInDays >= 3 && diffInDays <= 10) return `منذ ${diffInDays} أيام`;
  if (diffInDays < 30) return `منذ ${diffInDays} يوماً`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths === 1) return 'منذ شهر';
  if (diffInMonths === 2) return 'منذ شهرين';
  if (diffInMonths <= 10) return `منذ ${diffInMonths} أشهر`;
  return `منذ ${diffInMonths} شهراً`;
}

/**
 * Audio chime for incoming notifications
 */
function playNotificationChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch {
    // AudioContext not permitted before user interaction or unsupported
  }
}

export default function NotificationProvider({ children }) {
  const { token, isAuthenticated } = useContext(AuthContext) || {};
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Helper for silent background requests with auth token
  const authenticatedFetch = useCallback(
    async (endpoint, options = {}) => {
      const activeToken = token || localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
      const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          ...(options.headers || {}),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Request failed with status ${res.status}`);
      }
      return res.json();
    },
    [token]
  );

  /**
   * Fetch all notifications
   */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      const data = await authenticatedFetch('/notifications');
      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : data.notifications.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authenticatedFetch]);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(
    async (id) => {
      if (!id) return;

      // Optimistic state update
      setNotifications((prev) => {
        let changed = false;
        const next = prev.map((item) => {
          if (item._id === id && !item.isRead) {
            changed = true;
            return { ...item, isRead: true };
          }
          return item;
        });
        if (changed) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return next;
      });

      try {
        await authenticatedFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      } catch (err) {
        console.error(`Failed to mark notification ${id} as read:`, err);
      }
    },
    [authenticatedFetch]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    // Optimistic state update
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    try {
      await authenticatedFetch('/notifications/mark-all-read', { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Revert from server
      fetchNotifications();
    }
  }, [authenticatedFetch, fetchNotifications]);

  /**
   * Delete a single notification
   */
  const deleteNotification = useCallback(
    async (id) => {
      if (!id) return;

      // Optimistic state update
      setNotifications((prev) => {
        const target = prev.find((n) => n._id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== id);
      });

      try {
        await authenticatedFetch(`/notifications/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.error(`Failed to delete notification ${id}:`, err);
        fetchNotifications();
      }
    },
    [authenticatedFetch, fetchNotifications]
  );

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);

    try {
      await authenticatedFetch('/notifications', { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
      fetchNotifications();
    }
  }, [authenticatedFetch, fetchNotifications]);

  /**
   * Real-time Server-Sent Events (SSE) listener & Auto-reconnect
   */
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    // Initial load
    fetchNotifications();

    let retryCount = 0;
    const maxRetryDelay = 30000;

    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const activeToken = token || localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
      if (!activeToken) return;

      const sseUrl = `${API_URL}/notifications/stream?token=${encodeURIComponent(activeToken)}`;

      try {
        const es = new EventSource(sseUrl);
        eventSourceRef.current = es;

        es.addEventListener('connected', () => {
          retryCount = 0;
        });

        es.addEventListener('notification', (e) => {
          try {
            const newNotification = JSON.parse(e.data);
            if (!newNotification || !newNotification._id) return;

            setNotifications((prev) => {
              // Avoid duplicate if already exists
              if (prev.some((n) => n._id === newNotification._id)) return prev;
              return [newNotification, ...prev];
            });

            if (!newNotification.isRead) {
              setUnreadCount((c) => c + 1);
              playNotificationChime();
            }
          } catch (err) {
            console.error('Failed to parse SSE notification payload:', err);
          }
        });

        es.onerror = () => {
          es.close();
          eventSourceRef.current = null;

          const delay = Math.min(1000 * Math.pow(2, retryCount), maxRetryDelay);
          retryCount++;

          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isAuthenticated) connectSSE();
          }, delay);
        };
      } catch (err) {
        console.error('EventSource connection error:', err);
      }
    };

    connectSSE();

    // Background safety polling (every 45s) to guarantee eventual consistency
    pollIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 45000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, token, fetchNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
