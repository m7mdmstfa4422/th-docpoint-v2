import { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  BellOff,
  CalendarPlus,
  CheckCheck,
  ChevronDown,
  CreditCard,
  LogOut,
  RotateCw,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { AuthContext } from '../../AuthProvider';
import { useNotifications, formatRelativeTimeArabic } from '../../NotificationContext';

/* ─── helpers ────────────────────────────────────────────── */
function getInitials(name) {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
}

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

/* ─── notification category config ───────────────────────── */
const NOTIF_CONFIG = {
  appointment: {
    icon: CalendarPlus,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    tag: 'موعد',
    tagColor: 'bg-indigo-100/70 text-indigo-700',
  },
  patient: {
    icon: UserPlus,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    tag: 'مريض',
    tagColor: 'bg-emerald-100/70 text-emerald-700',
  },
  billing: {
    icon: CreditCard,
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    tag: 'ماليات',
    tagColor: 'bg-amber-100/70 text-amber-700',
  },
  urgent: {
    icon: AlertCircle,
    color: 'bg-rose-50 text-rose-600 border-rose-100',
    tag: 'عاجل',
    tagColor: 'bg-rose-100/70 text-rose-700',
  },
  system: {
    icon: Activity,
    color: 'bg-sky-50 text-sky-600 border-sky-100',
    tag: 'تنبيه',
    tagColor: 'bg-sky-100/70 text-sky-700',
  },
};

/* ─── dropdown animation ─────────────────────────────────── */
const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 360, damping: 28 } },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15 } },
};

