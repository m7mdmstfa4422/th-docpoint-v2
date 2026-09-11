import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  CalendarCheck,
  Clock,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
  Phone,
  MessageSquare,
  ExternalLink,
  Printer,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  UserPlus,
  RefreshCw,
  User,
  Building2,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { api } from '../../api';

/* ─── Signature Clinical Gradient ─── */
const SIGNATURE_GRADIENT =
  'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)';

/* ─── Helpers ─── */
const toLocalInput = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const getPresetDateTime = (daysAhead, hours, minutes = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hours, minutes, 0, 0);
  return toLocalInput(d);
};

function getInitials(name) {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
}

function getRelativeDayBadge(dateString) {
  const target = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      label: 'اليوم',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dotColor: '#38C698',
      isToday: true,
    };
  }
  if (diffDays === 1) {
    return {
      label: 'غداً',
      color: 'bg-amber-50 text-amber-700 border-amber-200/80',
      dotColor: '#F9CB6C',
      isTomorrow: true,
    };
  }
  if (diffDays === 2) {
    return {
      label: 'بعد يومين',
      color: 'bg-sky-50 text-sky-700 border-sky-200/80',
      dotColor: '#3B66F5',
    };
  }
  if (diffDays > 2 && diffDays <= 7) {
    return {
      label: `خلال ${diffDays} أيام`,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      dotColor: '#7048E8',
    };
  }
  if (diffDays < 0) {
    return {
      label: 'موعد سابق',
      color: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dotColor: '#F54B5E',
    };
  }
  return {
    label: `خلال ${diffDays} يوم`,
    color: 'bg-slate-50 text-slate-700 border-slate-200/80',
    dotColor: '#64748B',
  };
}

