import { useEffect, useState } from 'react';
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
  Loader2,
  Filter,
  Stethoscope
} from 'lucide-react';
import { api } from '../../api';

export default function FinancialDashboard() {
  const [data, setData] = useState(null);
  const [checkupSummary, setCheckupSummary] = useState([]);
  const [message, setMessage] = useState('');
  const [checkupTypes, setCheckupTypes] = useState([]);
  const [checkupType, setCheckupType] = useState('');

  useEffect(() => {
    const query = checkupType ? `?checkupType=${encodeURIComponent(checkupType)}` : '';
    api(`/dashboard${query}`)
      .then(setData)
      .catch((error) => setMessage(error.message));
    api(`/finance/checkup-summary${query}`)
      .then((rows) => setCheckupSummary(Array.isArray(rows) ? rows : []))
      .catch((error) => setMessage(error.message));
  }, [checkupType]);

  useEffect(() => {
    api('/reports/checkup-types').then((res) => setCheckupTypes(Array.isArray(res) ? res : [])).catch((error) => setMessage(error.message));
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        <p className="text-sm font-medium text-slate-500">{message || 'جارٍ مزامنة البيانات المالية...'}</p>
      </div>
    );
  }

  const cards = [
    {
      label: 'إجمالي الإيرادات',
      value: `${data.totalIncome.toLocaleString('ar-EG')} ج`,
      icon: Wallet,
      sub: 'نمو مستقر ومستمر',
      tone: 'text-sky-700 bg-sky-50 border-sky-100'
    },
    {
      label: 'إجمالي المرضى',
      value: data.patients.toLocaleString('ar-EG'),
      icon: Users,
      sub: 'ملف طبي مفعل',
      tone: 'text-blue-700 bg-blue-50 border-blue-100'
    },
    {
      label: 'الزيارات المكتملة',
      value: data.visits.toLocaleString('ar-EG'),
      icon: CalendarDays,
      sub: 'كشف واستشارة',
      tone: 'text-indigo-800 bg-indigo-50 border-indigo-100'
    },
    {
      label: 'العيادات النشطة',
      value: data.clinics.length.toLocaleString('ar-EG'),
      icon: Building2,
      sub: 'مراكز تعمل بكفاءة',
      tone: 'text-cyan-700 bg-cyan-50 border-cyan-100'
    }
  ];

  const max = Math.max(...data.clinics.map((clinic) => clinic.income), 1);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 text-slate-800 md:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header with Ambient Glow & Floating Badge */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-sm md:p-8"
        >
          {/* Animated Background Aura */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.35, 0.6, 0.35]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.25, 0.5, 0.25]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl"
          />

          <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                </motion.span>
                لوحة المتابعة الذكية الحية
              </div>
              <h1 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
                التقرير المالي والتشغيلي الموحد
              </h1>
              <p className="mt-1 text-xs text-slate-500 md:text-sm">
                {checkupType ? `البيانات المالية لنوع الكشف: ${checkupType}` : 'متابعة حية للإيرادات، تدفق المرضى، والنشاط التشغيلي لجميع الفروع'}
              </p>
            </div>



            {/* Live Indicator */}
            <div className="flex items-center gap-3 self-start rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-2.5 backdrop-blur-md md:self-auto">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-600"></span>
              </span>
              <span className="text-xs font-bold text-slate-700">تحديث فوري مباشر</span>
            </div>
          </div>
        </motion.header>

        {/* Stats Grid */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {cards.map(({ label, value, icon: Icon, sub, tone }) => (
            <motion.div
              key={label}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:border-sky-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${tone}`}
                >
                  <Icon className="h-6 w-6" />
                </motion.div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-sky-700">
                  <span>محدث</span>
                  <ArrowUpRight className="h-3 w-3" />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-400">{label}</p>
                <b className="mt-1 block text-2xl font-black text-slate-900 tracking-tight">{value}</b>
                <p className="mt-1 text-[11px] text-slate-400">{sub}</p>
              </div>

              {/* Card Accent Bottom Line */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-sky-600 to-cyan-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </motion.div>
          ))}
        </motion.div>

        {/* Charts & Detail Breakdown */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Main Visual Progress Chart */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm lg:col-span-2"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">مقارنة الإيرادات بحسب المركز</h3>
                  <p className="text-xs text-slate-400">توزيع الحصة المالية لكل عيادة نشطة</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {data.clinics.map((clinic, index) => {
                const percentage = Math.round((clinic.income / max) * 100);
                return (
                  <div key={clinic._id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="font-bold text-slate-700">{clinic.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">({percentage}%)</span>
                        <b className="font-black text-sky-800">{clinic.income.toLocaleString('ar-EG')} ج</b>
                      </div>
                    </div>

                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.2 + index * 0.1, ease: 'easeOut' }}
                        className="relative h-full rounded-full bg-gradient-to-l from-sky-600 via-blue-700 to-cyan-400"
                      >
                        {/* Shimmer Light Bar */}
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

          {/* Operational Clinic Overview */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">النشاط التشغيلي</h3>
                <p className="text-xs text-slate-400">حركة الفروع والزيارات</p>
              </div>
            </div>

            <div className="space-y-3">
              {data.clinics.map((clinic) => (
                <motion.div
                  key={clinic._id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 transition-all hover:border-sky-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="space-y-1">
                    <b className="text-sm font-bold text-slate-800">{clinic.name}</b>
                    <p className="text-xs text-slate-400">{clinic.location}</p>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="rounded-xl border border-sky-100 bg-sky-50/80 px-2.5 py-1 text-xs font-black text-sky-800">
                      {clinic.visits} زيارة
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

        </div>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 self-start rounded-2xl border border-sky-100 bg-white/90 p-2 shadow-sm md:self-auto">
            <Filter className="h-4 w-4 text-sky-600" />
            <select value={checkupType} onChange={(e) => setCheckupType(e.target.value)} className="bg-transparent p-1 text-xs font-bold text-slate-700 outline-none">
              <option value="">كل أنواع الكشف</option>
              {checkupTypes.map((title) => <option key={title} value={title}>{title}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between border-b border-violet-100 p-6"><div><h3 className="font-bold text-slate-900">مقارنة الإيرادات بحسب نوع الكشف</h3><p className="mt-1 text-xs text-slate-400">مصدر البيانات: Visits / title</p></div><Stethoscope className="h-5 w-5 text-violet-600" /></div>

          <div className="overflow-x-auto"><table className="min-w-[720px] w-full text-right"><thead className="bg-violet-50/50 text-xs font-bold text-slate-600"><tr><th className="p-4">نوع الكشف</th><th className="p-4">عدد الأشخاص</th><th className="p-4">عدد الكشوف</th><th className="p-4">إجمالي الإيراد</th><th className="p-4">متوسط الإيراد / كشف</th></tr></thead><tbody className="divide-y divide-slate-100 text-sm">{checkupSummary.length ? checkupSummary.map((row) => <tr key={row.name} className="hover:bg-violet-50/30"><td className="p-4 font-bold text-slate-800">{row.name}</td><td className="p-4">{Number(row.people).toLocaleString('ar-EG')} شخص</td><td className="p-4">{Number(row.visits).toLocaleString('ar-EG')} كشف</td><td className="p-4 font-black text-violet-800">{Number(row.revenue).toLocaleString('ar-EG')} ج</td><td className="p-4 text-slate-600">{row.visits ? Math.round(row.revenue / row.visits).toLocaleString('ar-EG') : 0} ج</td></tr>) : <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-400">لا توجد كشوف مكتملة مطابقة للفلتر الحالي.</td></tr>}</tbody></table></div>

        </motion.section>

      </div>
    </div>
  );
}
