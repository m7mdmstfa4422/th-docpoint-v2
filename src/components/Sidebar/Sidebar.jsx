import { useContext, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthContext } from '../../AuthProvider';
import { SubscriptionContext } from '../../SubscriptionProvider';
import { useSidebarStats, formatBadgeCount } from '../../useSidebarStats';
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  FileBarChart2,
  LayoutDashboard,
  Pill,
  Settings,
  Terminal,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  X,
  ArrowUpRight,
} from 'lucide-react';

/* ─── Navigation Configuration with Live Stat Keys ─── */
const NAV_SECTIONS = [
  {
    id: 'navigation',
    label: 'NAVIGATION',
    items: [
      { name: 'لوحة التحكم', path: '/', icon: LayoutDashboard },
      { name: 'الحجوزات والمواعيد', path: '/appointments', icon: CalendarDays, statKey: 'appointments', badgeColor: '#F9CB6C' },
      { name: 'سجل وملفات المرضى', path: '/search', icon: Users, statKey: 'patients', badgeColor: '#38C698' },
      { name: 'تسجيل مريض جديد', path: '/register', icon: UserPlus },
    ],
  },

  {
    id: 'management',
    label: 'MANAGEMENT',
    restricted: true,
    items: [
      { name: 'لوحة الحسابات والمالية', path: '/finance', icon: CreditCard },
      { name: 'الإحصائيات السريرية', path: '/reports', icon: BarChart3, statKey: 'reports', badgeColor: '#3B66F5', restricted: true },
      { name: 'المديونيات والأموال', path: '/Indebtedness', icon: Wallet, statKey: 'debts', badgeColor: '#FBA774' },
      { name: 'إعدادات العيادة', path: '/settings', icon: Settings },
    ],
  },
  {
    id: 'dev',
    label: 'DEVELOPER',
    devOnly: true,
    items: [
      { name: 'Developer Console', path: '/developer', icon: Terminal },
    ],
  },
];

/* ─── Helper Functions ─── */
function getInitials(name) {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
}