/* ─── notifications panel ────────────────────────────────── */
function NotificationsPanel({ onClose, navigate }) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const handleItemClick = async (n) => {
    if (!n.isRead) {
      await markAsRead(n._id);
    }
    if (n.link) {
      navigate(n.link);
      onClose();
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  return (
    <motion.div
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute left-0 top-full z-50 mt-2.5 w-80 sm:w-96 overflow-hidden rounded-3xl border border-slate-100/90 bg-white/98 shadow-2xl shadow-slate-300/50 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Bell size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900">مركز الإشعارات</span>
              {unreadCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[9.5px] font-bold text-white shadow-2xs">
                  {unreadCount} جديد
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">تحديثات فورية لنشاط العيادة</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              title="تحديد الكل كمقروء"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-sky-600 transition hover:bg-sky-50 hover:text-sky-700"
            >
              <CheckCheck size={13} />
              <span>قراءة الكل</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 divide-y divide-slate-100/80 overflow-y-auto overscroll-contain">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <RotateCw size={22} className="animate-spin text-sky-600 mb-2" />
            <span className="text-xs font-medium">جارٍ مزامنة الإشعارات...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 mb-3 border border-slate-100">
              <BellOff size={22} />
            </div>
            <p className="text-xs font-bold text-slate-700">لا توجد إشعارات جديدة</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              أنت على اطلاع دائم بجميع مواعيد ومرضى العيادة
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const config = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.system;
            const IconComp = config.icon;

            return (
              <div
                key={n._id}
                onClick={() => handleItemClick(n)}
                className={`group relative flex items-start gap-3 p-3.5 transition-all cursor-pointer hover:bg-slate-50/90 ${
                  !n.isRead ? 'bg-sky-50/40 border-r-[3px] border-r-sky-500' : 'bg-white'
                }`}
              >
                {/* Category Icon */}
                <div
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${config.color}`}
                >
                  <IconComp size={16} />
                  {!n.isRead && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p
                        className={`text-xs truncate ${
                          !n.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'
                        }`}
                      >
                        {n.title}
                      </p>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded-md text-[9.5px] font-bold ${config.tagColor}`}
                      >
                        {config.tag}
                      </span>
                    </div>

                    <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap shrink-0">
                      {formatRelativeTimeArabic(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-[11.5px] text-slate-500 leading-snug mt-1 break-words line-clamp-2">
                    {n.message}
                  </p>
                </div>

                {/* Delete button on hover */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, n._id)}
                  title="حذف الإشعار"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>بث فوري متصل</span>
          </div>

          <button
            type="button"
            onClick={clearAllNotifications}
            className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors"
          >
            مسح الكل
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ─── profile dropdown ──────────────────────────────────── */
function ProfilePanel({ admin, logout, navigate, onClose }) {
  const roleLabel =
    admin?.role === 'developer'
      ? 'مطوّر النظام'
      : admin?.username === 'drahmed'
      ? 'طبيب مسؤول'
      : 'موظف استقبال';

  const initials = getInitials(admin?.name || admin?.username);

  return (
    <motion.div
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute left-0 top-full z-50 mt-2.5 w-64 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60"
    >
      {/* identity block */}
      <div className="flex items-center gap-3 border-b border-slate-100 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-500 text-white font-bold text-xs shadow-xs">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="truncate text-xs font-bold text-slate-900">
              {admin?.name || admin?.username || 'المسؤول'}
            </p>
            {admin?.username === 'drahmed' && (
              <ShieldCheck size={12} className="shrink-0 text-sky-600" />
            )}
          </div>
          <p className="flex items-center gap-1 text-[10.5px] font-medium text-slate-400 mt-0.5">
            <Stethoscope size={10} />
            {roleLabel}
          </p>
        </div>
      </div>

      {/* actions */}
      <div className="p-2 space-y-1">
        {(admin?.username === 'drahmed' || admin?.role === 'developer') && (
          <button
            type="button"
            onClick={() => {
              navigate('/settings');
              onClose();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <Settings size={14} className="text-slate-400" />
            <span>إعدادات العيادة</span>
          </button>
        )}
        {logout && (
          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
          >
            <LogOut size={14} />
            <span>تسجيل الخروج</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── main component ─────────────────────────────────────── */
export default function Topbar({ onMenuClick }) {
  const { admin, logout } = useContext(AuthContext);
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useClickOutside(notifRef, () => setShowNotifications(false));
  useClickOutside(profileRef, () => setShowProfile(false));

  const initials = getInitials(admin?.name || admin?.username);

  /* ⌘K / Ctrl+K shortcut to focus search */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('topbar-search')?.focus();
      }
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowProfile(false);
        document.getElementById('topbar-search')?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-100/90 bg-white/95 px-4 md:px-6 backdrop-blur-md shadow-2xs"
    >
      {/* ── Right side: Controls & Navigation ── */}
      <div className="flex items-center gap-2">
        {/* Mobile menu trigger button matching the Sidebar 2-bar design */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onMenuClick}
          aria-label="فتح القائمة"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 transition hover:bg-slate-100 lg:hidden"
        >
          <svg
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <line x1="1" y1="2" x2="17" y2="2" />
            <line x1="1" y1="7" x2="17" y2="7" />
            <line x1="1" y1="12" x2="11" y2="12" />
          </svg>
        </motion.button>

        {/* History Nav: Back / Forward / Refresh */}
        <div className="items-center gap-1 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-1 shadow-2xs sm:flex">
          <button
            type="button"
            onClick={() => navigate(-1)}
            title="رجوع"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs"
          >
            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            onClick={() => navigate(1)}
            title="تقدم"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs"
          >
            <ArrowLeft size={15} />
          </button>

          <span className="mx-0.5 h-3.5 w-px bg-slate-200" />

          <button
            type="button"
            onClick={() => window.location.reload()}
            title="إعادة تحميل"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-sky-700 hover:shadow-2xs"
          >
            <RotateCw size={13} />
          </button>
        </div>
      </div>

      {/* ── Center: Search Bar ── */}
      <motion.div
        animate={{ width: searchFocused ? '100%' : 'auto' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative hidden flex-1 max-w-sm xs:flex md:max-w-md"
      >
        <div
          className={`flex w-full items-center gap-2 rounded-2xl border px-3.5 py-2 transition-all duration-200 ${
            searchFocused
              ? 'border-sky-400 bg-white shadow-md shadow-sky-500/10 ring-2 ring-sky-100'
              : 'border-slate-200/80 bg-slate-50/80 hover:border-slate-300'
          }`}
        >
          <Search
            size={14}
            className={`shrink-0 transition-colors duration-200 ${
              searchFocused ? 'text-sky-600' : 'text-slate-400'
            }`}
          />
          <input
            id="topbar-search"
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="بحث عن مريض، موعد، أو ملف..."
            className="min-w-0 flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
            dir="rtl"
          />
          {searchValue ? (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setSearchValue('');
              }}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            >
              <X size={11} />
            </button>
          ) : (
            <kbd className="hidden shrink-0 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400 shadow-2xs sm:inline">
              ⌘K
            </kbd>
          )}
        </div>
      </motion.div>

      {/* ── Left side: Quick Action, Notifications, & Profile ── */}
      <div className="flex items-center gap-2">
        {/* Small Screen: New Patient icon */}
        <button
          type="button"
          onClick={() => navigate('/register')}
          title="تسجيل مريض جديد"
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700 transition hover:bg-sky-100 md:hidden"
        >
          <UserPlus size={16} />
        </button>

        {/* Notifications Button */}
        <div ref={notifRef} className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => {
              setShowNotifications((p) => !p);
              setShowProfile(false);
            }}
            title="الإشعارات"
            aria-label="مركز الإشعارات"
            className={`relative flex h-9 w-9 items-center justify-center rounded-2xl border transition ${
              showNotifications
                ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-xs'
                : 'border-slate-200/80 bg-slate-50/80 text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Bell size={16} className={unreadCount > 0 ? 'text-slate-800' : 'text-slate-500'} />
            {unreadCount > 0 && (
              <>
                {/* Ping animation effect */}
                <span className="absolute -top-0.5 -left-0.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-xs">
                    {unreadCount > 9 ? '+9' : unreadCount}
                  </span>
                </span>
              </>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <NotificationsPanel
                onClose={() => setShowNotifications(false)}
                navigate={navigate}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Profile Trigger Pill matching the Sidebar */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfile((p) => !p);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-1.5 pr-2.5 shadow-2xs transition hover:bg-white hover:border-slate-300"
          >
            {/* Avatar matching sidebar gradient */}
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-500 text-white font-bold text-[10px] shadow-2xs">
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            <div className="hidden text-right leading-tight sm:block">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900">
                  {admin?.name || admin?.username || 'المسؤول'}
                </span>
                {admin?.username === 'drahmed' && (
                  <ShieldCheck size={11} className="shrink-0 text-sky-600" />
                )}
              </div>
              <span className="text-[9.5px] font-bold text-emerald-600">
                في الخدمة
              </span>
            </div>

            <ChevronDown
              size={12}
              className={`hidden shrink-0 text-slate-400 transition-transform duration-200 sm:block ${
                showProfile ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {showProfile && (
              <ProfilePanel
                admin={admin}
                logout={logout}
                navigate={navigate}
                onClose={() => setShowProfile(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
