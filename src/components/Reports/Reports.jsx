import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarRange, 
  Filter, 
  RotateCcw, 
  Wallet, 
  Users, 
  Activity, 
  Download, 
  Sparkles, 
  Building2, 
  MapPin, 
  Loader2,
  Calendar,
  Phone,
  Stethoscope
} from 'lucide-react';
import { api } from '../../api';

const initialFilters = { from: '', to: '', clinic: '', checkupType: '' };

export default function Reports() {
  const [rawData, setRawData] = useState({ rows: [], typeRows: [], summary: null });
  const [clinics, setClinics] = useState([]);
  const [checkupTypes, setCheckupTypes] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // استعلام السيرفر مع تنظيف الـ Query Params تماماً من القيم الفارغة
  const fetchReports = useCallback(async (currentFilters) => {
    try {
      setLoading(true);
      setMessage('');
      
      const queryObj = {};
      if (currentFilters.from) queryObj.from = currentFilters.from;
      if (currentFilters.to) queryObj.to = currentFilters.to;
      if (currentFilters.clinic) queryObj.clinic = currentFilters.clinic;
      if (currentFilters.checkupType) queryObj.checkupType = currentFilters.checkupType;

      const queryString = new URLSearchParams(queryObj).toString();
      const endpoint = queryString ? `/reports?${queryString}` : '/reports';
      
      const res = await api(endpoint);
      const rows = Array.isArray(res) ? res : (res?.rows || []);

      setRawData({
        rows,
        typeRows: Array.isArray(res?.typeRows) ? res.typeRows : [],
        summary: res?.summary || null
      });
      setAppliedFilters(currentFilters);
    } catch (error) {
      setMessage(error.message || 'تعذر جلب التقارير');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api('/clinics')
      .then((res) => setClinics(Array.isArray(res) ? res : []))
      .catch((err) => setMessage(err.message));
    api('/reports/checkup-types').then((res) => setCheckupTypes(Array.isArray(res) ? res : [])).catch((err) => setMessage(err.message));
    fetchReports(initialFilters);
  }, [fetchReports]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchReports(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    fetchReports(initialFilters);
  };

  // تصفية دقيقة في الواجهة لضمان عمل الفلتر حتى لو لم يدعمها الـ Backend
  const displayRows = useMemo(() => {
    return rawData.rows.filter((row) => {
      // 1. فلتر العيادة
      if (appliedFilters.clinic) {
        const rowClinicId = String(row.clinicId || row.clinic || row._id || row.id || '');
        const rowClinicName = String(row.name || row.clinicName || '');
        const targetClinic = String(appliedFilters.clinic);
        if (rowClinicId !== targetClinic && rowClinicName !== targetClinic) {
          return false;
        }
      }

      // 2. فلتر التواريخ
      const recordDate = row.date || row.createdAt || row.visitDate;
      if (recordDate) {
        const itemDate = new Date(recordDate).getTime();
        if (appliedFilters.from && itemDate < new Date(appliedFilters.from).getTime()) {
          return false;
        }
        if (appliedFilters.to && itemDate > new Date(appliedFilters.to).getTime() + 86400000) {
          return false;
        }
      }

      return true;
    });
  }, [rawData.rows, appliedFilters]);

  // حساب الإجماليات
  const summaryCalculated = useMemo(() => {
    const revenue = displayRows.reduce((sum, r) => sum + Number(r.revenue || r.income || r.totalPaid || 0), 0);
    const visitors = displayRows.reduce((sum, r) => sum + Number(r.visitors || r.visits || r.patientCount || 0), 0);
    const averagePayment = visitors > 0 ? Math.round(revenue / visitors) : 0;
    return { revenue, visitors, averagePayment };
  }, [displayRows]);

  // تصدير النتائج
  const exportToCSV = () => {
    if (!displayRows.length) return;
    const headers = ['اسم العيادة', 'الموقع/الفرع', 'نوع الكشف', 'التخصص', 'رقم الهاتف', 'عدد الزائرين', 'إجمالي الدخل (ج)'];
    const csvRows = displayRows.map((r) => [
      `"${r.name || r.clinicName || '—'}"`,
      `"${r.location || r.branch || '—'}"`,
      `"${r.checkupType || appliedFilters.checkupType || 'كل الأنواع'}"`,
      `"${r.specialty || 'عام'}"`,
      `"${r.phone || '—'}"`,
      Number(r.visitors || r.visits || r.patientCount || 0),
      Number(r.revenue || r.income || r.totalPaid || 0)
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reports_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 text-slate-800 md:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-sm md:p-8"
        >
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-sky-200/50 blur-3xl"
          />
          <motion.div 
            animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl"
          />

          <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                <Sparkles className="h-3.5 w-3.5 text-sky-600" /> محرك الاستعلام والتقارير
              </div>
              <h1 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
                التقارير المالية والتشغيلية المخصصة
              </h1>
              <p className="mt-1 text-xs text-slate-500 md:text-sm">
                تصفية شاملة للإيرادات وحركة المراجعين بدقة متناهية
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportToCSV}
              disabled={displayRows.length === 0}
              className="flex items-center justify-center gap-2 self-start rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-3 font-bold text-white shadow-md shadow-sky-900/15 transition-all hover:brightness-105 disabled:opacity-50 md:self-auto"
            >
              <Download className="h-4 w-4" />
              <span>تصدير ملف Excel</span>
            </motion.button>
          </div>
        </motion.header>

        {/* Filters Form */}
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={handleApplyFilters}
          className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-bold text-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                <Filter className="h-4 w-4" />
              </div>
              <span>خيارات التصفية والاستعلام</span>
            </div>
            {(appliedFilters.from || appliedFilters.to || appliedFilters.clinic || appliedFilters.checkupType) && (
              <span className="rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-[11px] font-bold text-sky-800">
                يوجد فلاتر مفعّلة حالياً
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-600" /> من تاريخ
              </label>
              <input
                name="from"
                value={filters.from}
                onChange={handleInputChange}
                type="date"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 text-sm text-slate-800 outline-none transition-all focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-600" /> إلى تاريخ
              </label>
              <input
                name="to"
                value={filters.to}
                onChange={handleInputChange}
                type="date"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 text-sm text-slate-800 outline-none transition-all focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-sky-600" /> الفرع / العيادة
              </label>
              <select
                name="clinic"
                value={filters.clinic}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 text-sm text-slate-800 outline-none transition-all focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100"
              >
                <option value="">جميع الفروع ({clinics.length})</option>
                {clinics.map((clinic) => (
                  <option key={clinic._id || clinic.id} value={clinic._id || clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5 text-sky-600" /> نوع الكشف</label>
              <select name="checkupType" value={filters.checkupType} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 text-sm text-slate-800 outline-none transition-all focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100">
                <option value="">كل أنواع الكشف</option>
                {checkupTypes.map((title) => <option key={title} value={title}>{title}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarRange className="h-4 w-4" />}
              <span>تحديث وتطبيق الفلترة</span>
            </motion.button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span>إعادة الضبط</span>
            </button>
          </div>
        </motion.form>

        {/* Stats Grid */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } }
          }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-3"
        >
          <StatCard
            label="إجمالي الإيرادات المفلترة"
            value={`${summaryCalculated.revenue.toLocaleString('ar-EG')} ج`}
            sub="مجموع المبالغ المحصلة حالياً"
            icon={Wallet}
            accent="sky"
          />
          <StatCard
            label="إجمالي عدد المراجعين"
            value={summaryCalculated.visitors.toLocaleString('ar-EG')}
            sub="الزيارات المطابقة للشروط"
            icon={Users}
            accent="blue"
          />
          <StatCard
            label="متوسط الدخل لكل زيارة"
            value={`${summaryCalculated.averagePayment.toLocaleString('ar-EG')} ج`}
            sub="معدل الإيراد لكل مريض"
            icon={Activity}
            accent="cyan"
          />
        </motion.div>

        {/* Results Table */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">سجلات الفروع المسترجعة ({displayRows.length})</h3>
              <p className="text-xs text-slate-400 mt-0.5">{appliedFilters.checkupType ? `نتائج نوع الكشف: ${appliedFilters.checkupType}` : 'البيانات المالية والتشغيلية لجميع أنواع الكشف'}</p>
            </div>
          </div>

          <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-[940px] w-full text-right">
              <thead className="bg-slate-50/70 text-xs font-bold text-slate-600">
                <tr>
                  <th className="p-4">العيادة والتخصص</th>
                  <th className="p-4">الموقع ورقم التواصل</th>
                  <th className="p-4">نوع الكشف</th>
                  <th className="p-4">الزائرون</th>
                  <th className="p-4">إجمالي الدخل</th>
                  <th className="p-4">حصة الإيراد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <AnimatePresence>
                  {displayRows.length > 0 ? (
                    displayRows.map((row, index) => {
                      const clinicId = row._id || row.id || `clinic-${index}`;
                      const clinicName = row.name || row.clinicName || 'عيادة غير محددة';
                      const location = row.location || row.branch || '—';
                      const specialty = row.specialty || 'تخصص عام';
                      const phone = row.phone || null;
                      const visitorsCount = Number(row.visitors || row.visits || row.patientCount || 0);
                      const revenueAmount = Number(row.revenue || row.income || row.totalPaid || 0);
                      const sharePercentage = summaryCalculated.revenue > 0 
                        ? Math.round((revenueAmount / summaryCalculated.revenue) * 100) 
                        : 0;

                      return (
                        <motion.tr
                          key={clinicId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="transition-colors hover:bg-sky-50/40"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{clinicName}</span>
                                <span className="text-xs text-sky-700 inline-flex items-center gap-1 mt-0.5">
                                  <Stethoscope className="h-3 w-3" />
                                  {specialty}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-slate-500">
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <MapPin className="h-3.5 w-3.5 text-sky-600" />
                                <span>{location}</span>
                              </div>
                              {phone && (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                  <Phone className="h-3 w-3 text-slate-400" />
                                  <span dir="ltr">{phone}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="p-4"><span className="inline-flex items-center gap-1 rounded-xl border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-800"><Stethoscope className="h-3 w-3" />{row.checkupType || appliedFilters.checkupType || 'كل الأنواع'}</span></td>

                          <td className="p-4">
                            <span className="inline-flex items-center rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                              {visitorsCount.toLocaleString('ar-EG')} زيارة
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="font-black text-sky-800 text-base">
                              {revenueAmount.toLocaleString('ar-EG')} ج
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${sharePercentage}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className="h-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-400"
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-500">{sharePercentage}%</span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-sm text-slate-400">
                        {loading ? 'جارٍ جلب وتطبيق الفلاتر...' : 'لا توجد نتائج مطابقة للخيارات المحددة.'}
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {message && (
            <p className="p-4 text-center text-xs font-semibold text-rose-500 bg-rose-50/50">
              {message}
            </p>
          )}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-violet-100 p-6"><div><h3 className="font-bold text-slate-900">تحليل الحضور حسب نوع الكشف ({rawData.typeRows.length})</h3><p className="mt-0.5 text-xs text-slate-400">بيانات مباشرة من أنواع الكشف المخزنة في الإعدادات ومن سجلات الزيارات</p></div><Stethoscope className="h-5 w-5 text-violet-600" /></div>
          <div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-right"><thead className="bg-violet-50/50 text-xs font-bold text-slate-600"><tr><th className="p-4">نوع الكشف</th><th className="p-4">عدد الأشخاص</th><th className="p-4">عدد الكشوف</th><th className="p-4">قيمة الكشوف</th><th className="p-4">المبلغ المحصل</th><th className="p-4">المتبقي</th><th className="p-4">متوسط التحصيل / كشف</th></tr></thead><tbody className="divide-y divide-slate-100 text-sm">{rawData.typeRows.length ? rawData.typeRows.map((row) => { const totalCost = Number(row.totalCost || 0); const revenue = Number(row.revenue || 0); const remaining = Math.max(0, totalCost - revenue); return <tr key={row.id || row.name} className="hover:bg-violet-50/30"><td className="p-4 font-bold text-slate-800">{row.name}</td><td className="p-4"><span className="rounded-xl bg-violet-50 px-2.5 py-1 font-bold text-violet-800">{Number(row.people || 0).toLocaleString('ar-EG')} شخص</span></td><td className="p-4 font-bold">{Number(row.visits || 0).toLocaleString('ar-EG')} كشف</td><td className="p-4 text-slate-700">{totalCost.toLocaleString('ar-EG')} ج</td><td className="p-4 font-black text-emerald-700">{revenue.toLocaleString('ar-EG')} ج</td><td className="p-4 font-bold text-rose-600">{remaining.toLocaleString('ar-EG')} ج</td><td className="p-4 text-slate-600">{row.visits ? Math.round(revenue / row.visits).toLocaleString('ar-EG') : 0} ج</td></tr>}) : <tr><td colSpan={7} className="p-8 text-center text-sm text-slate-400">لا توجد أنواع كشف مطابقة للفلاتر.</td></tr>}</tbody></table></div>
        </motion.section>

      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent }) {
  const isSky = accent === 'sky';
  const isBlue = accent === 'blue';

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:border-sky-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
          isSky ? 'border-sky-100 bg-sky-50 text-sky-700' : isBlue ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-cyan-100 bg-cyan-50 text-cyan-700'
        }`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        <b className="mt-1 block text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{value}</b>
        <p className="mt-1 text-[11px] text-slate-400">{sub}</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-sky-600 to-cyan-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </motion.div>
  );
}
