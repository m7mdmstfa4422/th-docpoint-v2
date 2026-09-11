import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpLeft,
  Building2,
  Calendar,
  ChevronDown,
  ExternalLink,
  FileText,
  Filter,
  LayoutGrid,
  List,
  MessageSquare,
  Phone,
  Printer,
  RefreshCw,
  Search,
  SlidersHorizontal,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { api } from '../../api';

/* ─── Signature Clinical Gradient ─── */
const SIGNATURE_GRADIENT =
  'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)';

/* ─── Helpers ─── */
function getInitials(name) {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
}

export default function PatientSearch() {
  const navigate = useNavigate();

  /* ─── Data State ─── */
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  /* ─── Filter & Display State ─── */
  const [genderFilter, setGenderFilter] = useState('all'); // 'all' | 'ذكر' | 'أنثى'
  const [clinicFilter, setClinicFilter] = useState('all'); // 'all' | clinicId
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'name' | 'age'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  /* ─── Load Patients & Clinics ─── */
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [patientsRes, clinicsRes] = await Promise.all([
        api('/patients', { showLoading: false }),
        api('/clinics', { showLoading: false }).catch(() => []),
      ]);

      setPatients(Array.isArray(patientsRes) ? patientsRes : patientsRes?.patients || []);
      setClinics(Array.isArray(clinicsRes) ? clinicsRes : []);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ─── Live Filter & Sort ─── */
  const filteredPatients = useMemo(() => {
    let list = [...patients];

    // Search query filter (name, phone, national ID, clinic name)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const name = String(p.fullName || '').toLowerCase();
        const phone = String(p.phone || '').toLowerCase();
        const natId = String(p.nationalId || '').toLowerCase();
        const clinicName = String(p.clinic?.name || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || natId.includes(q) || clinicName.includes(q);
      });
    }

    // Gender filter
    if (genderFilter !== 'all') {
      list = list.filter((p) => p.gender === genderFilter);
    }

    // Clinic filter
    if (clinicFilter !== 'all') {
      list = list.filter((p) => String(p.clinic?._id || p.clinic) === clinicFilter);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.fullName || '').localeCompare(b.fullName || '', 'ar');
      }
      if (sortBy === 'age') {
        return (b.age || 0) - (a.age || 0);
      }
      // newest default (createdAt)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return list;
  }, [patients, search, genderFilter, clinicFilter, sortBy]);

  /* ─── Demographic Stats ─── */
  const stats = useMemo(() => {
    const total = patients.length;
    const males = patients.filter((p) => p.gender === 'ذكر').length;
    const females = patients.filter((p) => p.gender === 'أنثى').length;
    const clinicsCount = clinics.length || new Set(patients.map((p) => p.clinic?._id || p.clinic).filter(Boolean)).size;

    return {
      total,
      males,
      females,
      malePct: total > 0 ? Math.round((males / total) * 100) : 0,
      femalePct: total > 0 ? Math.round((females / total) * 100) : 0,
      clinicsCount,
    };
  }, [patients, clinics]);

  /* ─── WhatsApp Quick Message ─── */
  const handleWhatsApp = (patient) => {
    const rawPhone = patient.phone || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '20' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }

    const patientName = patient.fullName || 'عزيزي المريض';
    const clinicName = patient.clinic?.name || 'عيادة د. أحمد الرفاعي';
    const message = `مرحباً أستاذ/ة ${patientName}،\nنتمنى لكم دوام الصحة والعافية من فريق ${clinicName}.\nنسعد دائماً بالتواصل معكم وتقديم أفضل رعاية طبية.`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <section className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8" dir="rtl">
      {/* ── Print Styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-patient-list, #printable-patient-list * { visibility: visible; }
          #printable-patient-list { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl space-y-6">
        {/* ── Hero Banner ── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/50 backdrop-blur-md md:p-8"
        >
          {/* Ambient Lighting Circles */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sky-100/50 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-100/40 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            {/* Title & Info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                  <FileText size={13} className="text-sky-600" />
                  DOCPOINT · قاعدة السجلات والملفات الطبية
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#38C698] animate-pulse" />
                  {patients.length} ملف نشط
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">
                دليل وسجلات المرضى
              </h1>
              <p className="mt-1.5 text-xs text-slate-500 md:text-sm">
                بحث فوري واستعراض شامل لقاعدة بيانات المرضى، التاريخ العلاجي، والوصول السريع
                للتواصل والملف الطبي.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => loadData(true)}
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
                title="طباعة كشف المرضى"
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
          {/* Card 1: Total Patients */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">إجمالي المرضى</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Users size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.total}</span>
              <span className="text-[11px] font-medium text-slate-400">ملف مسجل</span>
            </div>
          </motion.div>

          {/* Card 2: Males */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setGenderFilter(genderFilter === 'ذكر' ? 'all' : 'ذكر')}
            className={`cursor-pointer rounded-2xl border p-4 transition hover:shadow-sm ${
              genderFilter === 'ذكر'
                ? 'border-sky-300 bg-sky-50/40 shadow-xs'
                : 'border-slate-200/80 bg-white/95 shadow-2xs shadow-slate-200/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">المرضى الذكور</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                <User size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.males}</span>
              <span className="text-[11px] font-medium text-slate-400">({stats.malePct}%)</span>
            </div>
          </motion.div>

          {/* Card 3: Females */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => setGenderFilter(genderFilter === 'أنثى' ? 'all' : 'أنثى')}
            className={`cursor-pointer rounded-2xl border p-4 transition hover:shadow-sm ${
              genderFilter === 'أنثى'
                ? 'border-indigo-300 bg-indigo-50/40 shadow-xs'
                : 'border-slate-200/80 bg-white/95 shadow-2xs shadow-slate-200/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">المرضى الإناث</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <User size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.females}</span>
              <span className="text-[11px] font-medium text-slate-400">({stats.femalePct}%)</span>
            </div>
          </motion.div>

          {/* Card 4: Clinics */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">الفروع والعيادات</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Building2 size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.clinicsCount}</span>
              <span className="text-[11px] font-medium text-slate-400">عيادة نشطة</span>
            </div>
          </motion.div>
        </div>

        {/* ── Search & Filter Control Center ── */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm shadow-slate-200/50 backdrop-blur-md space-y-3.5">
          {/* Top Line: Search Bar + View Mode */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-600 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم، رقم الهاتف، الرقم القومي، أو العيادة..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/60 pr-10 pl-10 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  title="مسح البحث"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="عرض شبكة الكروت"
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-sky-600 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="عرض الجدول السريري"
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  viewMode === 'table'
                    ? 'bg-white text-sky-600 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Bottom Line: Filters & Sorting */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            {/* Gender Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 ml-1">النوع:</span>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'ذكر', label: 'ذكور' },
                { id: 'أنثى', label: 'إناث' },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGenderFilter(g.id)}
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                    genderFilter === g.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Clinic Filter & Sort Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Clinic Dropdown */}
              {clinics.length > 0 && (
                <div className="relative">
                  <select
                    value={clinicFilter}
                    onChange={(e) => setClinicFilter(e.target.value)}
                    className="h-8 rounded-xl border border-slate-200 bg-white pr-2.5 pl-7 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-sky-500"
                  >
                    <option value="all">كل العيادات</option>
                    {clinics.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              )}

              {/* Sort By Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-8 rounded-xl border border-slate-200 bg-white pr-2.5 pl-7 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-sky-500"
                >
                  <option value="newest">الأحدث تسجيلاً</option>
                  <option value="name">أبجدياً (أ - ي)</option>
                  <option value="age">حسب العمر (الأكبر)</option>
                </select>
                <ChevronDown
                  size={12}
                  className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {/* Reset Filters */}
              {(genderFilter !== 'all' || clinicFilter !== 'all' || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setGenderFilter('all');
                    setClinicFilter('all');
                    setSearch('');
                  }}
                  className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                >
                  <X size={12} />
                  <span>إلغاء التصفية</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Patient List / Grid Section ── */}
        <section id="printable-patient-list">
          {/* Section Subheader */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">سجلات المرضى</h2>
              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 border border-sky-100">
                {filteredPatients.length} نتيجة
              </span>
            </div>

            <p className="hidden sm:block text-xs text-slate-400">
              اضغط على البطاقة أو الزر لعرض السجل الطبي ومتابعة الزيارات.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white/95 p-16 text-center shadow-sm">
              <RefreshCw size={28} className="animate-spin text-sky-600" />
              <p className="mt-3 text-sm font-bold text-slate-700">جارٍ تحميل سجلات المرضى...</p>
              <p className="mt-1 text-xs text-slate-400">يرجى الانتظار لحظات</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/95 p-16 text-center shadow-2xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-200">
                <Users size={26} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-800">لا توجد سجلات مطابقة</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                {search
                  ? `لم نجد أي مريض يطابق بحثك عن "${search}". تأكد من صحة الاسم أو رقم الهاتف.`
                  : 'لا يوجد أي مريض مسجل في هذا التصنيف حالياً.'}
              </p>
              <div className="mt-5 flex items-center gap-3">
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    مسح البحث
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                  style={{ background: SIGNATURE_GRADIENT }}
                >
                  تسجيل مريض جديد
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* ─── Grid View ─── */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredPatients.map((patient) => {
                  const initials = getInitials(patient.fullName);
                  const isFemale = patient.gender === 'أنثى';

                  return (
                    <motion.div
                      key={patient._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      layout
                      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs shadow-slate-200/40 transition-all hover:border-sky-200 hover:shadow-md"
                    >
                      <div>
                        {/* Top: Avatar + Name + Link */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white font-black text-sm shadow-xs ${
                                isFemale
                                  ? 'bg-gradient-to-tr from-rose-500 via-indigo-500 to-sky-500'
                                  : 'bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-500'
                              }`}
                            >
                              {initials}
                            </div>

                            {/* Name & Subtitle */}
                            <div className="min-w-0">
                              <Link
                                to={`/patient-profile/${patient._id}`}
                                className="truncate text-sm font-black text-slate-900 hover:text-sky-600 hover:underline transition block"
                                title="فتح السجل الطبي للمريض"
                              >
                                {patient.fullName || 'مريض بدون اسم'}
                              </Link>

                              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                                <span className="font-semibold text-slate-600">
                                  {patient.gender || 'غير محدد'}
                                </span>
                                {patient.age !== undefined && (
                                  <>
                                    <span>•</span>
                                    <span>{patient.age} سنة</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Arrow to Profile */}
                          <Link
                            to={`/patient-profile/${patient._id}`}
                            title="فتح الملف الطبي"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-600 transition"
                          >
                            <ArrowUpLeft size={16} />
                          </Link>
                        </div>

                        {/* Mid Meta Info Pills */}
                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                          {/* Phone */}
                          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 min-w-0">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <Phone size={11} className="text-sky-600" />
                              الهاتف
                            </span>
                            <p
                              dir="ltr"
                              className="mt-0.5 truncate text-xs font-bold text-slate-800"
                            >
                              {patient.phone || '—'}
                            </p>
                          </div>

                          {/* Clinic */}
                          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 min-w-0">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <Building2 size={11} className="text-sky-600" />
                              العيادة
                            </span>
                            <p className="mt-0.5 truncate text-xs font-bold text-slate-800">
                              {patient.clinic?.name || 'عيادة عامة'}
                            </p>
                          </div>
                        </div>

                        {/* National ID / Note if present */}
                        {patient.nationalId && (
                          <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5 text-[10.5px] text-slate-500">
                            <span>الرقم القومي:</span>
                            <span dir="ltr" className="font-mono font-bold text-slate-700">
                              {patient.nationalId}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Actions Row */}
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {/* WhatsApp Button */}
                            {patient.phone && (
                              <button
                                type="button"
                                onClick={() => handleWhatsApp(patient)}
                                title="مراسلة واتساب"
                                className="flex h-8 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
                              >
                                <MessageSquare size={13} className="text-emerald-600" />
                                <span>واتساب</span>
                              </button>
                            )}

                            {/* Call Button */}
                            {patient.phone && (
                              <a
                                href={`tel:${patient.phone}`}
                                title="اتصال هاتفي"
                                className="flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                              >
                                <Phone size={13} className="text-slate-500" />
                              </a>
                            )}
                          </div>

                          {/* Open Profile CTA */}
                          <Link
                            to={`/patient-profile/${patient._id}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white shadow-2xs transition active:scale-95"
                            style={{ background: SIGNATURE_GRADIENT }}
                          >
                            <span>الملف الطبي</span>
                            <ArrowUpLeft size={13} />
                          </Link>
                        </div>

                        {/* Created By Footer */}
                        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <UserCheck size={11} className="text-sky-600" />
                            <span>
                              سُجل بواسطة:{' '}
                              <b className="text-slate-600">
                                {patient.createdBy?.name || patient.createdBy?.username || 'سجل عام'}
                              </b>
                            </span>
                          </span>

                          {patient.createdAt && (
                            <span>
                              {new Date(patient.createdAt).toLocaleDateString('ar-EG', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            /* ─── Table View ─── */
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-2xs shadow-slate-200/40">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
                    <tr>
                      <th className="p-4 font-bold">المريض</th>
                      <th className="p-4 font-bold">الهاتف</th>
                      <th className="p-4 font-bold">النوع / العمر</th>
                      <th className="p-4 font-bold">العيادة</th>
                      <th className="p-4 font-bold">أضيف بواسطة</th>
                      <th className="p-4 font-bold text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.map((patient) => {
                      const initials = getInitials(patient.fullName);
                      const isFemale = patient.gender === 'أنثى';

                      return (
                        <tr
                          key={patient._id}
                          className="transition hover:bg-sky-50/40 group"
                        >
                          {/* Name & Avatar */}
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white font-black text-xs ${
                                  isFemale
                                    ? 'bg-gradient-to-tr from-rose-500 to-indigo-500'
                                    : 'bg-gradient-to-tr from-sky-600 to-indigo-600'
                                }`}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  to={`/patient-profile/${patient._id}`}
                                  className="font-black text-slate-900 hover:text-sky-600 hover:underline block truncate"
                                >
                                  {patient.fullName}
                                </Link>
                                {patient.nationalId && (
                                  <span
                                    dir="ltr"
                                    className="font-mono text-[10px] text-slate-400 block"
                                  >
                                    {patient.nationalId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="p-4" dir="ltr">
                            <span className="font-semibold text-slate-700">
                              {patient.phone || '—'}
                            </span>
                          </td>

                          {/* Gender & Age */}
                          <td className="p-4">
                            <span className="font-medium text-slate-700">
                              {patient.gender}
                              {patient.age ? ` · ${patient.age} سنة` : ''}
                            </span>
                          </td>

                          {/* Clinic */}
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                              <Building2 size={12} className="text-sky-600" />
                              {patient.clinic?.name || 'عامة'}
                            </span>
                          </td>

                          {/* Created By */}
                          <td className="p-4 text-slate-500">
                            {patient.createdBy?.name || 'سجل عام'}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {patient.phone && (
                                <button
                                  type="button"
                                  onClick={() => handleWhatsApp(patient)}
                                  title="مراسلة واتساب"
                                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100 transition"
                                >
                                  <MessageSquare size={13} />
                                </button>
                              )}

                              {patient.phone && (
                                <a
                                  href={`tel:${patient.phone}`}
                                  title="اتصال مباشر"
                                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 transition"
                                >
                                  <Phone size={13} />
                                </a>
                              )}

                              <Link
                                to={`/patient-profile/${patient._id}`}
                                title="عرض الملف الطبي"
                                className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-1.5 font-bold text-white shadow-2xs hover:bg-sky-700 transition"
                              >
                                <span>الملف</span>
                                <ExternalLink size={12} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
