import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpLeft,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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

/* ─── Strict Pagination Limit (9 Patients Per Page) ─── */
const PAGE_SIZE = 9;

/* ─── Helpers ─── */
function getInitials(name) {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
}

/* ─── Skeleton Loading Cards (9 Items) ─── */
function PatientCardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs animate-pulse">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded-md bg-slate-200" />
              <div className="h-3 w-20 rounded-md bg-slate-100" />
            </div>
          </div>
          <div className="h-8 w-8 rounded-xl bg-slate-100" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 space-y-1.5">
            <div className="h-2.5 w-12 rounded bg-slate-200" />
            <div className="h-3.5 w-24 rounded bg-slate-200" />
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 space-y-1.5">
            <div className="h-2.5 w-12 rounded bg-slate-200" />
            <div className="h-3.5 w-20 rounded bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between">
          <div className="h-8 w-24 rounded-xl bg-slate-100" />
          <div className="h-8 w-24 rounded-xl bg-slate-200" />
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <div className="h-2.5 w-28 rounded bg-slate-100" />
          <div className="h-2.5 w-14 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export default function PatientSearch() {
  const navigate = useNavigate();

  /* ─── Data State ─── */
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPageChanging, setIsPageChanging] = useState(false);

  /* ─── Search & Debounce State ─── */
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  /* ─── Filter & Display State ─── */
  const [genderFilter, setGenderFilter] = useState('all'); // 'all' | 'ذكر' | 'أنثى'
  const [clinicFilter, setClinicFilter] = useState('all'); // 'all' | clinicId
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'name' | 'age'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  /* ─── Server-Side Pagination State ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPatients: 0,
    totalPages: 1,
    currentPage: 1,
    limit: PAGE_SIZE,
  });

  /* ─── Demographic Stats from Server ─── */
  const [stats, setStats] = useState({
    total: 0,
    males: 0,
    females: 0,
    malePct: 0,
    femalePct: 0,
    clinicsCount: 0,
  });

  /* ─── Debounce Search Input (350ms) ─── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ─── Reset to Page 1 on Query / Filter Change ─── */
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, genderFilter, clinicFilter, sortBy]);

  /* ─── Fetch Server-Side Paginated Patients ─── */
  const fetchPatients = useCallback(
    async (isManual = false) => {
      if (isManual) {
        setRefreshing(true);
      } else if (patients.length > 0) {
        setIsPageChanging(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(PAGE_SIZE),
        });

        if (debouncedSearch) params.append('search', debouncedSearch);
        if (genderFilter !== 'all') params.append('gender', genderFilter);
        if (clinicFilter !== 'all') params.append('clinic', clinicFilter);
        if (sortBy) params.append('sortBy', sortBy);

        const [patientsRes, clinicsRes] = await Promise.all([
          api(`/patients?${params.toString()}`, { showLoading: false }),
          clinics.length === 0
            ? api('/clinics', { showLoading: false }).catch(() => [])
            : Promise.resolve(null),
        ]);

        if (clinicsRes && Array.isArray(clinicsRes)) {
          setClinics(clinicsRes);
        }

        if (patientsRes) {
          const patientList = Array.isArray(patientsRes)
            ? patientsRes
            : patientsRes.patients || [];
          setPatients(patientList);

          if (patientsRes.pagination) {
            setPagination(patientsRes.pagination);
          } else {
            setPagination({
              totalPatients: patientList.length,
              totalPages: Math.ceil(patientList.length / PAGE_SIZE) || 1,
              currentPage,
              limit: PAGE_SIZE,
            });
          }

          if (patientsRes.stats) {
            const total = patientsRes.stats.total ?? patientList.length;
            const males = patientsRes.stats.males ?? 0;
            const females = patientsRes.stats.females ?? 0;
            setStats({
              total,
              males,
              females,
              malePct: total > 0 ? Math.round((males / total) * 100) : 0,
              femalePct: total > 0 ? Math.round((females / total) * 100) : 0,
              clinicsCount: clinicsRes?.length || clinics.length || 0,
            });
          } else {
            setStats((prev) => ({
              ...prev,
              total: patientList.length,
            }));
          }
        }
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsPageChanging(false);
      }
    },
    [currentPage, debouncedSearch, genderFilter, clinicFilter, sortBy, clinics.length, patients.length]
  );

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  /* ─── Pagination Computed Indicators ─── */
  const totalCount = pagination.totalPatients || 0;
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalCount);

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

  /* ─── Smooth Page Transition Handler ─── */
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ─── Smart Pagination Range Generator ([1] ... [4] [5*] [6] ... [536]) ─── */
  const renderPaginationButtons = () => {
    const total = pagination.totalPages;
    if (total <= 1) return null;

    const pages = [];
    const maxVisible = 7;

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', total);
    } else if (currentPage >= total - 3) {
      pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', total);
    }

    return pages.map((page, idx) => {
      if (page === '...') {
        return (
          <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 text-xs font-bold select-none">
            ...
          </span>
        );
      }

      const isActive = page === currentPage;
      return (
        <button
          key={page}
          type="button"
          onClick={() => handlePageChange(page)}
          disabled={isPageChanging}
          className={`h-9 min-w-[2.25rem] rounded-xl px-3 text-xs font-black transition-all ${
            isActive
              ? 'text-white shadow-sm ring-2 ring-sky-300/40'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
          }`}
          style={isActive ? { background: SIGNATURE_GRADIENT } : {}}
        >
          {page.toLocaleString('ar-EG')}
        </button>
      );
    });
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
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sky-100/50 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-100/40 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                  <FileText size={13} className="text-sky-600" />
                  DOCPOINT · قاعدة السجلات والملفات الطبية
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#38C698] animate-pulse" />
                  {totalCount.toLocaleString('ar-EG')} ملف نشط
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">
                دليل وسجلات المرضى
              </h1>
              <p className="mt-1.5 text-xs text-slate-500 md:text-sm">
                بحث فوري واستعراض شامل لقاعدة بيانات المرضى، التاريخ العلاجي، والوصول السريع
                للتواصل والملف الطبي بمعدل 9 ملفات لكل صفحة.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => fetchPatients(true)}
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
              <span className="text-2xl font-black text-slate-900">
                {stats.total.toLocaleString('ar-EG')}
              </span>
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
              <span className="text-2xl font-black text-slate-900">
                {stats.males.toLocaleString('ar-EG')}
              </span>
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
              <span className="text-2xl font-black text-slate-900">
                {stats.females.toLocaleString('ar-EG')}
              </span>
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
              <span className="text-2xl font-black text-slate-900">
                {clinics.length.toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-medium text-slate-400">عيادة نشطة</span>
            </div>
          </motion.div>
        </div>

        {/* ── Search & Filter Control Center ── */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm shadow-slate-200/50 backdrop-blur-md space-y-3.5">
          {/* Top Line: Search Bar + View Mode */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input with Clear Button */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-600 pointer-events-none"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحث بالاسم، رقم الهاتف، الرقم القومي، أو العيادة..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/60 pr-10 pl-10 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
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
                title="عرض شبكة الكروت (9 كروت)"
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
              {(genderFilter !== 'all' || clinicFilter !== 'all' || searchInput) && (
                <button
                  type="button"
                  onClick={() => {
                    setGenderFilter('all');
                    setClinicFilter('all');
                    setSearchInput('');
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
                {totalCount.toLocaleString('ar-EG')} نتيجة إجمالية
              </span>
            </div>

            <p className="hidden sm:block text-xs text-slate-400">
              الصفحة {currentPage.toLocaleString('ar-EG')} من {pagination.totalPages.toLocaleString('ar-EG')} · 9 مرضى لكل صفحة
            </p>
          </div>

          {loading || isPageChanging ? (
            /* ─── Skeleton Loading Grid (Exact 9 Skeletons) ─── */
            viewMode === 'grid' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                  <PatientCardSkeleton key={`skeleton-${idx}`} />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-8 text-center shadow-sm">
                <RefreshCw size={28} className="mx-auto animate-spin text-sky-600" />
                <p className="mt-3 text-sm font-bold text-slate-700">جارٍ تحميل بيانات الصفحة {currentPage}...</p>
              </div>
            )
          ) : patients.length === 0 ? (
            /* ─── Empty State ─── */
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/95 p-16 text-center shadow-2xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-200">
                <Users size={26} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-800">لا توجد سجلات مطابقة</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                {debouncedSearch
                  ? `لم نجد أي مريض يطابق بحثك عن "${debouncedSearch}". تأكد من صحة الاسم أو رقم الهاتف.`
                  : 'لا يوجد أي مريض مسجل في هذا التصنيف حالياً.'}
              </p>
              <div className="mt-5 flex items-center gap-3">
                {debouncedSearch && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
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
            /* ─── 9-Card Grid View ─── */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {patients.map((patient) => {
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
                        {/* Top: Avatar + Name + Quick Link */}
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

                        {/* National ID Pill */}
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
                    {patients.map((patient) => {
                      const initials = getInitials(patient.fullName);
                      const isFemale = patient.gender === 'أنثى';

                      return (
                        <tr key={patient._id} className="transition hover:bg-sky-50/40 group">
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
                                  <span dir="ltr" className="font-mono text-[10px] text-slate-400 block">
                                    {patient.nationalId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4" dir="ltr">
                            <span className="font-semibold text-slate-700">
                              {patient.phone || '—'}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="font-medium text-slate-700">
                              {patient.gender}
                              {patient.age ? ` · ${patient.age} سنة` : ''}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                              <Building2 size={12} className="text-sky-600" />
                              {patient.clinic?.name || 'عامة'}
                            </span>
                          </td>

                          <td className="p-4 text-slate-500">
                            {patient.createdBy?.name || 'سجل عام'}
                          </td>

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

          {/* ─── Interactive Pagination Bar UI & RTL Support ─── */}
          {pagination.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm shadow-slate-200/50 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
            >
              {/* Real-time Metadata Badge */}
              <div className="text-center text-xs text-slate-600 sm:text-right">
                <span className="font-semibold text-slate-700">
                  عرض المرضى من {startItem.toLocaleString('ar-EG')} إلى {endItem.toLocaleString('ar-EG')}
                </span>
                <span className="mx-1 text-slate-400">من إجمالي</span>
                <span className="font-black text-sky-700">{totalCount.toLocaleString('ar-EG')}</span>
                <span className="mr-1 text-slate-400">مريض</span>
              </div>

              {/* Page Navigation Controls */}
              <div className="flex items-center justify-center gap-2">
                {/* Previous Button (ChevronRight for RTL) */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isPageChanging}
                  title="الصفحة السابقة"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={15} />
                  <span className="hidden sm:inline">السابق</span>
                </button>

                {/* Smart Page Numbers */}
                <div className="flex items-center gap-1.5">{renderPaginationButtons()}</div>

                {/* Next Button (ChevronLeft for RTL) */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages || isPageChanging}
                  title="الصفحة التالية"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="hidden sm:inline">التالي</span>
                  <ChevronLeft size={15} />
                </button>
              </div>
            </motion.div>
          )}
        </section>
      </div>
    </section>
  );
}
