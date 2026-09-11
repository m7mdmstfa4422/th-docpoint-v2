import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Scale,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MessageSquare,
  Calendar,
  Building2,
  Trash2,
  Printer,
  RefreshCw,
  FileText,
  X,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ExternalLink,
  DollarSign,
  Receipt,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { api } from '../../api';

/* ─── Signature Linear Gradient ─── */
const SIGNATURE_GRADIENT =
  'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)';

/* ─── Helpers ─── */
function getInitials(name) {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
}

export default function Indebtedness() {
  const navigate = useNavigate();

  /* ─── State ─── */
  const [activeTab, setActiveTab] = useState('patients'); // 'patients' | 'external'
  const [overview, setOverview] = useState(null);
  const [patientDebts, setPatientDebts] = useState([]);
  const [externalDebts, setExternalDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedVisits, setExpandedVisits] = useState({});

  const toggleVisits = (patientId) => {
    setExpandedVisits((prev) => ({ ...prev, [patientId]: !prev[patientId] }));
  };

  // Filters for External Debts
  const [externalTypeFilter, setExternalTypeFilter] = useState('all'); // 'all' | 'receivable' | 'payable'
  const [externalCategoryFilter, setExternalCategoryFilter] = useState('all');

  // Modals state
  const [selectedPatientForPay, setSelectedPatientForPay] = useState(null);
  const [patientPayAmount, setPatientPayAmount] = useState('');
  const [isSubmittingPatientPay, setIsSubmittingPatientPay] = useState(false);

  const [showAddExternalModal, setShowAddExternalModal] = useState(false);
  const [newExternalForm, setNewExternalForm] = useState({
    title: '',
    debtorName: '',
    type: 'receivable',
    category: 'معمل تحاليل',
    phone: '',
    totalAmount: '',
    paidAmount: '',
    dueDate: '',
    notes: '',
  });
  const [isSubmittingNewExternal, setIsSubmittingNewExternal] = useState(false);

  const [selectedExternalForPay, setSelectedExternalForPay] = useState(null);
  const [externalPayAmount, setExternalPayAmount] = useState('');
  const [externalPayNotes, setExternalPayNotes] = useState('');
  const [isSubmittingExternalPay, setIsSubmittingExternalPay] = useState(false);

  const [selectedExternalHistory, setSelectedExternalHistory] = useState(null);

  /* ─── Load Data ─── */
  const fetchData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [ovData, patData, extData] = await Promise.all([
        api('/debts/overview', { showLoading: false }),
        api('/debts/patients', { showLoading: false }),
        api('/external-debts', { showLoading: false }),
      ]);

      setOverview(ovData);
      setPatientDebts(Array.isArray(patData?.patients) ? patData.patients : []);
      setExternalDebts(Array.isArray(extData) ? extData : []);
    } catch (err) {
      console.error('Error loading debt data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ─── Filtered Patient Debts ─── */
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patientDebts;
    const s = searchTerm.trim().toLowerCase();
    return patientDebts.filter((item) => {
      const p = item.patient;
      return (
        p?.fullName?.toLowerCase().includes(s) ||
        p?.phone?.includes(s) ||
        p?.nationalId?.includes(s) ||
        item.clinic?.name?.toLowerCase().includes(s)
      );
    });
  }, [patientDebts, searchTerm]);

  /* ─── Filtered External Debts ─── */
  const filteredExternalDebts = useMemo(() => {
    return externalDebts.filter((item) => {
      // Type filter
      if (externalTypeFilter !== 'all' && item.type !== externalTypeFilter) {
        return false;
      }
      // Category filter
      if (
        externalCategoryFilter !== 'all' &&
        item.category !== externalCategoryFilter
      ) {
        return false;
      }
      // Search
      if (searchTerm.trim()) {
        const s = searchTerm.trim().toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(s);
        const matchDebtor = item.debtorName?.toLowerCase().includes(s);
        const matchPhone = item.phone?.includes(s);
        if (!matchTitle && !matchDebtor && !matchPhone) return false;
      }
      return true;
    });
  }, [externalDebts, externalTypeFilter, externalCategoryFilter, searchTerm]);

  /* ─── WhatsApp Debt Reminder ─── */
  const sendWhatsAppDebtReminder = (patient, clinicName, remaining) => {
    const rawPhone = patient.phone || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '20' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }

    const cName = clinicName || 'عيادة د. أحمد الرفاعي';
    const msg = `مرحباً أستاذ/ة ${patient.fullName}،\nنتمنى لكم دوام الصحة والعافية من ${cName}.\nنود تذكيركم بلطف بأن هناك مبلغ متبقي للكشف/الخدمات الطبية بقيمة ${remaining.toLocaleString('ar-EG')} ج.م.\nشاكرين ومقدرين حسن تعاونكم معنا!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  /* ─── Handlers ─── */

  // 1. Submit Patient Debt Payment
  const handlePayPatientDebt = async (e) => {
    e.preventDefault();
    if (!selectedPatientForPay) return;
    const amount = Number(patientPayAmount);
    if (!amount || amount <= 0) {
      alert('يرجى إدخال مبلغ سداد صحيح.');
      return;
    }

    try {
      setIsSubmittingPatientPay(true);
      await api(`/patients/${selectedPatientForPay.patient._id}/pay-debt`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      setSelectedPatientForPay(null);
      setPatientPayAmount('');
      await fetchData(true);
    } catch (err) {
      console.error(err);
      alert(err.message || 'تعذر تسجيل السداد');
    } finally {
      setIsSubmittingPatientPay(false);
    }
  };

  // 2. Submit New External Debt
  const handleCreateExternalDebt = async (e) => {
    e.preventDefault();
    if (
      !newExternalForm.title.trim() ||
      !newExternalForm.debtorName.trim() ||
      !newExternalForm.totalAmount
    ) {
      alert('يرجى ملء جميع الحقول المطلوبة (البيان، الطرف، والمبلغ).');
      return;
    }

    try {
      setIsSubmittingNewExternal(true);
      await api('/external-debts', {
        method: 'POST',
        body: JSON.stringify({
          ...newExternalForm,
          totalAmount: Number(newExternalForm.totalAmount),
          paidAmount: Number(newExternalForm.paidAmount || 0),
        }),
      });

      setShowAddExternalModal(false);
      setNewExternalForm({
        title: '',
        debtorName: '',
        type: 'receivable',
        category: 'معمل تحاليل',
        phone: '',
        totalAmount: '',
        paidAmount: '',
        dueDate: '',
        notes: '',
      });
      await fetchData(true);
    } catch (err) {
      console.error(err);
      alert(err.message || 'تعذر إضافة المعاملة');
    } finally {
      setIsSubmittingNewExternal(false);
    }
  };

  // 3. Submit Payment for External Debt
  const handlePayExternalDebt = async (e) => {
    e.preventDefault();
    if (!selectedExternalForPay) return;
    const amount = Number(externalPayAmount);
    if (!amount || amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح.');
      return;
    }

    try {
      setIsSubmittingExternalPay(true);
      await api(`/external-debts/${selectedExternalForPay._id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          amount,
          notes: externalPayNotes,
        }),
      });

      setSelectedExternalForPay(null);
      setExternalPayAmount('');
      setExternalPayNotes('');
      await fetchData(true);
    } catch (err) {
      console.error(err);
      alert(err.message || 'تعذر تسجيل الدفعة');
    } finally {
      setIsSubmittingExternalPay(false);
    }
  };

  // 4. Delete External Debt
  const handleDeleteExternalDebt = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
    try {
      await api(`/external-debts/${id}`, { method: 'DELETE' });
      await fetchData(true);
    } catch (err) {
      console.error(err);
      alert(err.message || 'تعذر حذف المعاملة');
    }
  };

  return (
    <section className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8" dir="rtl">
      {/* ── Print Styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-indebtedness, #printable-indebtedness * { visibility: visible; }
          #printable-indebtedness { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl space-y-6" id="printable-indebtedness">
        {/* ─── Header Banner ─── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/50 backdrop-blur-md md:p-8"
        >
          {/* Subtle light clinical aura */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sky-100/50 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-100/30 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                  <Sparkles size={13} className="text-sky-600" />
                  DOCPOINT · المركز المالي والمستحقات الخارجية
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#38C698] animate-pulse" />
                  مباشر
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">
                الأموال الخارجية والمديونيات
              </h1>
              <p className="mt-1.5 text-xs text-slate-500 md:text-sm">
                متابعة دقيقة لمستحقات الكشوفات والعمليات على المرضى، وحسابات المعامل والجهات الخارجية.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                title="تحديث البيانات"
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin text-sky-600' : ''} />
                <span>تحديث</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddExternalModal(true)}
                style={{ background: SIGNATURE_GRADIENT }}
                className="inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-xs font-bold text-white shadow-sm shadow-sky-600/20 transition active:scale-95"
              >
                <Plus size={15} />
                <span>إضافة جهة / معاملة خارجية</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                title="طباعة كشف الحساب"
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
              >
                <Printer size={14} className="text-slate-600" />
                <span className="hidden sm:inline">طباعة</span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* ─── Standalone 4 KPI Cards Grid (Aligned with All Other Pages) ─── */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-4">
          {/* 1. Total Receivables */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40 transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">إجمالي أموالي بالخارج</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                <ArrowDownLeft size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                {(overview?.totalOwedToDoctor || 0).toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-medium text-slate-400">ج.م</span>
            </div>
            <p className="mt-1 text-[10.5px] font-medium text-sky-700">مستحقات مرضى + جهات</p>
          </motion.div>

          {/* 2. Patients Debt */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40 transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">مستحقات على المرضى</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <Users size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-600">
                {(overview?.patientsDebt || 0).toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-medium text-slate-400">ج.م</span>
            </div>
            <p className="mt-1 text-[10.5px] font-medium text-rose-600">
              على {overview?.indebtedPatientsCount || 0} مريض
            </p>
          </motion.div>

          {/* 3. External Payables */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40 transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">التزامات عليّ للغير</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <ArrowUpRight size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-800">
                {(overview?.externalPayables || 0).toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-medium text-slate-400">ج.م</span>
            </div>
            <p className="mt-1 text-[10.5px] font-medium text-amber-700">فواتير مؤجلة لمعامل وموردين</p>
          </motion.div>

          {/* 4. Net Financial Position */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40 transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">صافي المركز الخارجي</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Scale size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-black ${
                  (overview?.netPosition || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {(overview?.netPosition || 0).toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-medium text-slate-400">ج.م</span>
            </div>
            <p className="mt-1 text-[10.5px] font-medium text-slate-400">
              {(overview?.netPosition || 0) >= 0 ? 'فائض مستحق لصالحك' : 'عجز في الالتزامات'}
            </p>
          </motion.div>
        </div>

        {/* ─── Navigation Tabs & Search Controls Card ─── */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm shadow-slate-200/50 backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Sliding Pill Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('patients')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'patients'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Users size={14} />
                <span>مديونيات المرضى</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    activeTab === 'patients'
                      ? 'bg-white/20 text-white'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {patientDebts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('external')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'external'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Building2 size={14} />
                <span>الجهات والمعامل الخارجية</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    activeTab === 'external'
                      ? 'bg-white/20 text-white'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {externalDebts.length}
                </span>
              </button>
            </div>

            {/* Live Search */}
            <div className="relative min-w-[240px]">
              <Search
                size={15}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  activeTab === 'patients'
                    ? 'بحث باسم المريض أو الهاتف...'
                    : 'بحث باسم الجهة أو البيان...'
                }
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/80 pr-9 pl-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── TAB 1: Patient Debts ─── */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white/95 p-16 text-center shadow-sm">
                <RefreshCw size={28} className="animate-spin text-sky-600" />
                <p className="mt-3 text-sm font-bold text-slate-700">جارٍ تحميل مديونيات المرضى...</p>
                <p className="mt-1 text-xs text-slate-400">يرجى الانتظار لحظات</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/95 p-16 text-center shadow-2xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800">
                  {searchTerm ? 'لا توجد نتائج مطابقة لبحثك' : 'رائع! لا توجد أي مديونيات معلقة على المرضى'}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {searchTerm
                    ? 'جرب البحث باسم مريض أو رقم هاتف آخر'
                    : 'كافة الكشوفات والعمليات مسددة بالكامل حتى الآن.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filteredPatients.map((item) => {
                    const p = item.patient;
                    const initials = getInitials(p.fullName);
                    const isExpanded = !!expandedVisits[p._id];
                    const paidPercent = Math.min(
                      100,
                      Math.round((item.totalPaid / (item.totalCost || 1)) * 100)
                    );

                    return (
                      <motion.div
                        key={p._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        layout
                        className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-5 sm:p-6 shadow-2xs shadow-slate-200/40 transition hover:border-sky-200 hover:shadow-md"
                      >
                        <div className="space-y-4">
                          {/* 1. Header: Avatar + Patient Info + Actions */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              {/* Avatar */}
                              <div
                                style={{ background: SIGNATURE_GRADIENT }}
                                className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white font-black text-sm shadow-xs"
                              >
                                <span>{initials}</span>
                                <span className="absolute -bottom-1 -left-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-[#F54B5E]">
                                  <span className="h-1 w-1 rounded-full bg-white animate-ping" />
                                </span>
                              </div>

                              <div className="min-w-0">
                                <Link
                                  to={`/patient-profile/${p._id}`}
                                  className="truncate text-sm font-black text-slate-900 hover:text-sky-600 hover:underline transition block"
                                >
                                  {p.fullName}
                                </Link>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                                  <span>{p.gender || 'مريض'}</span>
                                  {p.age ? <span>· {p.age} سنة</span> : null}
                                </div>
                              </div>
                            </div>

                            {/* Toolbar Buttons */}
                            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1">
                              {p.phone && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      sendWhatsAppDebtReminder(
                                        p,
                                        item.clinic?.name,
                                        item.totalRemaining
                                      )
                                    }
                                    title="إرسال تذكير واتساب بالمديونية"
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition"
                                  >
                                    <MessageSquare size={13} />
                                  </button>
                                  <a
                                    href={`tel:${p.phone}`}
                                    title="اتصال هاتفي"
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-sky-50 hover:text-sky-600 transition"
                                  >
                                    <Phone size={13} />
                                  </a>
                                </>
                              )}
                              <Link
                                to={`/patient-profile/${p._id}`}
                                title="عرض الملف الطبي"
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-sky-50 hover:text-sky-600 transition"
                              >
                                <ExternalLink size={13} />
                              </Link>
                            </div>
                          </div>

                          {/* 2. Clinic and Status Pill Container */}
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs">
                            <div className="flex min-w-0 items-center gap-1.5 font-bold text-slate-700">
                              <Building2 size={12} className="shrink-0 text-sky-600" />
                              <span className="truncate">{item.clinic?.name || 'عيادة عامة'}</span>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10.5px] font-bold text-rose-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#F54B5E] animate-pulse" />
                              مديونية معلقة
                            </span>
                          </div>

                          {/* 3. Financial Showcase Box */}
                          <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-3.5">
                            <div className="flex items-baseline justify-between">
                              <span className="text-[11px] font-bold text-rose-900">
                                المتبقي المطلوب سداده:
                              </span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-rose-600">
                                  {item.totalRemaining.toLocaleString('ar-EG')}
                                </span>
                                <span className="text-xs font-bold text-rose-600">ج.م</span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2.5">
                              <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200/80 p-0.5">
                                <div
                                  style={{ width: `${paidPercent}%` }}
                                  className="h-full rounded-full bg-[#38C698] shadow-2xs transition-all duration-500"
                                />
                                <div
                                  style={{ width: `${100 - paidPercent}%` }}
                                  className="h-full rounded-full bg-[#F54B5E] shadow-2xs transition-all duration-500"
                                />
                              </div>
                            </div>

                            {/* Mini numbers */}
                            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-rose-100">
                              <span>التكلفة: <b>{item.totalCost.toLocaleString('ar-EG')} ج</b></span>
                              <span className="text-emerald-700 font-bold">
                                المسدد: {item.totalPaid.toLocaleString('ar-EG')} ج ({paidPercent}%)
                              </span>
                            </div>
                          </div>

                          {/* 4. Visits accordion toggle */}
                          {item.visits && item.visits.length > 0 && (
                            <div className="border-t border-slate-100 pt-2">
                              <button
                                type="button"
                                onClick={() => toggleVisits(p._id)}
                                className="flex w-full items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 transition py-1"
                              >
                                <span>تفاصيل الكشوفات المتبقية ({item.visits.length})</span>
                                <ChevronDown
                                  size={14}
                                  className={`transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>

                              {isExpanded && (
                                <div className="mt-2 space-y-1.5">
                                  {item.visits.map((v) => (
                                    <div
                                      key={v._id}
                                      className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-[11px]"
                                    >
                                      <span className="font-bold text-slate-800">{v.title}</span>
                                      <span className="font-mono text-rose-600 font-black">
                                        متبقي {v.remaining.toLocaleString('ar-EG')} ج
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 5. Bottom CTA: Settle Debt Button */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPatientForPay(item);
                              setPatientPayAmount(item.totalRemaining);
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
                            style={{ background: SIGNATURE_GRADIENT }}
                          >
                            <CreditCard size={14} />
                            <span>سداد دفعة للمريض</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: External Debts ─── */}
        {activeTab === 'external' && (
          <div className="space-y-4">
            {/* Filter pills & Category selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white/95 p-3.5 shadow-sm shadow-slate-200/50">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `الكل (${externalDebts.length})` },
                  { id: 'receivable', label: 'أموال لنا بالخارج' },
                  { id: 'payable', label: 'التزامات علينا' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setExternalTypeFilter(f.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      externalTypeFilter === f.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <select
                  value={externalCategoryFilter}
                  onChange={(e) => setExternalCategoryFilter(e.target.value)}
                  className="h-8 rounded-xl border border-slate-200 bg-white pr-2.5 pl-7 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-sky-500"
                >
                  <option value="all">كافة التصنيفات</option>
                  <option value="معمل تحاليل">معامل التحاليل</option>
                  <option value="مركز أشعة">مراكز الأشعة</option>
                  <option value="شركة مستلزمات">شركات المستلزمات والأدوية</option>
                  <option value="مستشفى شريك">المستشفيات الشريكة</option>
                  <option value="شخصي">ديون ومستحقات شخصية</option>
                  <option value="أخرى">أخرى</option>
                </select>
                <ChevronDown
                  size={12}
                  className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {/* List of External Debts */}
            {filteredExternalDebts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/95 p-16 text-center shadow-2xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
                  <Building2 size={28} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800">
                  لا توجد معاملات خارجية مطابقة
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  يمكنك إضافة جهة جديدة (معمل، مركز أشعة، شركة أدوية، مستشفى) عبر زر "إضافة جهة / معاملة خارجية".
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddExternalModal(true)}
                  style={{ background: SIGNATURE_GRADIENT }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:brightness-105"
                >
                  <Plus size={14} />
                  <span>إضافة أول معاملة</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredExternalDebts.map((item) => {
                  const remaining = Math.max(0, item.totalAmount - item.paidAmount);
                  const percent = Math.min(
                    100,
                    Math.round((item.paidAmount / (item.totalAmount || 1)) * 100)
                  );
                  const isReceivable = item.type === 'receivable';

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/95 p-5 sm:p-6 shadow-2xs shadow-slate-200/40 hover:border-sky-200 hover:shadow-md transition"
                    >
                      <div>
                        {/* Top badges */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              isReceivable
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border border-amber-200 bg-amber-50 text-amber-800'
                            }`}
                          >
                            {isReceivable ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                            {isReceivable ? 'لنا بالخارج (مستحق)' : 'علينا للغير (التزام)'}
                          </span>

                          <span className="rounded-xl bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                            {item.category}
                          </span>
                        </div>

                        {/* Title & Entity */}
                        <div className="mt-3">
                          <h4 className="text-base font-black text-slate-900 leading-snug">{item.title}</h4>
                          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mt-1">
                            <Building2 size={13} className="text-slate-400" />
                            {item.debtorName}
                          </p>
                        </div>

                        {/* Phone & Due Date */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          {item.phone && (
                            <span className="inline-flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-1 text-slate-600 font-medium">
                              <Phone size={11} className="text-slate-400" />
                              <span dir="ltr">{item.phone}</span>
                            </span>
                          )}
                          {item.dueDate && (
                            <span className="inline-flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-1 text-slate-600 font-medium">
                              <Calendar size={11} className="text-slate-400" />
                              الاستحقاق: {new Date(item.dueDate).toLocaleDateString('ar-EG')}
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[11px] mb-1.5 font-bold">
                            <span className="text-slate-500">نسبة السداد</span>
                            <span className="text-slate-800">{percent}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                            <div
                              style={{ width: `${percent}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                percent === 100
                                  ? 'bg-[#38C698]'
                                  : isReceivable
                                  ? 'bg-[#38C698]'
                                  : 'bg-[#F9CB6C]'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Financial Figures */}
                        <div className="mt-4 grid grid-cols-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-center">
                          <div>
                            <span className="block text-[10px] font-medium text-slate-400">الإجمالي</span>
                            <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                              {item.totalAmount.toLocaleString('ar-EG')}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-medium text-slate-400">المسدد</span>
                            <span className="font-bold text-emerald-700 text-xs mt-0.5 block">
                              {item.paidAmount.toLocaleString('ar-EG')}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-medium text-slate-400">المتبقي</span>
                            <span
                              className={`font-black text-xs mt-0.5 block ${
                                isReceivable ? 'text-rose-600' : 'text-amber-700'
                              }`}
                            >
                              {remaining.toLocaleString('ar-EG')}
                            </span>
                          </div>
                        </div>

                        {item.notes && (
                          <div className="mt-2.5 rounded-xl border border-slate-100 bg-slate-50 p-2 text-xs text-slate-600">
                            <b>بيان:</b> {item.notes}
                          </div>
                        )}
                      </div>

                      {/* Actions row */}
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1.5">
                          {remaining > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedExternalForPay(item);
                                setExternalPayAmount(remaining);
                              }}
                              className="rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-95"
                              style={{ background: SIGNATURE_GRADIENT }}
                            >
                              {isReceivable ? 'تسجيل تحصيل' : 'سداد دفعة'}
                            </button>
                          ) : (
                            <span className="rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                              تم التسوية بالكامل
                            </span>
                          )}

                          {item.payments && item.payments.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedExternalHistory(item)}
                              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              سجل الدفعات ({item.payments.length})
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteExternalDebt(item._id)}
                          title="حذف المعاملة"
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── MODAL 1: Pay Patient Debt ─── */}
      <AnimatePresence>
        {selectedPatientForPay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <span
                    style={{ background: SIGNATURE_GRADIENT }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-xs"
                  >
                    <CreditCard size={15} />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">سداد مديونية مريض</h3>
                    <p className="text-[11px] text-slate-500">
                      {selectedPatientForPay.patient.fullName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatientForPay(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handlePayPatientDebt} className="mt-4 space-y-4">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-center">
                  <span className="block text-xs font-bold text-rose-800">
                    المتبقي المطلوب سداده على المريض
                  </span>
                  <span className="text-2xl font-black text-rose-600 mt-0.5 block">
                    {selectedPatientForPay.totalRemaining.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    قيمة المبلغ المدفوع الآن (ج.م) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedPatientForPay.totalRemaining}
                    value={patientPayAmount}
                    onChange={(e) => setPatientPayAmount(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-base font-black text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedPatientForPay(null)}
                    className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPatientPay}
                    style={{ background: SIGNATURE_GRADIENT }}
                    className="rounded-2xl px-6 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingPatientPay ? 'جارٍ الحفظ...' : 'تأكيد السداد وتحديث الحساب'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 2: Add New External Debt ─── */}
      <AnimatePresence>
        {showAddExternalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span
                    style={{ background: SIGNATURE_GRADIENT }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-xs"
                  >
                    <Plus size={16} />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">إضافة معاملة / جهة خارجية</h3>
                    <p className="text-[11px] text-slate-500">
                      معامل، مراكز أشعة، مستلزمات، مستشفيات، أو التزامات
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddExternalModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateExternalDebt} className="mt-4 space-y-3.5">
                {/* Type: Receivable vs Payable */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    طبيعة المعاملة *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setNewExternalForm({ ...newExternalForm, type: 'receivable' })}
                      className={`flex items-center justify-center gap-1.5 rounded-2xl border p-3 text-xs font-bold transition ${
                        newExternalForm.type === 'receivable'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                          : 'border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <ArrowDownLeft size={14} />
                      <span>لنا بالخارج (مستحق لنا)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewExternalForm({ ...newExternalForm, type: 'payable' })}
                      className={`flex items-center justify-center gap-1.5 rounded-2xl border p-3 text-xs font-bold transition ${
                        newExternalForm.type === 'payable'
                          ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-2xs'
                          : 'border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <ArrowUpRight size={14} />
                      <span>علينا للغير (التزام علينا)</span>
                    </button>
                  </div>
                </div>

                {/* Title & Debtor Name */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      البيان / عنوان المعاملة *
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: فواتير تحاليل شهر 9"
                      value={newExternalForm.title}
                      onChange={(e) => setNewExternalForm({ ...newExternalForm, title: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم الطرف / الجهة *
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: معمل المختبر / شركة النور"
                      value={newExternalForm.debtorName}
                      onChange={(e) => setNewExternalForm({ ...newExternalForm, debtorName: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                </div>

                {/* Category & Phone */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      التصنيف *
                    </label>
                    <select
                      value={newExternalForm.category}
                      onChange={(e) => setNewExternalForm({ ...newExternalForm, category: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 focus:bg-white"
                    >
                      <option value="معمل تحاليل">معمل تحاليل</option>
                      <option value="مركز أشعة">مركز أشعة</option>
                      <option value="شركة مستلزمات">شركة مستلزمات وأدوية</option>
                      <option value="مستشفى شريك">مستشفى شريك</option>
                      <option value="شخصي">معاملة شخصية</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رقم الهاتف للتواصل
                    </label>
                    <input
                      type="text"
                      placeholder="010xxxxxxxx"
                      value={newExternalForm.phone}
                      onChange={(e) => setNewExternalForm({ ...newExternalForm, phone: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      المبلغ الإجمالي (ج.م) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newExternalForm.totalAmount}
                      onChange={(e) => setNewExternalForm({ ...newExternalForm, totalAmount: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs font-black text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      المدفوع مقدماً (إن وجد)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newExternalForm.paidAmount}
                      onChange={(e) => setNewExternalForm({ ...newExternalForm, paidAmount: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs font-black text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                </div>

                {/* Due Date & Notes */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      تاريخ الاستحقاق المتوقع
                    </label>
                    <input
                      type="date"
                      value={newExternalForm.dueDate}
                      onChange={(e) => setNewExternalForm({ ...newExternalForm, dueDate: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ملاحظات وبيان إضافي
                    </label>
                    <input
                      type="text"
                      placeholder="رقم شيك، تفاصيل الاتفاق..."
                      value={newExternalForm.notes}
                      onChange={(e) => setNewExternalForm({ ...newExternalForm, notes: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddExternalModal(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNewExternal}
                    style={{ background: SIGNATURE_GRADIENT }}
                    className="rounded-2xl px-6 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingNewExternal ? 'جارٍ الإضافة...' : 'حفظ المعاملة'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 3: Pay External Debt ─── */}
      <AnimatePresence>
        {selectedExternalForPay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span
                    style={{ background: SIGNATURE_GRADIENT }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-xs"
                  >
                    <CreditCard size={15} />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">سداد دفعة لمعاملة خارجية</h3>
                    <p className="text-[11px] text-slate-500">
                      {selectedExternalForPay.title} ({selectedExternalForPay.debtorName})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedExternalForPay(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handlePayExternalDebt} className="mt-4 space-y-4">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-center">
                  <span className="block text-xs font-bold text-sky-700">المتبقي المطلوب سداده</span>
                  <span className="text-2xl font-black text-sky-900 mt-0.5 block">
                    {(
                      selectedExternalForPay.totalAmount - selectedExternalForPay.paidAmount
                    ).toLocaleString('ar-EG')}{' '}
                    ج.م
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    قيمة الدفعة الحالية (ج.م) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={externalPayAmount}
                    onChange={(e) => setExternalPayAmount(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-base font-black text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    بيان / ملاحظة الدفعة (اختياري)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: نقداً / تحويل بنكي / شيك رقم..."
                    value={externalPayNotes}
                    onChange={(e) => setExternalPayNotes(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedExternalForPay(null)}
                    className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingExternalPay}
                    style={{ background: SIGNATURE_GRADIENT }}
                    className="rounded-2xl px-6 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingExternalPay ? 'جارٍ التسجيل...' : 'تسجيل الدفعة الآن'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 4: Payment History for External Debt ─── */}
      <AnimatePresence>
        {selectedExternalHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">سجل دفعات المعاملة</h3>
                  <p className="text-[11px] text-slate-500">{selectedExternalHistory.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedExternalHistory(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
                {selectedExternalHistory.payments?.map((pay, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        {pay.amount.toLocaleString('ar-EG')} ج.م
                      </span>
                      {pay.notes && (
                        <span className="block text-[10px] text-slate-500">{pay.notes}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(pay.date).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setSelectedExternalHistory(null)}
                  className="rounded-2xl border border-slate-200 px-6 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
