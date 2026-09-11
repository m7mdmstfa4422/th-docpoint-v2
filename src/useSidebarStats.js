import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useNotifications } from './NotificationContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Format badge count gracefully (e.g., 99+, 1.2k, 12k)
 */
export function formatBadgeCount(val) {
  if (val === undefined || val === null) return null;
  const num = Number(val);
  if (isNaN(num) || num <= 0) return null;

  if (num >= 10000) {
    return `${Math.floor(num / 1000)}k`;
  }
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1);
    return formatted.endsWith('.0') ? `${Math.floor(num / 1000)}k` : `${formatted}k`;
  }
  if (num > 99) {
    return '99+';
  }
  return String(num);
}

export function useSidebarStats() {
  const { isAuthenticated, token } = useAuth() || {};
  const { unreadCount } = useNotifications() || {};

  const [counts, setCounts] = useState({
    appointments: null,
    patients: null,
    debts: null,
    operations: null,
    prescriptions: null,
    reports: null,
    unreadNotifications: null,
    urgentCases: null,
  });
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    const activeToken = token || localStorage.getItem('clinicToken') || sessionStorage.getItem('clinicToken');
    if (!activeToken) return;

    try {
      const res = await fetch(`${API_URL}/dashboard/sidebar-counts`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch sidebar counts');
      const data = await res.json();

      if (isMountedRef.current) {
        setCounts((prev) => ({
          ...prev,
          appointments: data.appointments ?? 0,
          todayAppointments: data.todayAppointments ?? 0,
          upcomingAppointments: data.upcomingAppointments ?? 0,
          patients: data.patients ?? 0,
          debts: data.debts ?? 0,
          operations: data.operations ?? 0,
          prescriptions: data.prescriptions ?? 0,
          reports: data.reports ?? 0,
          unreadNotifications: data.unreadNotifications ?? 0,
          urgentCases: data.urgentCases ?? 0,
        }));
        setLoading(false);
      }
    } catch (err) {
      console.warn('Could not load sidebar counts:', err.message);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, token]);

  // Sync with unread notifications count from NotificationContext if changed
  useEffect(() => {
    if (typeof unreadCount === 'number') {
      setCounts((prev) => ({
        ...prev,
        unreadNotifications: unreadCount,
      }));
    }
  }, [unreadCount]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();

    // Re-fetch periodically every 30 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    }, 30000);

    // Refresh when user returns to tab
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Refresh when mutations occur across the app
    const onNotice = () => {
      setTimeout(fetchStats, 600);
    };
    window.addEventListener('clinic:notice', onNotice);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('clinic:notice', onNotice);
    };
  }, [fetchStats]);

  return {
    counts,
    loading,
    refresh: fetchStats,
  };
}
