import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthContext } from '../../AuthProvider';
import { SubscriptionContext } from '../../SubscriptionProvider';
import img from '../../assets/logo.png';
import {
  CalendarDays,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';

const sidebarItems = [
  { name: 'الرئيسية', path: '/', icon: LayoutDashboard },
  { name: 'المرضى', path: '/search', icon: Users },
  { name: 'إضافة مريض', path: '/register', icon: UserPlus },
  { name: 'الحجوزات', path: '/appointments', icon: CalendarDays },
  { name: 'التقارير', path: '/reports', icon: FileText },
  { name: 'الحسابات', path: '/finance', icon: Wallet },
  { name: 'الإعدادات', path: '/settings', icon: Settings },
  { name: 'Developer', path: '/developer', icon: Terminal, developerOnly: true },
];

export default function Sidebar({ open, onClose }) {
  const { admin, logout } = useContext(AuthContext);
  const { subscription } = useContext(SubscriptionContext);

  const allowed = admin?.username === 'drahmed' || admin?.role === 'developer';
  const visibleItems = sidebarItems.filter(
    (item) =>
      (!item.developerOnly || admin?.role === 'developer') &&
      (!['/finance', '/reports', '/settings'].includes(item.path) || allowed)
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        dir="rtl"
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col justify-between border-l border-sky-100/80 bg-white/90 p-5 shadow-2xl shadow-sky-950/5 backdrop-blur-2xl transition-transform duration-300 ease-out lg:w-64 lg:translate-x-0 lg:shadow-none ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* الترويسة بالتدرج اللوني الجديد وحجم الشعار المعدل */}
          <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white px-4 py-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 p-1.5 shadow-md shadow-sky-500/20">
                  <img
                    src={img}
                    alt="DocPoint logo"
                    className="h-full w-full object-contain drop-shadow-sm"
                  />
                </div>
                <div>
                  <h1 className="text-base font-black tracking-tight text-slate-900">DocPoint</h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700">
                    <Sparkles size={12} className="text-sky-600" />
                    نظام طبي ذكي
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 lg:hidden"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* قائمة الروابط */}
          <nav className="space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-black tracking-[0.12em] text-slate-400">
              القائمة الرئيسية
            </div>
            {visibleItems.map(({ name, path, icon: Icon }) => (
              <NavLink
                end={path === '/'}
                key={path}
                to={path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center justify-between overflow-hidden rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-l from-sky-900 to-sky-400 text-white shadow-md shadow-sky-500/25'
                      : 'text-slate-600 hover:bg-gradient-to-l hover:from-sky-900 hover:to-cyan-200 hover:text-white hover:shadow-md hover:shadow-sky-500/20'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100/80 text-slate-500 group-hover:bg-white/20 group-hover:text-white'
                        }`}
                      >
                        <Icon size={17} className="stroke-[2.2]" />
                      </div>
                      <span className="text-[13px] font-bold">{name}</span>
                    </div>

                    <ChevronLeft
                      size={15}
                      className={`transition-transform duration-200 ${
                        isActive
                          ? 'text-white -translate-x-0.5'
                          : 'opacity-0 -translate-x-2 text-slate-400 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-white'
                      }`}
                    />

                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-0 top-1.5 bottom-1.5 w-1 rounded-l-full bg-cyan-200"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* أسفل القائمة: المستخدم وحالة الاشتراك */}
        <div className="shrink-0 space-y-2.5 border-t border-sky-100 pt-4">
          <div className="rounded-3xl border border-sky-100/80 bg-slate-50/70 p-3.5 shadow-sm shadow-sky-950/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-100/60 font-bold text-sky-800">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-slate-900">
                    {admin?.name || admin?.username || 'المسؤول'}
                  </div>
                  <div className="truncate text-[10px] text-slate-400" dir="ltr">
                    @{admin?.username || 'admin'}
                  </div>
                </div>
              </div>

              {logout && (
                <button
                  type="button"
                  onClick={logout}
                  title="تسجيل الخروج"
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-sky-100/70 pt-2 text-[11px]">
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                متصل بالسحابة
              </span>
              <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-sky-700 shadow-2xs">
                V 2.0
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/70 px-2.5 py-1.5 text-[10px]">
              <span className="font-semibold text-amber-800">انتهاء الاشتراك:</span>
              <span className="font-mono font-bold text-amber-800" dir="ltr">
                {subscription?.expiresAt
                  ? new Date(subscription.expiresAt).toLocaleDateString('ar-EG')
                  : 'جارٍ التحقق...'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