/* ─── Single Nav Item ─── */
function NavItem({
  name,
  path,
  icon: Icon,
  statKey,
  badgeColor = '#3B66F5',
  collapsed,
  onClose,
  stats,
  statsLoading,
}) {
  const rawCount = statKey ? stats[statKey] : null;
  const formattedBadge = statKey ? formatBadgeCount(rawCount) : null;
  const hasBadge = Boolean(formattedBadge);
  const isLoading = statsLoading && Boolean(statKey) && (rawCount === null || rawCount === undefined);

  return (
    <NavLink
      end={path === '/'}
      to={path}
      onClick={onClose}
      title={name}
      className={({ isActive }) =>
        `group relative flex items-center rounded-2xl py-2.5 transition-all duration-200 select-none ${collapsed ? 'justify-center px-2' : 'gap-3.5 px-3.5'
        } ${isActive
          ? 'font-bold text-slate-900 bg-slate-100/80 shadow-2xs'
          : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active subtle sliding indicator */}
          {isActive && (
            <motion.span
              layoutId="navItemActiveHighlight"
              className="absolute inset-0 rounded-2xl bg-slate-100/90"
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            />
          )}

          {/* Icon Container with relative positioning for the Micro-Dot */}
          <span className="relative z-10 flex shrink-0 items-center justify-center">
            <Icon
              size={19}
              strokeWidth={isActive ? 2.2 : 1.8}
              className={`transition-colors duration-200 ${isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'
                }`}
            />

            {/* Collapsed Mode Micro-Dot / Loading dot */}
            {collapsed && (
              <>
                {isLoading ? (
                  <span className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-slate-300 animate-pulse ring-2 ring-white" />
                ) : (
                  hasBadge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{ backgroundColor: badgeColor }}
                      className="absolute -top-1 -left-1 h-2 w-2 rounded-full ring-2 ring-white shadow-2xs"
                    />
                  )
                )}
              </>
            )}
          </span>

          {/* Nav Label (visible in Expanded mode) */}
          {!collapsed && (
            <span
              className={`relative z-10 flex-1 truncate text-[13px] tracking-tight ${isActive ? 'font-bold text-slate-900' : 'text-slate-600 group-hover:text-slate-900'
                }`}
            >
              {name}
            </span>
          )}

          {/* Expanded Mode Dynamic Badge Pill or Skeleton */}
          {!collapsed && (
            <>
              {isLoading ? (
                <span className="relative z-10 h-4 w-6 rounded-xl bg-slate-200/80 animate-pulse shrink-0" />
              ) : (
                hasBadge && (
                  <motion.span
                    key={formattedBadge}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    style={{ backgroundColor: badgeColor }}
                    className="relative z-10 shrink-0 rounded-xl px-2 py-0.5 text-[10.5px] font-black text-white shadow-2xs tracking-wide"
                  >
                    {formattedBadge}
                  </motion.span>
                )
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  );
}

/* ─── Section Group Component ─── */
function NavSection({ label, items, collapsed, onClose, stats, statsLoading }) {
  return (
    <div className="space-y-1">
      {/* Section Header (hidden in collapsed mode) */}
      {!collapsed && (
        <p className="mb-2 px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
          {label}
        </p>
      )}

      {items.map((item) => (
        <NavItem
          key={item.path}
          {...item}
          collapsed={collapsed}
          onClose={onClose}
          stats={stats}
          statsLoading={statsLoading}
        />
      ))}
    </div>
  );
}

/* ─── Subscription Status & Progress Widget ─── */
function SubscriptionWidget({ subscription, collapsed }) {
  if (!subscription) return null;

  const now = new Date();
  const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt) : null;
  const isExpired = !subscription.active || !expiresAt || expiresAt <= now;

  let diffDays = 0;
  let remainingText = 'منتهي';
  let percent = 0;

  if (!isExpired && expiresAt) {
    const diffMs = expiresAt.getTime() - now.getTime();
    diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    // Calculate percentage based on total period (e.g. 6 months = 180 days standard, or from renewedAt/createdAt)
    const startDate = subscription.renewedAt
      ? new Date(subscription.renewedAt)
      : subscription.createdAt
        ? new Date(subscription.createdAt)
        : new Date(expiresAt.getTime() - 180 * 24 * 60 * 60 * 1000);

    const totalMs = Math.max(1, expiresAt.getTime() - startDate.getTime());
    percent = Math.min(100, Math.max(0, Math.round((diffMs / totalMs) * 100)));

    // Remaining text in Arabic
    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      remainingText = `متبقي ${months} شهر ${days > 0 ? `و ${days} يوم` : ''}`;
    } else if (diffDays > 2) {
      remainingText = `متبقي ${diffDays} يوم`;
    } else if (diffDays === 2) {
      remainingText = 'متبقي يومان';
    } else if (diffDays === 1) {
      remainingText = 'متبقي يوم واحد';
    } else {
      remainingText = 'ينتهي اليوم';
    }
  }

  // Color scheme:
  // > 30 days: Mint Emerald (#38C698)
  // 8 - 30 days: Warm Amber (#F9CB6C)
  // <= 7 days or expired: Vibrant Rose (#F54B5E)
  const statusColor = isExpired
    ? '#F54B5E'
    : diffDays > 30
      ? '#4e3ff7'
      : diffDays > 7
        ? '#4e3ff7'
        : '#F54B5E';

  if (collapsed) {
    return (
      <div className="mb-2.5 hidden lg:flex justify-center">
        <NavLink
          to="/settings"
          title={`اشتراك العيادة: ${remainingText} (${percent}% متبقي)`}
          className="group relative flex h-10 w-10 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/90 p-1 transition hover:bg-slate-100 hover:shadow-xs"
        >
          <span
            style={{ backgroundColor: statusColor }}
            className={`h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-2xs ${!isExpired ? 'animate-pulse' : ''
              }`}
          />
          <div className="mt-1 h-1 w-6 overflow-hidden rounded-full bg-slate-200">
            <div
              style={{ width: `${percent}%`, backgroundColor: statusColor }}
              className="h-full rounded-full transition-all duration-500"
            />
          </div>
        </NavLink>
      </div>
    );
  }

  return (
    <div className="mb-2.5 rounded-2xl border border-slate-100/90 bg-slate-50/80 p-3 shadow-2xs transition-all hover:bg-slate-50">
      {/* Header row: status dot + title + remaining time text */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            style={{ backgroundColor: statusColor }}
            className={`h-2 w-2 shrink-0 rounded-full ring-2 ring-white shadow-2xs ${!isExpired ? 'animate-pulse' : ''
              }`}
          />
          <span className="truncate text-[11px] font-bold text-slate-700">
            اشتراك العيادة
          </span>
        </div>

        <span
          style={{ color: statusColor }}
          className="shrink-0 text-[11px] font-extrabold tracking-tight"
        >
          {remainingText}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 p-0.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ backgroundColor: statusColor }}
          className="h-full rounded-full shadow-xs transition-all duration-500"
        />
      </div>

      {/* Bottom info: Percentage and Renew link */}
      <div className="mt-2 flex items-center justify-between text-[10.5px] font-medium text-slate-400">
        <span>{isExpired ? 'اشتراك غير نشط' : `${percent}% متبقي`}</span>
        <a
          href="https://wa.me/201003154481"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-bold text-sky-600 transition hover:text-sky-800 hover:underline"
        >
          <span>{isExpired ? 'تفعيل الآن' : 'تجديد'}</span>
          <ArrowUpRight size={11} />
        </a>
      </div>
    </div>
  );
}

/* ─── Main Sidebar Component ─── */
export default function Sidebar({
  open,
  onClose,
  collapsed = false,
  onToggleCollapse,
}) {
  const { admin, logout } = useContext(AuthContext);
  const { subscription } = useContext(SubscriptionContext);
  const { counts: stats, loading: statsLoading } = useSidebarStats();
  const sidebarRef = useRef(null);

  const isAllowed = admin?.username === 'drahmed' || admin?.role === 'developer';
  const isDev = admin?.role === 'developer';

  const roleLabel =
    admin?.role === 'developer'
      ? 'مطوّر النظام'
      : admin?.username === 'drahmed'
        ? 'طبيب أخصائي'
        : 'موظف استقبال';

  const initials = getInitials(admin?.name || admin?.username);

  /* Close on Escape key on mobile */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* Filter navigation based on role */
  const visibleSections = NAV_SECTIONS
    .filter((s) => {
      if (s.devOnly) return isDev;
      if (s.restricted) return isAllowed;
      return true;
    })
    .map((s) => ({
      ...s,
      items: s.items.filter((item) => (item.restricted ? isAllowed : true)),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <>
      {/* ── Frosted Backdrop on Mobile/Tablet ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Main Sidebar Panel (Floating Pill Architecture) ── */}
      <aside
        ref={sidebarRef}
        dir="rtl"
        aria-label="القائمة الرئيسية"
        className={`
          fixed z-50 flex flex-col justify-between
          bg-white shadow-xl shadow-slate-200/60
          border border-slate-100
          transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]

          /* Mobile behavior: off-canvas drawer */
          inset-y-0 right-0 w-72 rounded-l-[32px] rounded-r-none
          lg:rounded-[32px] lg:inset-y-3 lg:right-3 lg:my-auto lg:h-[calc(100vh-1.5rem)]
          ${open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}

          /* Desktop widths: Expanded vs Collapsed */
          ${collapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        {/* ── Top Header Section ── */}
        <div className={`shrink-0 p-5 ${collapsed ? 'text-center px-2' : ''}`}>
          <div className="flex items-center justify-between">
            {/* Expanded: Brand Name */}
            {!collapsed && (
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-black tracking-tight text-slate-900">
                  DocPoint
                </h1>
              </div>
            )}

            {/* Desktop 2-Bar / Minimal Menu Toggle Button */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title={collapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
                className={`hidden lg:flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition active:scale-95 ${collapsed ? 'mx-auto' : ''
                  }`}
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
              </button>
            )}

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition lg:hidden"
            >
              <X size={17} />
            </button>
          </div>

          {/* Collapsed Mode Short Brand Initials */}
          {collapsed && (
            <div className="mt-3 hidden lg:block text-center">
              <span className="text-sm font-black tracking-tighter text-slate-900">
                Dp.
              </span>
            </div>
          )}
        </div>

        {/* ── Navigation Links Scrollable Area ── */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-6">
            {visibleSections.map((section) => (
              <NavSection
                key={section.id}
                label={section.label}
                items={section.items}
                collapsed={collapsed}
                onClose={onClose}
                stats={stats}
                statsLoading={statsLoading}
              />
            ))}
          </div>
        </nav>

        {/* ── Footer: Encapsulated User Profile Card ── */}
        <div className={`shrink-0 p-3.5 ${collapsed ? 'px-2 pb-4 text-center' : ''}`}>
          <SubscriptionWidget subscription={subscription} collapsed={collapsed} />

          {!collapsed ? (
            /* Expanded Profile Card */
            <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Avatar with gradient */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-500 text-white font-bold text-xs shadow-xs">
                  {initials}
                </div>

                {/* User Info */}
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                    {admin?.name || admin?.username || 'د. أحمد الرفاعي'}
                  </p>
                  <p className="truncate text-[10.5px] font-medium text-slate-400 mt-0.5">
                    {admin?.username ? `${admin.username}@clinic.com` : roleLabel}
                  </p>
                </div>
              </div>

              {/* Action Button (Logout) */}
              {logout && (
                <button
                  type="button"
                  onClick={logout}
                  title="تسجيل الخروج"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition shadow-2xs"
                >
                  <ChevronLeft size={13} />
                </button>
              )}
            </div>
          ) : (
            /* Collapsed Avatar Circle */
            <div className="hidden lg:flex justify-center">
              <button
                type="button"
                onClick={logout}
                title="الملف الشخصي / تسجيل الخروج"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-500 text-white font-bold text-xs shadow-sm hover:scale-105 hover:ring-2 hover:ring-sky-300 transition"
              >
                {initials}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
