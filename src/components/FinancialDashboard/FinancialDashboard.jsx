import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  CalendarDays,
  Users,
  Wallet,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Sparkles,
  Filter,
  Stethoscope,
  Printer,
  RefreshCw,
  Scale,
  Clock,
  ExternalLink,
  ChevronDown,
  X,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { api } from '../../api';

/* ─── Signature Clinical Gradient ─── */
const SIGNATURE_GRADIENT =
  'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)';

export default function FinancialDashboard() {
  const navigate = useNavigate();

  /* ─── Data State ─── */
  const [data, setData] = useState(null);
  const [checkupSummary, setCheckupSummary] = useState([]);
  const [checkupTypes, setCheckupTypes] = useState([]);
  const [checkupType, setCheckupType] = useState('');
  const [debtsOverview, setDebtsOverview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  /* ─── Load Data ─── */
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const query = checkupType ? `?checkupType=${encodeURIComponent(checkupType)}` : '';
      const [dashRes, summaryRes, typesRes, debtsRes] = await Promise.all([
        api(`/dashboard${query}`, { showLoading: false }),
        api(`/finance/checkup-summary${query}`, { showLoading: false }).catch(() => []),
        api('/reports/checkup-types', { showLoading: false }).catch(() => []),
        api('/debts/overview', { showLoading: false }).catch(() => null),
      ]);

      setData(dashRes);
      setCheckupSummary(Array.isArray(summaryRes) ? summaryRes : []);
      setCheckupTypes(Array.isArray(typesRes) ? typesRes : []);
      setDebtsOverview(debtsRes);
    } catch (error) {
      console.error('Error loading financial dashboard:', error);
      setMessage(error.message || 'تعذر مزامنة البيانات المالية');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [checkupType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center gap-3 p-8 text-center" dir="rtl">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-600" />
        <p className="text-sm font-bold text-slate-700">جارٍ مزامنة البيانات المالية والتشغيلية...</p>
        <p className="text-xs text-slate-400">يرجى الانتظار لحظات</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center" dir="rtl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-base font-black text-slate-900">تعذر تحميل البيانات المالية</h3>
        <p className="text-xs text-slate-400 max-w-sm">{message || 'حدث خطأ أثناء الاتصال بالخادم.'}</p>
        <button
          type="button"
          onClick={() => loadData(true)}
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const maxClinicIncome = Math.max(...data.clinics.map((c) => c.income || 0), 1);
  const totalSummaryRevenue = checkupSummary.reduce((sum, r) => sum + (Number(r.revenue) || 0), 0) || 1;

  return (
    <section className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8" dir="rtl">
      {/* ── Print Styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-financial-report, #printable-financial-report * { visibility: visible; }
          #printable-financial-report { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl space-y-6" id="printable-financial-report">
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
                  <Sparkles size={13} className="text-sky-600" />
                  DOCPOINT · لوحة الإدارة والمتابعة المالية
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#38C698] animate-pulse" />
                  مباشر
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">
                التقرير المالي والتشغيلي الموحد
              </h1>
              <p className="mt-1.5 text-xs text-slate-500 md:text-sm">
                {checkupType
                  ? `عرض المؤشرات المالية المخصصة لنوع الكشف: "${checkupType}"`
                  : 'متابعة حية وشاملة للإيرادات، تدفقات المرضى، كفاءة الفروع، وتوزيع الدخل بحسب الفحوصات الطبية.'}
              </p>
            </div>

            {/* Header Action Buttons */}
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
                title="طباعة التقرير المالي"
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
              >
                <Printer size={14} className="text-slate-600" />
                <span>طباعة التقرير</span>
              </button>

              <Link
                to="/Indebtedness"
                className="inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-xs font-bold text-white shadow-sm shadow-sky-600/20 transition active:scale-95"
                style={{ background: SIGNATURE_GRADIENT }}
              >
                <Wallet size={15} />
                <span>إدارة المديونيات والأموال</span>
              </Link>
            </div>
          </div>
        </motion.header>

        {/* ── Metric Cards (KPIs) ── */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-4">
          {/* Card 1: Total Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">إجمالي الإيرادات</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Wallet size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                {data.totalIncome.toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-medium text-slate-400">ج.م</span>
            </div>
            <p className="mt-1 text-[10.5px] font-medium text-emerald-700">مبالغ محصلة فعلياً</p>
          </motion.div>

          {/* Card 2: Net Position */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">صافي الموقف المالي</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                <Scale size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-sky-900">
                {debtsOverview
                  ? Number(debtsOverview.netPosition || 0).toLocaleString('ar-EG')
                  : data.totalIncome.toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-medium text-slate-400">ج.م</span>
            </div>
            <p className="mt-1 text-[10.5px] font-medium text-slate-400">شاملاً كافة المستحقات والديون</p>
          </motion.div>

          {/* Card 3: Completed Visits */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">الزيارات المكتملة</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <CalendarDays size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {data.visits.toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-medium text-slate-400">جلسة كشف</span>
            </div>
            <p className="mt-1 text-[10.5px] font-medium text-slate-400">
              لـ {data.patients.toLocaleString('ar-EG')} مريض مسجل
            </p>
          </motion.div>

          {/* Card 4: Outstanding Debts */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/Indebtedness')}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40 transition-all hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">مديونيات المرضى</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-800">
                {debtsOverview
                  ? Number(debtsOverview.patientsDebt || 0).toLocaleString('ar-EG')
                  : '0'}
              </span>
              <span className="text-[11px] font-medium text-slate-400">ج.م</span>
            </div>
            <p className="mt-1 text-[10.5px] font-medium text-amber-700 flex items-center gap-0.5">
              <span>متابعة وتفصيل المديونيات</span>
              <ArrowUpRight size={11} />
            </p>
          </motion.div>
        </div>

        {/* ── Filter Bar (Filter by Checkup Type) ── */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm shadow-slate-200/50 backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                <Filter size={15} />
              </span>
              <div>
                <h2 className="text-xs font-bold text-slate-800">تصفية التقرير المالي</h2>
                <p className="text-[10.5px] text-slate-400">
                  عرض الإحصائيات بحسب نوع الكشف الطبي المعتمد
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[200px]">
                <select
                  value={checkupType}
                  onChange={(e) => setCheckupType(e.target.value)}
                  className="h-9 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pr-3.5 pl-8 text-xs font-bold text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
                >
                  <option value="">كل أنواع الكشف الطبية</option>
                  {checkupTypes.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {checkupType && (
                <button
                  type="button"
                  onClick={() => setCheckupType('')}
                  className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                >
                  <X size={13} />
                  <span>إلغاء الفلتر</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Main Two-Column Layout ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
          {/* ════════════ Right Column: Charts & Tables (lg:col-span-2) ════════════ */}
          <div className="space-y-6 lg:col-span-2">
            {/* Section 1: Clinics Revenue Comparison */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/50 backdrop-blur-md"
            >
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-xs"
                    style={{ background: SIGNATURE_GRADIENT }}
                  >
                    <TrendingUp size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      مقارنة الإيرادات بحسب المركز والفرع
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400">
                      توزيع الحصة المالية ومساهمة كل عيادة في إجمالي الدخل
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 border border-sky-100">
                  {data.clinics.length} عيادة
                </span>
              </div>

              <div className="space-y-5">
                {data.clinics.map((clinic, index) => {
                  const percentage = Math.round((clinic.income / maxClinicIncome) * 100);
                  const avgPerVisit = clinic.visits
                    ? Math.round(clinic.income / clinic.visits)
                    : 0;

                  return (
                    <div key={clinic._id} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{clinic.name}</span>
                          <span className="text-[10px] text-slate-400">
                            ({clinic.location || 'فرع رئيسي'})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-medium text-slate-400">
                            {clinic.visits} زيارة (متوسط: {avgPerVisit.toLocaleString('ar-EG')} ج)
                          </span>
                          <span className="text-[11px] font-bold text-sky-700">
                            {percentage}%
                          </span>
                          <b className="font-black text-slate-900 text-sm">
                            {clinic.income.toLocaleString('ar-EG')} ج.م
                          </b>
                        </div>
                      </div>

                      {/* Progress Bar with Shimmer */}
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.9, delay: 0.1 + index * 0.08, ease: 'easeOut' }}
                          className="relative h-full rounded-full"
                          style={{ background: SIGNATURE_GRADIENT }}
                        >
                          <motion.div
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          />
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>

            {/* Section 2: Table of Revenue by Checkup Type */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/50 backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Stethoscope size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      توزيع الإيرادات بحسب نوع الكشف الطبي
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400">
                      بيانات دقيقة مستخرجة من سجلات الزيارات الفعلية
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                  {checkupSummary.length} نوع كشف
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-bold">
                    <tr>
                      <th className="p-4">نوع الكشف</th>
                      <th className="p-4">المرضى المستفيدون</th>
                      <th className="p-4">عدد الكشوفات</th>
                      <th className="p-4">إجمالي الإيراد</th>
                      <th className="p-4">متوسط الإيراد / كشف</th>
                      <th className="p-4">حصة المساهمة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {checkupSummary.length ? (
                      checkupSummary.map((row) => {
                        const rowRev = Number(row.revenue || 0);
                        const rowVisits = Number(row.visits || 0);
                        const rowShare = Math.round((rowRev / totalSummaryRevenue) * 100);
                        const avg = rowVisits ? Math.round(rowRev / rowVisits) : 0;

                        return (
                          <tr key={row.name} className="hover:bg-sky-50/40 transition">
                            <td className="p-4 font-black text-slate-900">{row.name}</td>
                            <td className="p-4 text-slate-600">
                              {Number(row.people).toLocaleString('ar-EG')} مريض
                            </td>
                            <td className="p-4 font-semibold text-slate-700">
                              {rowVisits.toLocaleString('ar-EG')} كشف
                            </td>
                            <td className="p-4 font-black text-sky-900 text-sm">
                              {rowRev.toLocaleString('ar-EG')} ج.م
                            </td>
                            <td className="p-4 text-slate-600 font-medium">
                              {avg.toLocaleString('ar-EG')} ج
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    style={{ width: `${rowShare}%` }}
                                    className="h-full rounded-full bg-indigo-600"
                                  />
                                </div>
                                <span className="font-bold text-slate-500 text-[10.5px]">
                                  {rowShare}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                          لا توجد كشوفات مكتملة مطابقة للفلتر المحدد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.section>
          </div>

          {/* ════════════ Left Column: Operational Activity & Debt Panels (lg:col-span-1) ════════════ */}
          <aside className="space-y-6">
            {/* Panel 1: Operational Activity */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/50 backdrop-blur-md"
            >
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Activity className="h-4 w-4 text-sky-600" />
                  <span>النشاط التشغيلي للفروع</span>
                </div>
                <span className="text-[10.5px] font-medium text-slate-400">حركة الزيارات</span>
              </div>

              <div className="space-y-2.5">
                {data.clinics.map((clinic) => (
                  <div
                    key={clinic._id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-sky-200 hover:bg-white"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <b className="text-xs font-bold text-slate-800 block truncate">{clinic.name}</b>
                      <p className="text-[10.5px] text-slate-400 truncate">
                        {clinic.location || 'الفرع الرئيسي'}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-xl border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-800">
                      {clinic.visits} زيارة
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Panel 2: Debts & Financial Position Overview */}
            {debtsOverview && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/50 backdrop-blur-md space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                    <span>موقف المستحقات والمديونيات</span>
                  </div>
                  <Link
                    to="/Indebtedness"
                    className="text-xs font-bold text-sky-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>التفاصيل</span>
                    <ArrowUpRight size={12} />
                  </Link>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className="text-slate-500 font-semibold">مديونيات المرضى:</span>
                    <b className="text-amber-800 font-black">
                      {Number(debtsOverview.patientsDebt || 0).toLocaleString('ar-EG')} ج
                    </b>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className="text-slate-500 font-semibold">مستحقات خارجية لنا:</span>
                    <b className="text-emerald-700 font-black">
                      {Number(debtsOverview.externalReceivables || 0).toLocaleString('ar-EG')} ج
                    </b>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className="text-slate-500 font-semibold">التزامات خارجية علينا:</span>
                    <b className="text-rose-600 font-black">
                      {Number(debtsOverview.externalPayables || 0).toLocaleString('ar-EG')} ج
                    </b>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50/60 p-3">
                    <span className="text-sky-800 font-bold">إجمالي ما للطبيب:</span>
                    <b className="text-sky-950 font-black text-sm">
                      {Number(debtsOverview.totalOwedToDoctor || 0).toLocaleString('ar-EG')} ج
                    </b>
                  </div>
                </div>

                <Link
                  to="/Indebtedness"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
                  style={{ background: SIGNATURE_GRADIENT }}
                >
                  <Wallet size={14} />
                  <span>فتح إدارة المديونيات الكاملة</span>
                </Link>
              </motion.div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