export default function Appointments() {
  const navigate = useNavigate();

  /* ─── Data State ─── */
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ─── Form State ─── */
  const [patientQuery, setPatientQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointmentAt, setAppointmentAt] = useState(toLocalInput());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  /* ─── Filter & Search State ─── */
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'today' | 'tomorrow' | 'week'
  const [searchQuery, setSearchQuery] = useState('');

  /* ─── Delete Confirmation Modal State ─── */
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ─── Load Data ─── */
  const load = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [patientRows, appointmentRows] = await Promise.all([
        api('/patients', { showLoading: false }),
        api('/appointments', { showLoading: false }),
      ]);
      setPatients(Array.isArray(patientRows) ? patientRows : patientRows?.patients || []);
      setAppointments(Array.isArray(appointmentRows) ? appointmentRows : []);
    } catch (error) {
      console.error('Error loading appointments data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ─── Patient Autocomplete Filter ─── */
  const patientResults = useMemo(() => {
    const val = patientQuery.trim().toLowerCase();
    if (!val) return [];
    return patients
      .filter((p) =>
        [p.fullName, p.phone, p.nationalId].some((x) =>
          String(x || '').toLowerCase().includes(val)
        )
      )
      .slice(0, 6);
  }, [patients, patientQuery]);

  /* ─── Metric Calculations ─── */
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate()
    ).toDateString();

    let todayCount = 0;
    let tomorrowCount = 0;
    let weekCount = 0;

    appointments.forEach((appt) => {
      const d = new Date(appt.appointmentAt);
      const apptDateStr = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();

      if (apptDateStr === todayStr) todayCount++;
      if (apptDateStr === tomorrowStr) tomorrowCount++;
      weekCount++;
    });

    return {
      today: todayCount,
      tomorrow: tomorrowCount,
      week: weekCount,
      patientsCount: patients.length,
    };
  }, [appointments, patients]);

  /* ─── Filtered Appointments ─── */
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    return appointments.filter((appt) => {
      const apptDate = new Date(appt.appointmentAt);
      const dayDate = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate());

      // Filter Tab
      if (activeTab === 'today') {
        if (dayDate.getTime() !== today.getTime()) return false;
      } else if (activeTab === 'tomorrow') {
        if (dayDate.getTime() !== tomorrowDate.getTime()) return false;
      } else if (activeTab === 'week') {
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        if (dayDate < today || dayDate > sevenDaysLater) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const pName = String(appt.patient?.fullName || '').toLowerCase();
        const pPhone = String(appt.patient?.phone || '').toLowerCase();
        const pClinic = String(appt.patient?.clinic?.name || '').toLowerCase();
        const pNotes = String(appt.notes || '').toLowerCase();
        if (!pName.includes(q) && !pPhone.includes(q) && !pClinic.includes(q) && !pNotes.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, activeTab, searchQuery]);

  /* ─── Save New Appointment ─── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setSubmitting(true);
    try {
      await api('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatient._id,
          appointmentAt,
          notes,
        }),
      });

      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);

      setSelectedPatient(null);
      setPatientQuery('');
      setNotes('');
      setAppointmentAt(toLocalInput());
      await load(true);
    } catch (err) {
      alert(err.message || 'تعذر تأكيد الحجز.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Delete Appointment ─── */
  const confirmDelete = async () => {
    if (!appointmentToDelete) return;
    setIsDeleting(true);
    try {
      await api(`/appointments/${appointmentToDelete._id}`, { method: 'DELETE' });
      setAppointmentToDelete(null);
      await load(true);
    } catch (err) {
      alert(err.message || 'تعذر حذف الحجز.');
    } finally {
      setIsDeleting(false);
    }
  };

  /* ─── WhatsApp Reminder ─── */
  const sendWhatsAppReminder = (appt) => {
    const rawPhone = appt.patient?.phone || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '20' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }

    const dateObj = new Date(appt.appointmentAt);
    const dateStr = dateObj.toLocaleDateString('ar-EG', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const patientName = appt.patient?.fullName || 'عزيزي المريض';
    const clinicName = appt.patient?.clinic?.name || 'عيادة د. أحمد الرفاعي';

    const message = `مرحباً أستاذ/ة ${patientName}،\nنود تذكيركم بموعدكم القادم في ${clinicName} يوم ${dateStr} في تمام الساعة ${timeStr}.\nنسعد بحضوركم، ونتمنى لكم دوام الصحة والعافية!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <section className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8" dir="rtl">
      {/* ── Print Specific Styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-schedule, #printable-schedule * { visibility: visible; }
          #printable-schedule { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl space-y-6">
        {/* ── Hero Banner ── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/50 backdrop-blur-md md:p-8"
        >
          {/* Subtle Ambient Radial Accents */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sky-100/50 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-100/40 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                  <CalendarDays size={13} className="text-sky-600" />
                  DOCPOINT · نظام إدارة المواعيد
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#38C698] animate-pulse" />
                  مباشر
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">
                الحجوزات والمواعيد السريرية
              </h1>
              <p className="mt-1.5 text-xs text-slate-500 md:text-sm">
                متابعة وتأكيد جدول مواعيد العيادة، إرسال تذكيرات الواتساب، وحجز المواعيد الجديدة
                بسلاسة.
              </p>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => load(true)}
                disabled={refreshing}
                title="تحديث البيانات"
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin text-sky-600' : ''} />
                <span>تحديث</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                title="طباعة جدول المواعيد"
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
              >
                <Printer size={14} className="text-slate-600" />
                <span>طباعة الكشف</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/register')}
                className="inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-xs font-bold text-white shadow-sm shadow-sky-600/20 transition active:scale-95"
                style={{ background: SIGNATURE_GRADIENT }}
              >
                <UserPlus size={15} />
                <span>تسجيل مريض جديد</span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-4">
          {/* Card 1: Today */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => setActiveTab('today')}
            className={`group cursor-pointer rounded-2xl border p-4 transition-all hover:shadow-md ${
              activeTab === 'today'
                ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                : 'border-slate-200/80 bg-white/95 shadow-2xs shadow-slate-200/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">حجوزات اليوم</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <span className="h-2 w-2 rounded-full bg-[#38C698] animate-pulse" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.today}</span>
              <span className="text-[11px] font-medium text-slate-400">حالة مؤكدة</span>
            </div>
          </motion.div>

          {/* Card 2: Tomorrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setActiveTab('tomorrow')}
            className={`group cursor-pointer rounded-2xl border p-4 transition-all hover:shadow-md ${
              activeTab === 'tomorrow'
                ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                : 'border-slate-200/80 bg-white/95 shadow-2xs shadow-slate-200/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">مواعيد الغد</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.tomorrow}</span>
              <span className="text-[11px] font-medium text-slate-400">حالة قادمة</span>
            </div>
          </motion.div>

          {/* Card 3: Week */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => setActiveTab('week')}
            className={`group cursor-pointer rounded-2xl border p-4 transition-all hover:shadow-md ${
              activeTab === 'week'
                ? 'border-sky-300 bg-sky-50/40 shadow-xs'
                : 'border-slate-200/80 bg-white/95 shadow-2xs shadow-slate-200/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">خلال 7 أيام</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                <CalendarCheck size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.week}</span>
              <span className="text-[11px] font-medium text-slate-400">إجمالي الأسبوع</span>
            </div>
          </motion.div>

          {/* Card 4: Patients Base */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/search')}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40 transition-all hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">سجل المرضى</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <UserRound size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.patientsCount}</span>
              <span className="text-[11px] font-medium text-slate-400">ملف مسجل</span>
            </div>
          </motion.div>
        </div>

        {/* ── Main Two-Column Layout ── */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
          {/* ════════════ Left Column (Main): Appointments Feed ════════════ */}
          <div className="space-y-4" id="printable-schedule">
            {/* Search & Tabs Controls Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm shadow-slate-200/50 backdrop-blur-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'الكل', count: appointments.length },
                    { id: 'today', label: 'اليوم', count: stats.today },
                    { id: 'tomorrow', label: 'غداً', count: stats.tomorrow },
                    { id: 'week', label: 'خلال 7 أيام', count: stats.week },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        activeTab === tab.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                          activeTab === tab.id
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Real-time Search Input */}
                <div className="relative min-w-[220px]">
                  <Search
                    size={15}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث باسم المريض أو الهاتف..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/80 pr-9 pl-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment Cards List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white/95 p-12 text-center shadow-sm">
                <RefreshCw size={26} className="animate-spin text-sky-600" />
                <p className="mt-3 text-sm font-bold text-slate-700">جارٍ تحميل الحجوزات والمواعيد...</p>
                <p className="mt-1 text-xs text-slate-400">يرجى الانتظار لحظات</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/95 p-12 text-center shadow-2xs"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-200">
                  <CalendarDays size={26} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800">لا توجد حجوزات مطابقة</h3>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                  {searchQuery
                    ? `لم نجد أي حجز يطابق بحثك عن "${searchQuery}". جرب كلمة بحث أخرى.`
                    : activeTab === 'today'
                    ? 'لا توجد مواعيد مسجلة لليوم حتى الآن. يمكنك إضافة حجز جديد من النموذج الجانبي.'
                    : 'لا توجد مواعيد في الفترة المحددة.'}
                </p>
                {(searchQuery || activeTab !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveTab('all');
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    عرض كل الحجوزات
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredAppointments.map((appt) => {
                    const badge = getRelativeDayBadge(appt.appointmentAt);
                    const apptDate = new Date(appt.appointmentAt);
                    const dayName = apptDate.toLocaleDateString('ar-EG', { weekday: 'long' });
                    const dateFormatted = apptDate.toLocaleDateString('ar-EG', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    });
                    const timeFormatted = apptDate.toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const patientInitials = getInitials(appt.patient?.fullName);

                    return (
                      <motion.div
                        key={appt._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        layout
                        className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs shadow-slate-200/40 transition-all hover:border-sky-200 hover:shadow-md"
                      >
                        {/* Top Row: Patient Info + Relative Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-500 text-white font-black text-sm shadow-xs">
                              {patientInitials}
                            </div>

                            {/* Names and Clinic */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  to={appt.patient?._id ? `/patient-profile/${appt.patient._id}` : '#'}
                                  className="truncate text-sm font-black text-slate-900 hover:text-sky-600 hover:underline transition"
                                  title="فتح الملف الطبي للمريض"
                                >
                                  {appt.patient?.fullName || 'مريض غير مسجل'}
                                </Link>

                                {appt.patient?._id && (
                                  <Link
                                    to={`/patient-profile/${appt.patient._id}`}
                                    className="text-slate-400 hover:text-sky-600 transition"
                                    title="فتح الملف الطبي"
                                  >
                                    <ExternalLink size={12} />
                                  </Link>
                                )}
                              </div>

                              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                {appt.patient?.phone && (
                                  <span dir="ltr" className="font-semibold text-slate-600">
                                    {appt.patient.phone}
                                  </span>
                                )}
                                {appt.patient?.clinic?.name && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 font-medium text-slate-500">
                                      <Building2 size={11} className="text-sky-600" />
                                      {appt.patient.clinic.name}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Relative Day Badge */}
                          <div
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${badge.color}`}
                          >
                            <span
                              style={{ backgroundColor: badge.dotColor }}
                              className="h-1.5 w-1.5 rounded-full"
                            />
                            <span>{badge.label}</span>
                          </div>
                        </div>

                        {/* Mid Row: Appointment Schedule Highlight Box */}
                        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sky-600 border border-slate-200/80 shadow-2xs">
                              <Calendar size={15} />
                            </span>
                            <div>
                              <p className="text-xs font-black text-slate-800">
                                {dayName} · {dateFormatted}
                              </p>
                              <p className="text-[11px] font-bold text-sky-700 mt-0.5">
                                الساعة: {timeFormatted}
                              </p>
                            </div>
                          </div>

                          {/* Staff badge */}
                          {appt.createdBy?.name && (
                            <span className="text-[10.5px] font-medium text-slate-400">
                              بواسطة: <b className="text-slate-600">{appt.createdBy.name}</b>
                            </span>
                          )}
                        </div>

                        {/* Notes if present */}
                        {appt.notes && (
                          <div className="mt-2.5 rounded-xl border border-amber-100/80 bg-amber-50/50 p-2.5 text-xs text-amber-900">
                            <span className="font-bold text-amber-700">ملاحظة: </span>
                            <span>{appt.notes}</span>
                          </div>
                        )}

                        {/* Bottom Actions Row */}
                        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-2">
                            {/* WhatsApp Quick Reminder */}
                            {appt.patient?.phone && (
                              <button
                                type="button"
                                onClick={() => sendWhatsAppReminder(appt)}
                                title="إرسال تذكير واتساب بالموعد"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
                              >
                                <MessageSquare size={13} className="text-emerald-600" />
                                <span>تذكير واتساب</span>
                              </button>
                            )}

                            {/* Direct Phone Call */}
                            {appt.patient?.phone && (
                              <a
                                href={`tel:${appt.patient.phone}`}
                                title="اتصال هاتفي مباشر"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                              >
                                <Phone size={13} className="text-slate-500" />
                                <span>اتصال</span>
                              </a>
                            )}
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setAppointmentToDelete(appt)}
                            title="إلغاء / حذف الحجز"
                            className="inline-flex items-center gap-1 rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <Trash2 size={15} />
                            <span className="text-[11px] font-bold">إلغاء</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ════════════ Right Column: Booking Form Card ════════════ */}
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm shadow-slate-200/50 backdrop-blur-md md:p-6">
              {/* Form Title */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-xs"
                    style={{ background: SIGNATURE_GRADIENT }}
                  >
                    <Plus size={18} />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">حجز موعد جديد</h2>
                    <p className="text-[11px] font-medium text-slate-400">
                      تأكيد حجز لمريض مسجل بقاعدة البيانات
                    </p>
                  </div>
                </div>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline"
                >
                  <UserPlus size={12} />
                  <span>مريض جديد؟</span>
                </Link>
              </div>

              {/* Success Notification Alert */}
              <AnimatePresence>
                {formSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800"
                  >
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>تم تأكيد حجز الموعد بنجاح وإضافته للجدول!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSave} className="mt-4 space-y-4">
                {/* 1. Patient Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    المريض المستهدف <span className="text-rose-500">*</span>
                  </label>

                  {!selectedPatient ? (
                    <div className="relative">
                      <div className="relative">
                        <Search
                          size={15}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-600 pointer-events-none"
                        />
                        <input
                          type="text"
                          value={patientQuery}
                          onChange={(e) => setPatientQuery(e.target.value)}
                          placeholder="ابحث بالاسم أو رقم الهاتف..."
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/60 pr-10 pl-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                        />
                      </div>

                      {/* Dropdown Suggestions */}
                      {patientQuery.trim() && (
                        <div className="absolute z-20 mt-1.5 max-h-48 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-lg">
                          {patientResults.length > 0 ? (
                            patientResults.map((p) => (
                              <button
                                key={p._id}
                                type="button"
                                onClick={() => {
                                  setSelectedPatient(p);
                                  setPatientQuery('');
                                }}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-right text-xs transition hover:bg-sky-50"
                              >
                                <div className="min-w-0">
                                  <p className="font-black text-slate-800 truncate">{p.fullName}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {p.clinic?.name || 'عيادة عامة'}
                                  </p>
                                </div>
                                <span dir="ltr" className="text-[11px] font-semibold text-slate-500">
                                  {p.phone || '—'}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center">
                              <p className="text-xs text-slate-400">لا توجد نتائج مطابقة.</p>
                              <Link
                                to="/register"
                                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline"
                              >
                                <UserPlus size={11} />
                                اضغط هنا لتسجيل مريض جديد
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Selected Patient Chip */
                    <div className="flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50/80 p-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white font-black text-xs">
                          {getInitials(selectedPatient.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-xs text-sky-950 truncate">
                            {selectedPatient.fullName}
                          </p>
                          <p dir="ltr" className="text-[10.5px] font-semibold text-sky-700">
                            {selectedPatient.phone || 'بدون هاتف'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedPatient(null)}
                        title="إلغاء وتغيير المريض"
                        className="rounded-lg p-1 text-sky-700 hover:bg-sky-100 transition"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Date & Time Picker with Quick Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      تاريخ وتوقيت الموعد <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-medium text-slate-400">اختصارات سريعة:</span>
                  </div>

                  {/* Preset Pills */}
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => setAppointmentAt(getPresetDateTime(0, 17))}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-sky-50 hover:border-sky-200 transition"
                    >
                      اليوم 05:00 م
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppointmentAt(getPresetDateTime(0, 19))}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-sky-50 hover:border-sky-200 transition"
                    >
                      اليوم 07:00 م
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppointmentAt(getPresetDateTime(1, 17))}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-sky-50 hover:border-sky-200 transition"
                    >
                      غداً 05:00 م
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppointmentAt(getPresetDateTime(1, 19))}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-sky-50 hover:border-sky-200 transition"
                    >
                      غداً 07:00 م
                    </button>
                  </div>

                  <input
                    type="datetime-local"
                    required
                    value={appointmentAt}
                    onChange={(e) => setAppointmentAt(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                {/* 3. Optional Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ملاحظات الحجز (اختياري)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: استشارة، متابعة دورية، كشف مستعجل، إلخ..."
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                {/* 4. Submit CTA */}
                <button
                  type="submit"
                  disabled={!selectedPatient || submitting}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-xs font-black text-white shadow-sm shadow-sky-600/20 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: SIGNATURE_GRADIENT }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>جارٍ الحجز...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>تأكيد موعد الحجز</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {appointmentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 mb-4">
                <AlertCircle size={24} />
              </div>

              <h3 className="text-base font-black text-slate-900">هل تريد إلغاء هذا الحجز نهائياً؟</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                سيتم حذف موعد المريض{' '}
                <b className="text-slate-800">
                  "{appointmentToDelete.patient?.fullName || 'المريض'}"
                </b>{' '}
                المحدد بتاريخ{' '}
                <b className="text-slate-800">
                  {new Date(appointmentToDelete.appointmentAt).toLocaleString('ar-EG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </b>
                . لا يمكن التراجع عن هذه العملية بعد التأكيد.
              </p>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAppointmentToDelete(null)}
                  disabled={isDeleting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
                >
                  {isDeleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>نعم، إلغاء الحجز</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
