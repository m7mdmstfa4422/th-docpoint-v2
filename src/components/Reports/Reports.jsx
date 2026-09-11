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
  Stethoscope,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Printer,
  ChevronDown,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3
} from 'lucide-react';
import { api } from '../../api';

const initialFilters = { from: '', to: '', clinic: '', checkupType: '' };

// Quick date range presets
const DATE_PRESETS = [
  { label: 'اليوم', value: 'today' },
  { label: 'هذا الأسبوع', value: 'week' },
  { label: 'هذا الشهر', value: 'month' },
  { label: 'تاريخ مخصص', value: 'custom' }
];

// Report category tabs
const REPORT_TABS = [
  { id: 'financial', label: 'التقرير المالي', icon: Wallet },
 
];

// Skeleton Loader Components
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-12 w-12 bg-slate-100 rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-8 w-32 bg-slate-200 rounded" />
          <div className="h-2 w-40 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
          <div className="h-10 w-10 bg-slate-100 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 bg-slate-200 rounded" />
            <div className="h-3 w-96 bg-slate-100 rounded" />
          </div>
          <div className="h-6 w-20 bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('financial');
  const [rawData, setRawData] = useState({ rows: [], typeRows: [], summary: null });
  const [clinics, setClinics] = useState([]);
  const [checkupTypes, setCheckupTypes] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [datePreset, setDatePreset] = useState('custom');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Apply date preset
  const applyDatePreset = useCallback((preset) => {
    const now = new Date();
    let from = '';
    let to = now.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        from = to;
        break;
      case 'week':
        from = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
        break;
      case 'month':
        from = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
        break;
      default:
        return;
    }

    setFilters((prev) => ({ ...prev, from, to }));
    setDatePreset(preset);
  }, []);

  // Fetch reports from server
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
    api('/reports/checkup-types')
      .then((res) => setCheckupTypes(Array.isArray(res) ? res : []))
      .catch((err) => setMessage(err.message));
    fetchReports(initialFilters);
  }, [fetchReports]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    if (name === 'from' || name === 'to') {
      setDatePreset('custom');
    }
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchReports(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setDatePreset('custom');
    setSearchQuery('');
    fetchReports(initialFilters);
  };

  // Filter and sort data
  const displayRows = useMemo(() => {
    let filtered = rawData.rows.filter((row) => {
      // Clinic filter
      if (appliedFilters.clinic) {
        const rowClinicId = String(row.clinicId || row.clinic || row._id || row.id || '');
        const rowClinicName = String(row.name || row.clinicName || '');
        const targetClinic = String(appliedFilters.clinic);
        if (rowClinicId !== targetClinic && rowClinicName !== targetClinic) {
          return false;
        }
      }

      // Date filter
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

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const clinicName = (row.name || row.clinicName || '').toLowerCase();
        const location = (row.location || row.branch || '').toLowerCase();
        const specialty = (row.specialty || '').toLowerCase();
        return clinicName.includes(searchLower) || location.includes(searchLower) || specialty.includes(searchLower);
      }

      return true;
    });

    // Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'revenue' || sortConfig.key === 'visitors') {
          aVal = Number(aVal || 0);
          bVal = Number(bVal || 0);
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [rawData.rows, appliedFilters, searchQuery, sortConfig]);

  // Calculate summary metrics
  const summaryCalculated = useMemo(() => {
    const revenue = displayRows.reduce((sum, r) => sum + Number(r.revenue || r.income || r.totalPaid || 0), 0);
    const visitors = displayRows.reduce((sum, r) => sum + Number(r.visitors || r.visits || r.patientCount || 0), 0);
    const averagePayment = visitors > 0 ? Math.round(revenue / visitors) : 0;

    // Calculate trends (mock data - would need historical data for real trends)
    const revenueTrend = 12;
    const visitorsTrend = 8;
    const avgTrend = 5;

    return { revenue, visitors, averagePayment, revenueTrend, visitorsTrend, avgTrend };
  }, [displayRows]);

  // Export to CSV
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

    const csvContent = '﻿' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reports_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print report
  const printReport = () => {
    window.print();
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
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
        {/* Header */}
        <motion.header
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 md:p-8"
        >
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              محرك التقارير والتحليلات
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">
              التقارير المالية والتشغيلية
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              تحليل شامل للإيرادات والمرضى والعيادات مع تصفية متقدمة وتصدير فوري
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToCSV}
                disabled={displayRows.length === 0 || loading}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md shadow-sky-900/15 transition-all hover:brightness-105 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
                }}
              >
                <Download className="h-4 w-4" />
                <span>تصدير Excel / CSV</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={printReport}
                disabled={displayRows.length === 0 || loading}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                <span>طباعة PDF</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Report Category Tabs */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm shadow-slate-200/50"
        >
          <div className="flex flex-wrap gap-2">
            {REPORT_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={
                    isActive
                      ? {
                          background:
                            'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
                        }
                      : {}
                  }
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeReportTab"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background:
                          'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
                      }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={`h-4 w-4 relative z-10`} />
                  <span className="relative z-10">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Filters Form */}
        <motion.form
          variants={itemVariants}
          onSubmit={handleApplyFilters}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-bold text-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                <Filter className="h-4 w-4" />
              </div>
              <span>خيارات التصفية</span>
            </div>
            {(appliedFilters.from || appliedFilters.to || appliedFilters.clinic || appliedFilters.checkupType) && (
              <span className="rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-bold text-sky-800">
                فلاتر نشطة
              </span>
            )}
          </div>

          {/* Date Presets */}
          <div className="mb-4 flex flex-wrap gap-2">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => applyDatePreset(preset.value)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                  datePreset === preset.value
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50/50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-600" />
                من تاريخ
              </label>
              <input
                name="from"
                value={filters.from}
                onChange={handleInputChange}
                type="date"
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-600" />
                إلى تاريخ
              </label>
              <input
                name="to"
                value={filters.to}
                onChange={handleInputChange}
                type="date"
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-sky-600" />
                الفرع / العيادة
              </label>
              <div className="relative">
                <select
                  name="clinic"
                  value={filters.clinic}
                  onChange={handleInputChange}
                  className="w-full appearance-none rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 pr-10 text-sm text-slate-800 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:shadow-sm"
                >
                  <option value="">جميع الفروع ({clinics.length})</option>
                  {clinics.map((clinic) => (
                    <option key={clinic._id || clinic.id} value={clinic._id || clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-sky-600" />
                نوع الكشف
              </label>
              <div className="relative">
                <select
                  name="checkupType"
                  value={filters.checkupType}
                  onChange={handleInputChange}
                  className="w-full appearance-none rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 pr-10 text-sm text-slate-800 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:shadow-sm"
                >
                  <option value="">كل أنواع الكشف</option>
                  {checkupTypes.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md shadow-sky-900/15 transition-all hover:brightness-105 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarRange className="h-4 w-4" />}
              <span>تطبيق الفلترة</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span>إعادة الضبط</span>
            </motion.button>
          </div>
        </motion.form>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <KPICard
                title="إجمالي الإيرادات"
                value={`${summaryCalculated.revenue.toLocaleString('ar-EG')} ج`}
                trend={summaryCalculated.revenueTrend}
                icon={Wallet}
                iconBg="bg-sky-50"
                iconColor="text-sky-700"
              />
              <KPICard
                title="عدد الزيارات"
                value={summaryCalculated.visitors.toLocaleString('ar-EG')}
                trend={summaryCalculated.visitorsTrend}
                icon={Users}
                iconBg="bg-cyan-50"
                iconColor="text-cyan-700"
              />
              <KPICard
                title="متوسط قيمة الكشف"
                value={`${summaryCalculated.averagePayment.toLocaleString('ar-EG')} ج`}
                trend={summaryCalculated.avgTrend}
                icon={Activity}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-700"
              />
              <KPICard
                title="عدد العيادات"
                value={displayRows.length.toLocaleString('ar-EG')}
                trend={null}
                icon={Building2}
                iconBg="bg-violet-50"
                iconColor="text-violet-700"
              />
            </>
          )}
        </motion.div>

        {/* Results Table */}
        <motion.section
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50"
        >
          <div className="p-6 border-b border-slate-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">نتائج التقرير ({displayRows.length})</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {appliedFilters.checkupType ? `نوع الكشف: ${appliedFilters.checkupType}` : 'جميع أنواع الكشف'}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative max-w-xs">
              <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في النتائج..."
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 pr-10 pl-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6">
                <SkeletonTable />
              </div>
            ) : (
              <table className="min-w-full w-full text-right">
                <thead className="bg-slate-50/70 text-xs font-bold text-slate-600">
                  <tr>
                    <th className="p-4">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1.5 hover:text-sky-600 transition-colors"
                      >
                        <span>العيادة</span>
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="p-4">الموقع</th>
                    <th className="p-4">نوع الكشف</th>
                    <th className="p-4">
                      <button
                        onClick={() => handleSort('visitors')}
                        className="flex items-center gap-1.5 hover:text-sky-600 transition-colors"
                      >
                        <span>الزائرون</span>
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="p-4">
                      <button
                        onClick={() => handleSort('revenue')}
                        className="flex items-center gap-1.5 hover:text-sky-600 transition-colors"
                      >
                        <span>الإيرادات</span>
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="p-4">النسبة</th>
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
                        const sharePercentage =
                          summaryCalculated.revenue > 0
                            ? Math.round((revenueAmount / summaryCalculated.revenue) * 100)
                            : 0;

                        return (
                          <motion.tr
                            key={clinicId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="transition-colors hover:bg-sky-50/30"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
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

                            <td className="p-4">
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-1.5 text-slate-700">
                                  <MapPin className="h-3.5 w-3.5 text-sky-600" />
                                  <span>{location}</span>
                                </div>
                                {phone && (
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <Phone className="h-3 w-3" />
                                    <span dir="ltr">{phone}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-800">
                                <Stethoscope className="h-3 w-3" />
                                {row.checkupType || appliedFilters.checkupType || 'كل الأنواع'}
                              </span>
                            </td>

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
                                    className="h-full rounded-full"
                                    style={{
                                      background:
                                        'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
                                    }}
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
                        <td colSpan={6} className="p-12 text-center">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-600">لا توجد نتائج</p>
                          <p className="text-xs text-slate-400 mt-1">جرب تعديل الفلاتر أو معايير البحث</p>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {message && (
            <div className="p-4 text-center text-xs font-semibold text-rose-500 bg-rose-50/50 border-t border-rose-100">
              {message}
            </div>
          )}
        </motion.section>

        {/* Checkup Types Table */}
        {activeTab === 'checkups' && (
          <motion.section
            variants={itemVariants}
            className="overflow-hidden rounded-2xl border border-violet-200/80 bg-white shadow-sm shadow-violet-100/50"
          >
            <div className="flex items-center justify-between border-b border-violet-100 p-6">
              <div>
                <h3 className="font-bold text-slate-900">تحليل أنواع الكشف ({rawData.typeRows.length})</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  بيانات مفصلة لكل نوع كشف من السجلات الطبية
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-violet-600" />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full w-full text-right">
                <thead className="bg-violet-50/50 text-xs font-bold text-slate-600">
                  <tr>
                    <th className="p-4">نوع الكشف</th>
                    <th className="p-4">المرضى</th>
                    <th className="p-4">الزيارات</th>
                    <th className="p-4">القيمة الكلية</th>
                    <th className="p-4">المحصل</th>
                    <th className="p-4">المتبقي</th>
                    <th className="p-4">المتوسط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {rawData.typeRows.length ? (
                    rawData.typeRows.map((row) => {
                      const totalCost = Number(row.totalCost || 0);
                      const revenue = Number(row.revenue || 0);
                      const remaining = Math.max(0, totalCost - revenue);

                      return (
                        <tr key={row.id || row.name} className="hover:bg-violet-50/30 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-slate-800">{row.name}</span>
                          </td>
                          <td className="p-4">
                            <span className="rounded-xl bg-violet-50 border border-violet-200 px-2.5 py-1 text-xs font-bold text-violet-800">
                              {Number(row.people || 0).toLocaleString('ar-EG')} شخص
                            </span>
                          </td>
                          <td className="p-4 font-bold">{Number(row.visits || 0).toLocaleString('ar-EG')}</td>
                          <td className="p-4 text-slate-700">{totalCost.toLocaleString('ar-EG')} ج</td>
                          <td className="p-4 font-black text-emerald-700">{revenue.toLocaleString('ar-EG')} ج</td>
                          <td className="p-4 font-bold text-rose-600">{remaining.toLocaleString('ar-EG')} ج</td>
                          <td className="p-4 text-slate-600">
                            {row.visits ? Math.round(revenue / row.visits).toLocaleString('ar-EG') : 0} ج
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <Stethoscope className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-600">لا توجد أنواع كشف</p>
                        <p className="text-xs text-slate-400 mt-1">لم يتم العثور على بيانات مطابقة</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}
      </motion.div>
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value, trend, icon: Icon, iconBg, iconColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 transition-all hover:border-sky-300 hover:shadow-md hover:shadow-sky-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        {trend !== null && (
          <span
            className={`flex items-center gap-1 text-xs font-bold ${
              trend >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2">{title}</p>
        <span className="text-2xl font-black text-slate-900">{value}</span>
      </div>
    </motion.div>
  );
}
