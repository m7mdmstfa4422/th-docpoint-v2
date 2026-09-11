import { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  User,
  Calendar,
  Phone,
  Globe2,
  Building2,
  FileText,
  Wallet,
  Clock,
  Edit3,
  Check,
  Stethoscope,
  ChevronDown,
  X,
  CreditCard,
  CheckCircle2,
  Receipt,
  BadgeDollarSign,
  Printer,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Search,
  ArrowUpLeft,
  UserCheck,
} from 'lucide-react';
import { api } from '../../api';
import { AuthContext } from '../../AuthProvider';

/* ─── Signature Clinical Gradient ─── */
const SIGNATURE_GRADIENT =
  'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)';

/* ─── Helpers ─── */
function getInitials(name) {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
}

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin } = useContext(AuthContext);

  /* ─── Core Data State ─── */
  const [data, setData] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [checkupTypes, setCheckupTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState('');

  /* ─── Form & Modals State ─── */
  const [showForm, setShowForm] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingPatient, setEditingPatient] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtAmount, setDebtAmount] = useState('');

  /* ─── Add Visit Calculated Inputs ─── */
  const [newTotalCost, setNewTotalCost] = useState('');
  const [newPaidAmount, setNewPaidAmount] = useState('');

  /* ─── Visit Search / Filter ─── */
  const [visitSearch, setVisitSearch] = useState('');

  /* ─── Load Data ─── */
  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api(`/patients/${id}`);
      setData(res);
    } catch (error) {
      setMessage(error.message || 'تعذر تحميل ملف المريض');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    api('/clinics')
      .then((res) => setClinics(Array.isArray(res) ? res : []))
      .catch(() => setClinics([]));
    api('/checkup-types')
      .then((res) => setCheckupTypes(Array.isArray(res) ? res : []))
      .catch(() => setCheckupTypes([]));
  }, [load]);

  /* ─── Filtered Visits ─── */
  const filteredVisits = useMemo(() => {
    if (!data?.visits) return [];
    if (!visitSearch.trim()) return data.visits;
    const q = visitSearch.trim().toLowerCase();
    return data.visits.filter((v) => {
      const title = String(v.title || '').toLowerCase();
      const diag = String(v.diagnosis || v.notes || '').toLowerCase();
      const plan = String(v.treatmentPlan || '').toLowerCase();
      const clinic = String(v.clinic?.name || '').toLowerCase();
      return title.includes(q) || diag.includes(q) || plan.includes(q) || clinic.includes(q);
    });
  }, [data?.visits, visitSearch]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center gap-3 p-8 text-center" dir="rtl">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-600" />
        <p className="text-sm font-bold text-slate-700">جارٍ تحميل الملف الطبي للمريض...</p>
        <p className="text-xs text-slate-400">يرجى الانتظار لحظات</p>
      </div>
    );
  }

  if (!data?.patient) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center" dir="rtl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-base font-black text-slate-900">تعذر العثور على ملف المريض</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          {message || 'المريض المطلوب غير موجود أو ربما تم حذفه من قاعدة البيانات.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
        >
          العودة لدليل المرضى
        </button>
      </div>
    );
  }

  const { patient, visits = [] } = data;

  const totalCost = visits.reduce((sum, v) => sum + Number(v.cost ?? v.amount ?? 0), 0);
  const totalPaid = visits.reduce((sum, v) => sum + Number(v.amount || 0), 0);
  const totalRemaining = Math.max(0, totalCost - totalPaid);
  const isFemale = patient.gender === 'أنثى';
  const initials = getInitials(patient.fullName);

  /* ─── Add Visit ─── */
  const addVisit = async (event) => {
    event.preventDefault();
    setLoadingAction(true);
    const form = new FormData(event.currentTarget);
    const cost = Number(form.get('cost')) || 0;
    const amount = Number(form.get('amount')) || 0;

    try {
      await api(`/patients/${id}/visits`, {
        method: 'POST',
        body: JSON.stringify({
          title: form.get('title'),
          diagnosis: form.get('diagnosis'),
          treatmentPlan: form.get('treatmentPlan'),
          clinicalNotes: form.get('clinicalNotes'),
          financialNotes: form.get('financialNotes'),
          cost: cost,
          amount: amount,
          clinic: form.get('clinic'),
          status: 'مكتمل',
        }),
      });
      setShowForm(false);
      setNewTotalCost('');
      setNewPaidAmount('');
      await load(true);
    } catch (error) {
      alert(error.message || 'تعذر تسجيل الزيارة');
    } finally {
      setLoadingAction(false);
    }
  };

  /* ─── Update Visit ─── */
  const handleUpdateVisit = async (e) => {
    e.preventDefault();
    if (!editingVisit) return;
    setLoadingAction(true);

    try {
      await api(`/visits/${editingVisit._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editingVisit.title,
          diagnosis: editingVisit.diagnosis,
          treatmentPlan: editingVisit.treatmentPlan,
          clinicalNotes: editingVisit.clinicalNotes,
          financialNotes: editingVisit.financialNotes,
          cost: Number(editingVisit.cost || 0),
          amount: Number(editingVisit.amount || 0),
        }),
      });
      setEditingVisit(null);
      await load(true);
    } catch (error) {
      alert(error.message || 'تعذر تحديث بيانات الكشف');
    } finally {
      setLoadingAction(false);
    }
  };

  /* ─── Pay Debt ─── */
  const handlePayDebt = async (e) => {
    e.preventDefault();
    const payVal = Number(debtAmount);
    if (!payVal || payVal <= 0) return;
    setLoadingAction(true);

    try {
      await api(`/patients/${id}/pay-debt`, {
        method: 'POST',
        body: JSON.stringify({ amount: payVal }),
      });
      setShowDebtModal(false);
      setDebtAmount('');
      await load(true);
    } catch (error) {
      alert(error.message || 'تعذر تسجيل سداد المبلغ');
    } finally {
      setLoadingAction(false);
    }
  };

  /* ─── Update Medical Notes ─── */
  const handleUpdateNotes = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    const medicalNotes = new FormData(e.currentTarget).get('medicalNotes');
    try {
      await api(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ medicalNotes }),
      });
      setEditingNotes(false);
      await load(true);
    } catch (error) {
      alert(error.message || 'تعذر تحديث الملاحظات');
    } finally {
      setLoadingAction(false);
    }
  };

  /* ─── Update Patient Info ─── */
  const handleUpdatePatient = async (event) => {
    event.preventDefault();
    setLoadingAction(true);
    const form = new FormData(event.currentTarget);
    try {
      await api(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName: form.get('fullName'),
          age: Number(form.get('age')),
          gender: form.get('gender'),
          nationality: form.get('nationality'),
          nationalId: form.get('nationalId'),
          birthDate: form.get('birthDate') || null,
          phone: form.get('phone'),
          clinic: form.get('clinic'),
        }),
      });
      setEditingPatient(false);
      await load(true);
    } catch (error) {
      alert(error.message || 'تعذر حفظ بيانات المريض');
    } finally {
      setLoadingAction(false);
    }
  };

  /* ─── WhatsApp Quick Message ─── */
  const handleWhatsApp = () => {
    const rawPhone = patient.phone || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '20' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }

    const clinicName = patient.clinic?.name || 'عيادة د. أحمد الرفاعي';
    const messageText = `مرحباً أستاذ/ة ${patient.fullName}،\nنتواصل معكم من فريق ${clinicName} للاطمئنان عليكم ومتابعة حالتكم الصحية.\nنتمنى لكم دوام الصحة والعافية!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  return (
    <section className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8" dir="rtl">
      {/* ── Print Specific Styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-patient-record, #printable-patient-record * { visibility: visible; }
          #printable-patient-record { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl space-y-6" id="printable-patient-record">
        {/* ── Hero Profile Header Card ── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/50 backdrop-blur-md md:p-8"
        >
          {/* Subtle Ambient Radial Accents */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sky-100/50 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-100/40 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            {/* Patient Info */}
            <div className="flex items-start gap-4 min-w-0">
              {/* Avatar */}
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white font-black text-lg shadow-sm ${
                  isFemale
                    ? 'bg-gradient-to-tr from-rose-500 via-indigo-500 to-sky-500'
                    : 'bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-500'
                }`}
              >
                {initials}
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 md:text-3xl truncate">
                    {patient.fullName}
                  </h1>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-0.5 text-xs font-bold text-sky-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#38C698] animate-pulse" />
                    ملف طبي رقمي
                  </span>

                  {totalRemaining > 0 ? (
                    <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                      متبقي مديونية
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      الحساب مسدد بالكامل
                    </span>
                  )}
                </div>

                {/* Sub-details pills */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 md:text-sm">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Calendar className="h-3.5 w-3.5 text-sky-600" />
                    {patient.gender} · {patient.age} سنة
                  </span>

                  {patient.phone && (
                    <span className="flex items-center gap-1 font-semibold text-slate-700" dir="ltr">
                      <Phone className="h-3.5 w-3.5 text-sky-600" />
                      {patient.phone}
                    </span>
                  )}

                  {patient.clinic?.name && (
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Building2 className="h-3.5 w-3.5 text-sky-600" />
                      {patient.clinic.name}
                    </span>
                  )}

                  {patient.nationalId && (
                    <span className="flex items-center gap-1 font-mono text-xs text-slate-500">
                      الرقم القومي: {patient.nationalId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* WhatsApp Quick */}
              {patient.phone && (
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  title="مراسلة واتساب"
                  className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-700 shadow-2xs transition hover:bg-emerald-100 active:scale-95"
                >
                  <MessageSquare size={14} className="text-emerald-600" />
                  <span>تواصل واتساب</span>
                </button>
              )}

              {/* Print */}
              <button
                type="button"
                onClick={() => window.print()}
                title="طباعة الملف الطبي"
                className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
              >
                <Printer size={14} className="text-slate-600" />
                <span className="hidden sm:inline">طباعة</span>
              </button>

              {/* Edit Patient (Doctor or Dev) */}
              {(admin?.username === 'drahmed' || admin?.role === 'developer') && (
                <button
                  type="button"
                  onClick={() => setEditingPatient(true)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
                >
                  <Edit3 size={14} className="text-slate-600" />
                  <span>تعديل البيانات</span>
                </button>
              )}

              {/* Add Visit Primary CTA */}
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="inline-flex h-10 items-center gap-1.5 rounded-2xl px-4 text-xs font-bold text-white shadow-sm shadow-sky-600/20 transition active:scale-95"
                style={{ background: SIGNATURE_GRADIENT }}
              >
                {showForm ? <X size={15} /> : <Plus size={15} />}
                <span>{showForm ? 'إغلاق النموذج' : 'تسجيل كشف جديد'}</span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-4">
          {/* Card 1: Total Visits */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">إجمالي الكشوفات</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                <Stethoscope size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{visits.length}</span>
              <span className="text-[11px] font-medium text-slate-400">زيارة طبية</span>
            </div>
          </motion.div>

          {/* Card 2: Total Cost */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">إجمالي التكلفة</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Receipt size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                {totalCost.toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-medium text-slate-400">ج.م</span>
            </div>
          </motion.div>

          {/* Card 3: Total Paid */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs shadow-slate-200/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">المبلغ المسدد</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-700">
                {totalPaid.toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-medium text-slate-400">ج.م</span>
            </div>
          </motion.div>

          {/* Card 4: Remaining Debt */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => {
              if (totalRemaining > 0) {
                setDebtAmount(totalRemaining);
                setShowDebtModal(true);
              }
            }}
            className={`rounded-2xl border p-4 shadow-2xs transition ${
              totalRemaining > 0
                ? 'cursor-pointer border-rose-200 bg-rose-50/40 hover:shadow-md'
                : 'border-slate-200/80 bg-white/95'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">المتبقي على المريض</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                  totalRemaining > 0
                    ? 'bg-rose-100/80 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}
              >
                <Wallet size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-black ${
                  totalRemaining > 0 ? 'text-rose-600' : 'text-slate-800'
                }`}
              >
                {totalRemaining.toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {totalRemaining > 0 ? 'ج.م (اضغط للسداد)' : 'ج.م'}
              </span>
            </div>
          </motion.div>
        </div>

        {/* ── Add Visit Form (Expandable) ── */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={addVisit}
              className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/50 backdrop-blur-md md:p-8"
            >
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-xs"
                    style={{ background: SIGNATURE_GRADIENT }}
                  >
                    <Stethoscope size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">تسجيل كشف أو زيارة طبية جديدة</h3>
                    <p className="text-[11px] font-medium text-slate-400">
                      إضافة التشخيص الطبي، الوصفة العلاجية، والملاحظات المالية
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* 1. Checkup Type */}
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">نوع الكشف</label>
                  <div className="relative">
                    <select
                      required
                      name="title"
                      defaultValue=""
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/60 p-3 pr-4 pl-10 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    >
                      <option value="" disabled>
                        اختر نوع الكشف الطبي...
                      </option>
                      {checkupTypes.map((type) => (
                        <option key={type._id} value={type.name}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  </div>
                  {!checkupTypes.length && (
                    <p className="mt-1 text-[11px] text-amber-600">
                      لا توجد أنواع كشف مضافة بعد. يمكنك إضافتها من صفحة الإعدادات.
                    </p>
                  )}
                </div>

                {/* 2. Clinic */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">الفرع / العيادة</label>
                  <div className="relative">
                    <select
                      required
                      name="clinic"
                      defaultValue={patient.clinic?._id || ''}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/60 p-3 pr-4 pl-10 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    >
                      {clinics.map((clinic) => (
                        <option key={clinic._id} value={clinic._id}>
                          {clinic.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* 3. Cost */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    سعر الكشف الإجمالي (ج)
                  </label>
                  <input
                    required
                    name="cost"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newTotalCost}
                    onChange={(e) => setNewTotalCost(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                {/* 4. Paid */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    المبلغ المدفوع الآن (ج)
                  </label>
                  <input
                    required
                    name="amount"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newPaidAmount}
                    onChange={(e) => setNewPaidAmount(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                {/* 5. Remaining preview */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">المتبقي</label>
                  <div className="flex items-center h-[42px] rounded-2xl border border-slate-200 bg-slate-100/70 px-4 text-xs font-bold text-rose-600">
                    {Math.max(0, (Number(newTotalCost) || 0) - (Number(newPaidAmount) || 0))} ج.م
                  </div>
                </div>

                {/* 6. Medical details */}
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-sky-800">
                      <Stethoscope size={14} className="text-sky-600" />
                      <span>التشخيص الطبي:</span>
                    </label>
                    <textarea
                      name="diagnosis"
                      rows={3}
                      placeholder="التشخيص النهائي للحالة..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-sky-800">
                      <FileText size={14} className="text-sky-600" />
                      <span>العلاج والوصفة الطبية:</span>
                    </label>
                    <textarea
                      name="treatmentPlan"
                      rows={3}
                      placeholder="الأدوية، الجرعات، والتعليمات العلاجية..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-sky-800">
                      <Edit3 size={14} className="text-sky-600" />
                      <span>ملاحظات طبية خاصة:</span>
                    </label>
                    <textarea
                      name="clinicalNotes"
                      rows={3}
                      placeholder="نتائج الفحص، الحساسية، موعد المتابعة..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <BadgeDollarSign size={14} className="text-emerald-600" />
                      <span>ملاحظات الحسابات والمال:</span>
                    </label>
                    <textarea
                      name="financialNotes"
                      rows={2}
                      placeholder="تفاصيل طريقة الدفع، خصومات، كاش/فيزا، مواعيد سداد المتبقي..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2 md:col-span-3">
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
                    style={{ background: SIGNATURE_GRADIENT }}
                  >
                    {loadingAction ? <RefreshCw size={15} className="animate-spin" /> : <Check size={16} />}
                    <span>حفظ واعتماد الكشف الطبي</span>
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── Main Two-Column Layout ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
          {/* ════════════ Left Column (Sidebar Panels) ════════════ */}
          <aside className="space-y-6">
            {/* Panel 1: Financial & Debts Summary */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/50 backdrop-blur-md"
            >
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Wallet className="h-4 w-4 text-sky-600" />
                  <span>ملخص الحسابات والمديونيات</span>
                </div>
                {totalRemaining > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDebtAmount(totalRemaining);
                      setShowDebtModal(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <CreditCard size={12} />
                    <span>سداد</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-xs font-semibold text-slate-500">عدد الكشوفات</span>
                  <b className="text-sm font-black text-slate-800">{visits.length}</b>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-xs font-semibold text-slate-500">إجمالي التكلفة</span>
                  <b className="text-sm font-black text-slate-900">{totalCost.toLocaleString('ar-EG')} ج</b>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/60 p-3">
                  <span className="text-xs font-semibold text-sky-700">إجمالي المدفوع</span>
                  <b className="text-sm font-black text-sky-900">{totalPaid.toLocaleString('ar-EG')} ج</b>
                </div>

                <div
                  className={`flex items-center justify-between rounded-2xl border p-3 ${
                    totalRemaining > 0
                      ? 'border-rose-200 bg-rose-50/70 text-rose-700'
                      : 'border-emerald-200 bg-emerald-50/70 text-emerald-700'
                  }`}
                >
                  <span className="text-xs font-semibold">المتبقي على المريض</span>
                  <b className="text-sm font-black">{totalRemaining.toLocaleString('ar-EG')} ج</b>
                </div>

                {totalRemaining > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDebtAmount(totalRemaining);
                      setShowDebtModal(true);
                    }}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
                    style={{ background: SIGNATURE_GRADIENT }}
                  >
                    <CheckCircle2 size={14} />
                    <span>تسجيل دفعة سداد للمتبقي</span>
                  </button>
                )}
              </div>
            </motion.div>

            {/* Panel 2: General Medical Notes */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/50 backdrop-blur-md"
            >
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <FileText className="h-4 w-4 text-sky-600" />
                  <span>الملاحظات الطبية العامة</span>
                </div>
                {!editingNotes && admin?.username === 'drahmed' && (
                  <button
                    type="button"
                    onClick={() => setEditingNotes(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800"
                  >
                    <Edit3 size={12} />
                    <span>تعديل</span>
                  </button>
                )}
              </div>

              {editingNotes ? (
                <form onSubmit={handleUpdateNotes} className="space-y-3">
                  <textarea
                    name="medicalNotes"
                    defaultValue={patient.medicalNotes || ''}
                    placeholder="اكتب الملاحظات الطبية، الحساسية، الأمراض المزمنة..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loadingAction}
                      className="flex-1 rounded-xl py-2 text-xs font-bold text-white shadow-sm transition active:scale-95"
                      style={{ background: SIGNATURE_GRADIENT }}
                    >
                      {loadingAction ? <RefreshCw size={13} className="animate-spin mx-auto" /> : 'حفظ التعديل'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNotes(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs leading-relaxed text-slate-600">
                  {patient.medicalNotes || 'لا توجد ملاحظات طبية عامة مسجلة في ملف المريض حتى الآن.'}
                </p>
              )}
            </motion.div>

            {/* Panel 3: Registration & Meta Details */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/50 backdrop-blur-md"
            >
              <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-bold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                <span>بيانات التسجيل والاعتماد</span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">سُجل بواسطة:</span>
                  <span className="font-bold text-slate-800">
                    {patient.createdBy?.name || patient.createdBy?.username || 'سجل عام'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">تاريخ التسجيل:</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(patient.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">الجنسية:</span>
                  <span className="font-semibold text-slate-700">{patient.nationality || 'مصري'}</span>
                </div>
              </div>
            </motion.div>
          </aside>

          {/* ════════════ Right Column (Medical Timeline) ════════════ */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/50 backdrop-blur-md lg:col-span-2"
          >
            {/* Header + Search inside visits */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 font-black text-slate-900">
                <Clock className="h-5 w-5 text-sky-600" />
                <span>السجل الطبي وتاريخ الزيارات ({visits.length})</span>
              </div>

              {visits.length > 0 && (
                <div className="relative min-w-[200px]">
                  <Search
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={visitSearch}
                    onChange={(e) => setVisitSearch(e.target.value)}
                    placeholder="بحث في التشخيص أو الكشوفات..."
                    className="h-8 w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-8 pl-7 text-xs outline-none focus:border-sky-500 focus:bg-white"
                  />
                  {visitSearch && (
                    <button
                      type="button"
                      onClick={() => setVisitSearch('')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {filteredVisits.length > 0 ? (
              <div className="space-y-4">
                <div className="relative space-y-6 border-r-2 border-sky-100 pr-5 mr-2">
                  {filteredVisits.map((visit) => {
                    const cost = Number(visit.cost ?? visit.amount ?? 0);
                    const paid = Number(visit.amount || 0);
                    const remaining = Math.max(0, cost - paid);

                    return (
                      <motion.div
                        key={visit._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 transition hover:border-sky-200 hover:bg-white hover:shadow-xs"
                      >
                        {/* Timeline Node Point */}
                        <div className="absolute -right-[27px] top-6 h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-600 shadow-2xs" />

                        {/* Top: Title + Clinic + Financial pills */}
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900">{visit.title}</h4>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingVisit({
                                    ...visit,
                                    cost: cost,
                                    amount: paid,
                                    diagnosis: visit.diagnosis || visit.notes || '',
                                    treatmentPlan: visit.treatmentPlan || '',
                                    clinicalNotes: visit.clinicalNotes || '',
                                    financialNotes: visit.financialNotes || '',
                                  })
                                }
                                className="rounded-lg p-1 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition"
                                title="تعديل تفاصيل الكشف والملاحظات"
                              >
                                <Edit3 size={14} />
                              </button>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                              <span className="flex items-center gap-1 font-semibold text-slate-600">
                                <Calendar size={12} className="text-sky-600" />
                                {new Date(visit.visitDate || visit.createdAt).toLocaleDateString('ar-EG', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                              {visit.clinic?.name && (
                                <span className="flex items-center gap-1 font-medium text-slate-500">
                                  <Building2 size={12} className="text-sky-600" />
                                  {visit.clinic.name}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Financial Pills */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs">
                              السعر: {cost.toLocaleString('ar-EG')} ج
                            </span>
                            <span className="rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-1 font-bold text-sky-900">
                              المدفوع: {paid.toLocaleString('ar-EG')} ج
                            </span>
                            {remaining > 0 ? (
                              <span className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 font-bold text-rose-600">
                                المتبقي: {remaining.toLocaleString('ar-EG')} ج
                              </span>
                            ) : (
                              <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
                                مسدد بالكامل
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Medical Sections */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          {/* Diagnosis */}
                          <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3 text-slate-700">
                            <div className="flex items-center gap-1.5 font-bold text-sky-800 mb-1">
                              <Stethoscope size={13} className="text-sky-600" />
                              <span>التشخيص الطبي:</span>
                            </div>
                            <p className="leading-relaxed">
                              {visit.diagnosis || visit.notes || (
                                <span className="text-slate-400 italic">لم يُسجل تشخيص</span>
                              )}
                            </p>
                          </div>

                          {/* Prescription & Treatment */}
                          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3 text-slate-700">
                            <div className="flex items-center gap-1.5 font-bold text-indigo-800 mb-1">
                              <FileText size={13} className="text-indigo-600" />
                              <span>العلاج والوصفة:</span>
                            </div>
                            <p className="leading-relaxed">
                              {visit.treatmentPlan || (
                                <span className="text-slate-400 italic">لا توجد وصفة مسجلة</span>
                              )}
                            </p>
                          </div>

                          {/* Clinical Notes */}
                          <div className="rounded-2xl border border-slate-200/80 bg-white p-3 text-slate-700">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                              <Edit3 size={13} className="text-slate-600" />
                              <span>ملاحظات طبية خاصة:</span>
                            </div>
                            <p className="leading-relaxed">
                              {visit.clinicalNotes || (
                                <span className="text-slate-400 italic">لا توجد ملاحظات خاصة</span>
                              )}
                            </p>
                          </div>

                          {/* Financial Notes */}
                          {visit.financialNotes && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 text-slate-700 md:col-span-3">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                                <BadgeDollarSign size={14} className="text-emerald-600" />
                                <span>ملاحظات الحسابات والمال:</span>
                              </div>
                              <p className="leading-relaxed">{visit.financialNotes}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-14 text-center text-xs text-slate-400">
                <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p>
                  {visitSearch
                    ? `لا توجد نتائج تطابق بحثك عن "${visitSearch}".`
                    : 'لا توجد زيارات مسجلة للمريض حتى الآن.'}
                </p>
              </div>
            )}
          </motion.section>
        </div>
      </div>

      {/* ── Modal: Edit Patient Info ── */}
      <AnimatePresence>
        {editingPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.form
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onSubmit={handleUpdatePatient}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl md:p-7"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-xs"
                    style={{ background: SIGNATURE_GRADIENT }}
                  >
                    <Edit3 size={15} />
                  </span>
                  <h3 className="text-sm font-black text-slate-900">تعديل بيانات المريض</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPatient(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الاسم الكامل</label>
                  <input
                    required
                    name="fullName"
                    defaultValue={patient.fullName}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">رقم الهاتف</label>
                  <input
                    required
                    name="phone"
                    defaultValue={patient.phone}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">العمر</label>
                  <input
                    required
                    min="0"
                    max="150"
                    type="number"
                    name="age"
                    defaultValue={patient.age}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">النوع / الجنس</label>
                  <select
                    name="gender"
                    defaultValue={patient.gender}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الجنسية</label>
                  <input
                    required
                    name="nationality"
                    defaultValue={patient.nationality}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الرقم القومي</label>
                  <input
                    name="nationalId"
                    defaultValue={patient.nationalId || ''}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">الفرع / العيادة</label>
                  <select
                    name="clinic"
                    defaultValue={patient.clinic?._id || ''}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  >
                    {clinics.map((clinic) => (
                      <option key={clinic._id} value={clinic._id}>
                        {clinic.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 rounded-2xl py-3 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
                  style={{ background: SIGNATURE_GRADIENT }}
                >
                  {loadingAction ? <RefreshCw size={14} className="animate-spin mx-auto" /> : 'حفظ التعديلات'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPatient(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Pay Debt ── */}
      <AnimatePresence>
        {showDebtModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-xs"
                    style={{ background: SIGNATURE_GRADIENT }}
                  >
                    <Receipt size={16} />
                  </span>
                  <h4 className="text-sm font-black text-slate-900">سداد مديونية جلسات سابقة</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDebtModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handlePayDebt} className="mt-4 space-y-4">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                  <span className="text-xs font-semibold text-slate-600 block">
                    إجمالي المبلغ المستحق على المريض:
                  </span>
                  <b className="mt-1 block text-2xl font-black text-rose-600">
                    {totalRemaining.toLocaleString('ar-EG')} ج.م
                  </b>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    المبلغ المراد سداده الآن (ج)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={totalRemaining}
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    placeholder="أدخل المبلغ المدفوع..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="flex-1 rounded-2xl py-3 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
                    style={{ background: SIGNATURE_GRADIENT }}
                  >
                    {loadingAction ? (
                      <RefreshCw size={14} className="animate-spin mx-auto" />
                    ) : (
                      'تأكيد السداد وتحديث الكشوفات'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDebtModal(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Edit Visit ── */}
      <AnimatePresence>
        {editingVisit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-xs"
                    style={{ background: SIGNATURE_GRADIENT }}
                  >
                    <Edit3 size={15} />
                  </span>
                  <h4 className="text-sm font-black text-slate-900">تعديل تفاصيل الكشف والحسابات</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingVisit(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUpdateVisit} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">عنوان الكشف</label>
                  <input
                    required
                    value={editingVisit.title}
                    onChange={(e) => setEditingVisit({ ...editingVisit, title: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">السعر الإجمالي</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={editingVisit.cost}
                      onChange={(e) => setEditingVisit({ ...editingVisit, cost: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">المدفوع</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={editingVisit.amount}
                      onChange={(e) => setEditingVisit({ ...editingVisit, amount: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">المتبقي</label>
                    <div className="flex h-[38px] items-center rounded-2xl bg-slate-100 px-3 text-xs font-bold text-rose-600">
                      {Math.max(0, (Number(editingVisit.cost) || 0) - (Number(editingVisit.amount) || 0))} ج
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-sky-800 block mb-1">التشخيص الطبي</label>
                    <textarea
                      rows={2}
                      value={editingVisit.diagnosis || ''}
                      onChange={(e) => setEditingVisit({ ...editingVisit, diagnosis: e.target.value })}
                      placeholder="التشخيص النهائي..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-sky-800 block mb-1">العلاج والوصفة</label>
                    <textarea
                      rows={2}
                      value={editingVisit.treatmentPlan || ''}
                      onChange={(e) => setEditingVisit({ ...editingVisit, treatmentPlan: e.target.value })}
                      placeholder="الأدوية والجرعات..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-sky-800 block mb-1">ملاحظات طبية خاصة</label>
                    <textarea
                      rows={2}
                      value={editingVisit.clinicalNotes || ''}
                      onChange={(e) => setEditingVisit({ ...editingVisit, clinicalNotes: e.target.value })}
                      placeholder="نتائج الفحص أو المتابعة..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-800 flex items-center gap-1 mb-1">
                      <BadgeDollarSign size={13} className="text-emerald-600" />
                      <span>ملاحظات الحسابات والمال:</span>
                    </label>
                    <textarea
                      rows={2}
                      value={editingVisit.financialNotes || ''}
                      onChange={(e) =>
                        setEditingVisit({ ...editingVisit, financialNotes: e.target.value })
                      }
                      placeholder="تفاصيل طريقة الدفع، الخصومات، أو مواعيد السداد..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="flex-1 rounded-2xl py-3 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
                    style={{ background: SIGNATURE_GRADIENT }}
                  >
                    {loadingAction ? <RefreshCw size={14} className="animate-spin mx-auto" /> : 'حفظ التعديلات'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingVisit(null)}
                    className="rounded-2xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
