import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Search,
  FileText,
  Activity,
  DollarSign,
  ChevronLeft,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Phone,
  MessageSquare,
  ArrowUpRight
} from 'lucide-react';
import { AuthContext } from '../../AuthProvider';
import { api } from '../../api';

// Skeleton Loader Component
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
          <div className="h-12 w-12 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-3 w-32 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
          <div className="h-10 w-10 bg-slate-100 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 bg-slate-200 rounded" />
            <div className="h-3 w-64 bg-slate-100 rounded" />
          </div>
          <div className="h-6 w-16 bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Empty State Component
function EmptyState({ icon: Icon, title, description, actionText, actionLink }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-4 max-w-sm">{description}</p>
      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:brightness-105"
          style={{
            background: 'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
          }}
        >
          <span>{actionText}</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
    </motion.div>
  );
}

// Metric Card Component
function MetricCard({ title, value, trend, icon: Icon, iconBg, iconColor, link, loading }) {
  if (loading) return <SkeletonCard />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={link}
        className="block rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 transition-all hover:border-sky-300 hover:shadow-md hover:shadow-sky-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 mb-2">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{value}</span>
              {trend !== null && (
                <span
                  className={`flex items-center gap-1 text-xs font-bold ${
                    trend >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {trend >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600">
          <span>عرض التفاصيل</span>
          <ChevronLeft className="h-3.5 w-3.5" />
        </div>
      </Link>
    </motion.div>
  );
}

// Quick Action Button
function QuickAction({ title, subtitle, icon: Icon, link, onClick, gradient = false }) {
  const Component = link ? Link : 'button';
  const props = link ? { to: link } : { onClick, type: 'button' };

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Component
        {...props}
        className={`block w-full rounded-2xl p-6 text-right shadow-md transition-all hover:shadow-lg ${
          gradient
            ? 'text-white'
            : 'bg-white border border-slate-200/80 hover:border-sky-300'
        }`}
        style={
          gradient
            ? {
                background:
                  'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
              }
            : {}
        }
      >
        <Icon className={`h-6 w-6 mb-4 ${gradient ? 'text-white' : 'text-sky-600'}`} />
        <h3 className={`text-base font-bold mb-1 ${gradient ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h3>
        <p className={`text-xs ${gradient ? 'text-sky-50' : 'text-slate-500'}`}>{subtitle}</p>
        <div
          className={`flex items-center gap-1.5 mt-4 text-xs font-bold ${
            gradient ? 'text-white' : 'text-sky-600'
          }`}
        >
          <span>الانتقال</span>
          <ChevronLeft className="h-3.5 w-3.5" />
        </div>
      </Component>
    </motion.div>
  );
}

// Appointment Row Component
function AppointmentRow({ appointment }) {
  const navigate = useNavigate();
  const appointmentDate = new Date(appointment.appointmentAt);
  const isToday =
    appointmentDate.toDateString() === new Date().toDateString();

  const handlePatientClick = () => {
    if (appointment.patient?._id) {
      navigate(`/patient-profile/${appointment.patient._id}`);
    }
  };

  const handleCall = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleWhatsApp = (phone) => {
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50/50 transition-colors group"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          isToday ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'
        }`}
      >
        <Calendar className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <button
          onClick={handlePatientClick}
          className="text-sm font-bold text-slate-900 hover:text-sky-600 transition-colors text-right"
          disabled={!appointment.patient?._id}
        >
          {appointment.patient?.fullName || 'مريض محذوف'}
        </button>
        <p className="text-xs text-slate-500 mt-1">
          <span className="font-semibold text-sky-700">
            {appointmentDate.toLocaleDateString('ar-EG', { weekday: 'long' })}
          </span>
          {' · '}
          {appointmentDate.toLocaleString('ar-EG', {
            dateStyle: 'medium',
            timeStyle: 'short'
          })}
        </p>
        {appointment.notes && (
          <p className="text-xs text-slate-400 mt-1 truncate">{appointment.notes}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {appointment.patient?.phone && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCall(appointment.patient.phone)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
              title="اتصال"
            >
              <Phone className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleWhatsApp(appointment.patient.phone)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
              title="واتساب"
            >
              <MessageSquare className="h-4 w-4" />
            </motion.button>
          </>
        )}
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isToday
              ? 'bg-sky-50 text-sky-700 border border-sky-200'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isToday ? 'اليوم' : 'قادم'}
        </span>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { admin } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    todayAppointments: 0,
    activePatients: 0,
    waitingQueue: 0,
    todayRevenue: 0,
    recentAppointments: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Fetch all data in parallel
        const [patients, allAppointments, sidebarCounts] = await Promise.all([
          api('/patients', { showLoading: false }),
          api(
            `/appointments?from=${startOfDay.toISOString()}&to=${weekFromNow.toISOString()}`,
            { showLoading: false }
          ),
          api('/sidebar-counts', { showLoading: false }).catch(() => ({
            todayAppointments: 0,
            waitingPatients: 0
          }))
        ]);

        // Calculate metrics
        const todayAppointments = allAppointments.filter((apt) => {
          const aptDate = new Date(apt.appointmentAt);
          return aptDate >= startOfDay && aptDate <= endOfDay;
        });

        setDashboardData({
          todayAppointments: todayAppointments.length,
          activePatients: patients.length,
          waitingQueue: sidebarCounts.waitingPatients || 0,
          todayRevenue: 0, // This would need to be calculated from visits
          recentAppointments: allAppointments.slice(0, 8)
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 text-slate-800 md:p-8" dir="rtl">
      <motion.div
        className="mx-auto max-w-7xl space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Header */}
        <motion.header
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 md:p-8"
        >
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              لوحة التحكم الرئيسية
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">
              أهلاً {admin?.name || admin?.username}
            </h1>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl">
              نظرة شاملة على نشاط العيادة اليوم والمرضى والمواعيد القادمة
            </p>
          </div>
        </motion.header>

        {/* Key Metrics */}
        <motion.div
          variants={itemVariants}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <MetricCard
            title="مواعيد اليوم"
            value={loading ? '...' : dashboardData.todayAppointments}
            trend={null}
            icon={Calendar}
            iconBg="bg-sky-50"
            iconColor="text-sky-700"
            link="/appointments"
            loading={loading}
          />
          <MetricCard
            title="إجمالي المرضى"
            value={loading ? '...' : dashboardData.activePatients}
            trend={null}
            icon={Users}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-700"
            link="/search"
            loading={loading}
          />
          <MetricCard
            title="قائمة الانتظار"
            value={loading ? '...' : dashboardData.waitingQueue}
            trend={null}
            icon={Clock}
            iconBg="bg-amber-50"
            iconColor="text-amber-700"
            link="/search"
            loading={loading}
          />
          <MetricCard
            title="النشاط الطبي"
            value={loading ? '...' : dashboardData.todayAppointments}
            trend={null}
            icon={Activity}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-700"
            link="/reports"
            loading={loading}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">إجراءات سريعة</h2>
            <p className="text-xs text-slate-500 mt-1">
              اختصارات للعمليات الأكثر استخداماً
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              title="تسجيل مريض جديد"
              subtitle="إضافة ملف طبي جديد"
              icon={UserPlus}
              link="/register"
              gradient
            />
            <QuickAction
              title="حجز موعد"
              subtitle="إنشاء موعد جديد"
              icon={Calendar}
              link="/appointments"
            />
            <QuickAction
              title="البحث في السجلات"
              subtitle="الوصول السريع للمرضى"
              icon={Search}
              link="/search"
            />
            <QuickAction
              title="التقارير المالية"
              subtitle="ملخص الإيرادات"
              icon={FileText}
              link="/finance"
            />
          </div>
        </motion.div>

        {/* Today's Schedule */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50 overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                جدول المواعيد القادمة
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                المواعيد المحجوزة خلال الأسبوع القادم
              </p>
            </div>
            <Stethoscope className="h-5 w-5 text-sky-600" />
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-6">
                <SkeletonTable />
              </div>
            ) : dashboardData.recentAppointments.length > 0 ? (
              <>
                {dashboardData.recentAppointments.map((appointment) => (
                  <AppointmentRow key={appointment._id} appointment={appointment} />
                ))}
                {dashboardData.recentAppointments.length >= 8 && (
                  <div className="p-4 text-center">
                    <Link
                      to="/appointments"
                      className="inline-flex items-center gap-2 text-sm font-bold text-sky-600 hover:text-sky-700"
                    >
                      <span>عرض جميع المواعيد</span>
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={Calendar}
                title="لا توجد مواعيد قادمة"
                description="لا توجد مواعيد محجوزة خلال الأسبوع القادم. ابدأ بإنشاء موعد جديد."
                actionText="حجز موعد جديد"
                actionLink="/appointments"
              />
            )}
          </div>
        </motion.div>

        {/* System Status Indicator */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-900">
                النظام يعمل بشكل طبيعي
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                جميع الخدمات متصلة ومتزامنة
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>متصل</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
