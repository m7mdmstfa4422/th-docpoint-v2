import { useContext, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
  Loader2,
  Stethoscope,
  ChevronDown,
  X,
  CreditCard,
  CheckCircle2,
  Receipt,
  BadgeDollarSign
} from 'lucide-react';
import { api } from '../../api';
import { AuthContext } from '../../AuthProvider';

export default function PatientProfile() {
  const { id } = useParams();
  const { admin } = useContext(AuthContext);

  const [data, setData] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [checkupTypes, setCheckupTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingPatient, setEditingPatient] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtAmount, setDebtAmount] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState('');

  const [newTotalCost, setNewTotalCost] = useState('');
  const [newPaidAmount, setNewPaidAmount] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api(`/patients/${id}`);
      setData(res);
    } catch (error) {
      setMessage(error.message || 'تعذر تحميل ملف المريض');
    }
  }, [id]);

  useEffect(() => {
    load();
    api('/clinics').then((res) => setClinics(Array.isArray(res) ? res : []));
    api('/checkup-types').then((res) => setCheckupTypes(Array.isArray(res) ? res : [])).catch(() => setCheckupTypes([]));
  }, [load]);

  if (!data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        <p className="text-sm font-medium text-slate-500">{message || 'جارٍ تحميل ملف المريض...'}</p>
      </div>
    );
  }

  const { patient, visits = [] } = data;

  const totalCost = visits.reduce((sum, v) => sum + Number(v.cost ?? v.amount ?? 0), 0);
  const totalPaid = visits.reduce((sum, v) => sum + Number(v.amount || 0), 0);
  const totalRemaining = Math.max(0, totalCost - totalPaid);

  // إضافة كشف جديد
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
          financialNotes: form.get('financialNotes'), // التعاملات المالية
          cost: cost,
          amount: amount,
          clinic: form.get('clinic'),
          status: 'مكتمل',
        }),
      });
      setShowForm(false);
      setNewTotalCost('');
      setNewPaidAmount('');
      load();
    } catch (error) {
      setMessage(error.message || 'تعذر تسجيل الزيارة');
    } finally {
      setLoadingAction(false);
    }
  };

  // تعديل كشف وملاحظاته
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
          financialNotes: editingVisit.financialNotes, // ملاحظات المال
          cost: Number(editingVisit.cost || 0),
          amount: Number(editingVisit.amount || 0),
        }),
      });
      setEditingVisit(null);
      load();
    } catch (error) {
      setMessage(error.message || 'تعذر تحديث بيانات الكشف');
    } finally {
      setLoadingAction(false);
    }
  };

  const saveMedicalRecord = async () => {
    if (!editingVisit) return;
    setLoadingAction(true);
    try {
      await api(`/visits/${editingVisit._id}/medical-record`, {
        method: 'PUT',
        body: JSON.stringify({ diagnosis: editingVisit.diagnosis, treatmentPlan: editingVisit.treatmentPlan, clinicalNotes: editingVisit.clinicalNotes }),
      });
      setMessage('تم حفظ التشخيص والعلاج والملاحظات الطبية لهذا الكشف في قاعدة البيانات.');
      await load();
    } catch (error) { setMessage(error.message || 'تعذر حفظ الملف الطبي للكشف'); }
    finally { setLoadingAction(false); }
  };

  // سداد مديونية (يعدل خانة المال وملاحظات الحسابات تلقائياً)
  const handlePayDebt = async (e) => {
    e.preventDefault();
    const payVal = Number(debtAmount);
    if (!payVal || payVal <= 0) return;
    setLoadingAction(true);

    try {
      await api(`/patients/${id}/pay-debt`, {
        method: 'POST',
        body: JSON.stringify({ amount: payVal })
      });
      setShowDebtModal(false);
      setDebtAmount('');
      await load();
    } catch (error) {
      setMessage(error.message || 'تعذر تسجيل سداد المبلغ');
    } finally {
      setLoadingAction(false);
    }
  };

  // الملاحظات العامة للمريض
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
      load();
    } catch (error) {
      setMessage(error.message || 'تعذر تحديث الملاحظات');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUpdatePatient = async (event) => {
    event.preventDefault();
    setLoadingAction(true);
    const form = new FormData(event.currentTarget);
    try {
      await api(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName: form.get('fullName'), age: Number(form.get('age')), gender: form.get('gender'),
          nationality: form.get('nationality'), nationalId: form.get('nationalId'), birthDate: form.get('birthDate') || null,
          phone: form.get('phone'), clinic: form.get('clinic'),
        }),
      });
      setEditingPatient(false);
      await load();
    } catch (error) { setMessage(error.message || 'تعذر حفظ بيانات المريض'); }
    finally { setLoadingAction(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 text-slate-800 md:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header Profile */}
        <motion.header
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700">
                <User className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
                    {patient.fullName}
                  </h1>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-0.5 text-xs font-bold text-sky-800">
                    ملف طبي رقمي
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 md:text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-sky-600" />
                    {patient.age} سنة
                  </span>
                  <span className="flex items-center gap-1.5 font-medium" dir="ltr">
                    <Phone className="h-3.5 w-3.5 text-sky-600" />
                    {patient.phone || 'بدون هاتف'}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Globe2 className="h-3.5 w-3.5 text-sky-600" />
                    {patient.nationality || 'غير محددة'}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Building2 className="h-3.5 w-3.5 text-sky-600" />
                    {patient.clinic?.name || 'غير محددة'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(admin?.username === 'drahmed' || admin?.role === 'developer') && <button onClick={() => setEditingPatient(true)} className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-sky-700 hover:bg-sky-50"><Edit3 className="h-4 w-4" />تعديل بيانات المريض</button>}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(!showForm)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-3 font-bold text-white shadow-md shadow-sky-900/15 transition-all hover:brightness-105"><Plus className="h-4 w-4" /><span>{showForm ? 'إغلاق النموذج' : 'إضافة زيارة جديدة'}</span></motion.button>
            </div>
          </div>
        </motion.header>

        <AnimatePresence>
          {editingPatient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
              <motion.form
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onSubmit={handleUpdatePatient}
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-black text-slate-900">تعديل بيانات المريض</h3>
                  <button
                    type="button"
                    onClick={() => setEditingPatient(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Inputs Grid */}
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold text-slate-600">
                    الاسم
                    <input
                      required
                      name="fullName"
                      defaultValue={patient.fullName}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all"
                    />
                  </label>

                  <label className="text-xs font-bold text-slate-600">
                    رقم الهاتف
                    <input
                      required
                      name="phone"
                      defaultValue={patient.phone}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all"
                    />
                  </label>

                  <label className="text-xs font-bold text-slate-600">
                    العمر
                    <input
                      required
                      min="0"
                      max="150"
                      type="number"
                      name="age"
                      defaultValue={patient.age}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all"
                    />
                  </label>

                  <label className="text-xs font-bold text-slate-600">
                    الجنس
                    <select
                      name="gender"
                      defaultValue={patient.gender}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all"
                    >
                      <option value="ذكر">ذكر</option>
                      <option value="أنثى">أنثى</option>
                    </select>
                  </label>

                  <label className="text-xs font-bold text-slate-600">
                    الجنسية
                    <input
                      required
                      name="nationality"
                      defaultValue={patient.nationality}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all"
                    />
                  </label>

                  <label className="text-xs font-bold text-slate-600">
                    الرقم القومي
                    <input
                      name="nationalId"
                      defaultValue={patient.nationalId || ''}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all"
                    />
                  </label>

                  <label className="text-xs font-bold text-slate-600">
                    العيادة
                    <select
                      name="clinic"
                      defaultValue={patient.clinic?._id || ''}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition-all"
                    >
                      {clinics.map((clinic) => (
                        <option key={clinic._id} value={clinic._id}>
                          {clinic.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-2">
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="flex-1 rounded-xl bg-sky-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 transition-all"
                  >
                    {loadingAction ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPatient(false)}
                    className="rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.form>
            </div>
          )}
        </AnimatePresence>
        {/* Add Visit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={addVisit}
              className="overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-sm md:p-8"
            >
              <div className="mb-5 flex items-center gap-2.5 font-bold text-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <span>تسجيل كشف أو زيارة طبية جديدة</span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">نوع الكشف</label>
                  <div className="relative">
                    <select required name="title" defaultValue="" className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/60 p-3 pr-4 pl-10 text-sm text-slate-800 outline-none transition-all focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100">
                      <option value="" disabled>اختر نوع الكشف من الإعدادات</option>
                      {checkupTypes.map((type) => <option key={type._id} value={type.name}>{type.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  </div>
                  {!checkupTypes.length && <p className="mt-1 text-[11px] text-amber-600">لا توجد أنواع كشف بعد. أضفها من صفحة الإعدادات أولاً.</p>}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">الفرع / العيادة</label>
                  <div className="relative">
                    <select
                      required
                      name="clinic"
                      defaultValue={patient.clinic?._id || ''}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/60 p-3 pr-4 pl-10 text-sm text-slate-800 outline-none transition-all focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100"
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

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">سعر الكشف الإجمالي (ج)</label>
                  <input
                    required
                    name="cost"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newTotalCost}
                    onChange={(e) => setNewTotalCost(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-800 outline-none transition-all focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">المبلغ المدفوع الآن (ج)</label>
                  <input
                    required
                    name="amount"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newPaidAmount}
                    onChange={(e) => setNewPaidAmount(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-800 outline-none transition-all focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">المتبقي</label>
                  <div className="flex items-center h-[46px] rounded-2xl border border-slate-200 bg-slate-100/70 px-4 text-sm font-bold text-rose-600">
                    {Math.max(0, (Number(newTotalCost) || 0) - (Number(newPaidAmount) || 0))} ج.م
                  </div>
                </div>

                {/* الملف الطبي الخاص بهذه الزيارة مستقل تماماً عن المالية */}
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-sky-800">
                      <Stethoscope className="h-4 w-4 text-sky-600" />
                      <span>التشخيص الطبي:</span>
                    </label>
                    <textarea
                      name="diagnosis"
                      rows={3}
                      placeholder="التشخيص النهائي للحالة..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-800 outline-none transition-all focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-sky-800"><FileText className="h-4 w-4 text-sky-600" /><span>العلاج والوصفة:</span></label>
                    <textarea name="treatmentPlan" rows={3} placeholder="الأدوية، الجرعات، والتعليمات العلاجية..." className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-800 outline-none transition-all focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100" />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-sky-800"><Edit3 className="h-4 w-4 text-sky-600" /><span>ملاحظات طبية خاصة:</span></label>
                    <textarea name="clinicalNotes" rows={3} placeholder="نتائج الفحص، الحساسية، موعد المتابعة..." className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-800 outline-none transition-all focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100" />
                  </div>

                  <div className="md:col-span-3">
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <BadgeDollarSign className="h-4 w-4 text-emerald-600" />
                      <span>ملاحظات الحسابات والمال:</span>
                    </label>
                    <textarea
                      name="financialNotes"
                      rows={3}
                      placeholder="تفاصيل طريقة الدفع، خصومات، كاش/فيزا، مواعيد سداد المتبقي..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-800 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="pt-2 md:col-span-3">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loadingAction}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105"
                  >
                    {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    <span>حفظ واعتماد الكشف</span>
                  </motion.button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Sidebar */}
          <aside className="space-y-6">

            {/* ملخص الحسابات والزيارات */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-800">
                  <Wallet className="h-4 w-4 text-sky-600" />
                  <span>ملخص الحسابات والزيارات</span>
                </div>
                {totalRemaining > 0 && (
                  <button
                    onClick={() => {
                      setDebtAmount(totalRemaining);
                      setShowDebtModal(true);
                    }}
                    className="flex items-center gap-1 rounded-xl bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-100 transition-colors"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>سداد مديونية</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <span className="text-xs font-semibold text-slate-500">عدد الكشوفات</span>
                  <b className="text-lg font-black text-slate-800">{visits.length}</b>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <span className="text-xs font-semibold text-slate-500">إجمالي التكلفة</span>
                  <b className="text-lg font-black text-slate-900">{totalCost.toLocaleString('ar-EG')} ج</b>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/60 p-3.5">
                  <span className="text-xs font-semibold text-sky-700">إجمالي المدفوع</span>
                  <b className="text-lg font-black text-sky-900">{totalPaid.toLocaleString('ar-EG')} ج</b>
                </div>

                <div className={`flex items-center justify-between rounded-2xl border p-3.5 ${totalRemaining > 0 ? 'border-rose-200 bg-rose-50/70 text-rose-700' : 'border-emerald-200 bg-emerald-50/70 text-emerald-700'
                  }`}>
                  <span className="text-xs font-semibold">المتبقي على المريض</span>
                  <b className="text-lg font-black">{totalRemaining.toLocaleString('ar-EG')} ج</b>
                </div>

                {totalRemaining > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setDebtAmount(totalRemaining);
                      setShowDebtModal(true);
                    }}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 py-3 text-xs font-bold text-white shadow-sm hover:brightness-105"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>تسجيل دفعة سداد للمتبقي</span>
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* General Medical Notes */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-800">
                  <FileText className="h-4 w-4 text-sky-600" />
                  <span>الملاحظات الطبية العامة</span>
                </div>
                {!editingNotes && admin?.username === 'drahmed' && (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800"
                  >
                    <Edit3 className="h-3 w-3" />
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-800 outline-none transition-all focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={loadingAction}
                      className="flex-1 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-sm hover:brightness-105"
                    >
                      {loadingAction ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'حفظ التعديل'}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setEditingNotes(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm leading-relaxed text-slate-600">
                  {patient.medicalNotes || 'لا توجد ملاحظات طبية عامة مسجلة في ملف المريض حتى الآن.'}
                </p>
              )}
            </motion.div>
          </aside>

          {/* Visits Timeline History (السجل الطبي وتاريخ الزيارات) */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm lg:col-span-2"
          >
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Clock className="h-5 w-5 text-sky-700" />
                <span>السجل الطبي وتاريخ الزيارات ({visits.length})</span>
              </div>
            </div>

            {visits.length ? (
              <div className="max-h-[620px] overflow-y-auto pl-2 pr-1 [scrollbar-color:#7dd3fc_transparent] [scrollbar-width:thin]">
                <div className="relative space-y-6 border-r-2 border-sky-100 pr-6 mr-3">
                  {visits.map((visit) => {
                    const cost = Number(visit.cost ?? visit.amount ?? 0);
                    const paid = Number(visit.amount || 0);
                    const remaining = Math.max(0, cost - paid);

                    return (
                      <motion.div
                        key={visit._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative rounded-2xl border border-slate-100 bg-[#F8FAFC]/70 p-5 transition-all hover:border-sky-200 hover:bg-white hover:shadow-sm"
                      >
                        <div className="absolute -right-[31px] top-6 h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-600 shadow-sm" />

                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-slate-900">{visit.title}</h4>
                              <button
                                onClick={() => setEditingVisit({
                                  ...visit,
                                  cost: cost,
                                  amount: paid,
                                  diagnosis: visit.diagnosis || visit.notes || '',
                                  treatmentPlan: visit.treatmentPlan || '',
                                  clinicalNotes: visit.clinicalNotes || '',
                                  financialNotes: visit.financialNotes || ''
                                })}
                                className="rounded-lg p-1 text-slate-400 hover:bg-sky-50 hover:text-sky-600"
                                title="تعديل تفاصيل الكشف والملاحظات"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-sky-600" />
                                {new Date(visit.visitDate || visit.createdAt).toLocaleDateString('ar-EG')}
                              </span>
                              {visit.clinic?.name && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3 text-sky-600" />
                                  {visit.clinic.name}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* أرقام المال */}
                          <div className="flex flex-wrap items-center gap-2 self-start text-xs">
                            <span className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
                              السعر: {cost.toLocaleString('ar-EG')} ج
                            </span>
                            <span className="rounded-xl border border-sky-100 bg-sky-50 px-2.5 py-1 font-bold text-sky-900">
                              المدفوع: {paid.toLocaleString('ar-EG')} ج
                            </span>
                            {remaining > 0 ? (
                              <span className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 font-bold text-rose-600">
                                المتبقي: {remaining.toLocaleString('ar-EG')} ج
                              </span>
                            ) : (
                              <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-bold text-emerald-600">
                                تم السداد بالكامل
                              </span>
                            )}
                          </div>
                        </div>

                        {/* قسم الملاحظات المنفصل تماماً */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3 text-slate-700">
                            <div className="flex items-center gap-1.5 font-bold text-sky-800 mb-1">
                              <Stethoscope className="h-3.5 w-3.5 text-sky-600" />
                              <span>التشخيص الطبي:</span>
                            </div>
                            <p className="leading-relaxed">
                              {visit.diagnosis || visit.notes ? (visit.diagnosis || visit.notes) : <span className="text-slate-400 italic">لم يُسجل تشخيص</span>}
                            </p>
                          </div>
                          <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3 text-slate-700"><div className="flex items-center gap-1.5 font-bold text-sky-800 mb-1"><FileText className="h-3.5 w-3.5 text-sky-600" /><span>العلاج والوصفة:</span></div><p className="leading-relaxed">{visit.treatmentPlan || <span className="text-slate-400 italic">لا توجد وصفة مسجلة</span>}</p></div>
                          <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3 text-slate-700"><div className="flex items-center gap-1.5 font-bold text-sky-800 mb-1"><Edit3 className="h-3.5 w-3.5 text-sky-600" /><span>ملاحظات طبية خاصة:</span></div><p className="leading-relaxed">{visit.clinicalNotes || <span className="text-slate-400 italic">لا توجد ملاحظات خاصة</span>}</p></div>

                          {/* 2. ملاحظات الحسابات والمال */}
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 text-slate-700 md:col-span-3">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                              <BadgeDollarSign className="h-3.5 w-3.5 text-emerald-600" />
                              <span>ملاحظات الحسابات والمال:</span>
                            </div>
                            <p className="leading-relaxed">
                              {visit.financialNotes ? visit.financialNotes : <span className="text-slate-400 italic">لا توجد ملاحظات مالية</span>}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-slate-400">
                <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p>لا توجد زيارات مسجلة للمريض حتى الآن.</p>
              </div>
            )}
          </motion.section>

        </div>

        {/* Modal سداد مديونية قديمة */}
        <AnimatePresence>
          {showDebtModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDebtModal(false)}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-sky-600" />
                    <h4 className="font-bold text-slate-900">سداد مديونية جلسات سابقة</h4>
                  </div>
                  <button onClick={() => setShowDebtModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handlePayDebt} className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                    <span className="text-xs font-semibold text-slate-500">إجمالي المبلغ المستحق على المريض:</span>
                    <b className="mt-1 block text-2xl font-black text-rose-600">{totalRemaining.toLocaleString('ar-EG')} ج.م</b>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">المبلغ المراد سداده وتوزيعه مالياً (ج)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      max={totalRemaining}
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                      placeholder="أدخل المبلغ المدفوع..."
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-sky-600 focus:bg-white"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={loadingAction}
                      className="flex-1 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-105"
                    >
                      {loadingAction ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'تأكيد السداد وتحديث الكشوفات'}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setShowDebtModal(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal تعديل كشف وملاحظاته */}
        <AnimatePresence>
          {editingVisit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingVisit(null)}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h4 className="font-bold text-slate-900">تعديل تفاصيل الكشف والحسابات</h4>
                  <button onClick={() => setEditingVisit(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleUpdateVisit} className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">عنوان الكشف</label>
                    <input
                      required
                      value={editingVisit.title}
                      onChange={(e) => setEditingVisit({ ...editingVisit, title: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-800 outline-none focus:border-sky-600 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">السعر الإجمالي</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={editingVisit.cost}
                        onChange={(e) => setEditingVisit({ ...editingVisit, cost: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-800 outline-none focus:border-sky-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">المدفوع</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={editingVisit.amount}
                        onChange={(e) => setEditingVisit({ ...editingVisit, amount: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-800 outline-none focus:border-sky-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">المتبقي</label>
                      <div className="mt-1 flex h-[42px] items-center rounded-xl bg-slate-100 px-3 text-sm font-bold text-rose-600">
                        {Math.max(0, (Number(editingVisit.cost) || 0) - (Number(editingVisit.amount) || 0))} ج
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div><label className="text-xs font-bold text-sky-800">التشخيص الطبي</label><textarea rows={3} value={editingVisit.diagnosis || ''} onChange={(e) => setEditingVisit({ ...editingVisit, diagnosis: e.target.value })} placeholder="التشخيص النهائي..." className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-sky-600" /></div>
                    <div><label className="text-xs font-bold text-sky-800">العلاج والوصفة</label><textarea rows={3} value={editingVisit.treatmentPlan || ''} onChange={(e) => setEditingVisit({ ...editingVisit, treatmentPlan: e.target.value })} placeholder="الأدوية والجرعات..." className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-sky-600" /></div>
                    <div><label className="text-xs font-bold text-sky-800">ملاحظات طبية خاصة</label><textarea rows={3} value={editingVisit.clinicalNotes || ''} onChange={(e) => setEditingVisit({ ...editingVisit, clinicalNotes: e.target.value })} placeholder="نتائج الفحص أو المتابعة..." className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-sky-600" /></div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <BadgeDollarSign className="h-3.5 w-3.5 text-emerald-600" />
                      <span>ملاحظات الحسابات والمال:</span>
                    </label>
                    <textarea
                      rows={2}
                      value={editingVisit.financialNotes || ''}
                      onChange={(e) => setEditingVisit({ ...editingVisit, financialNotes: e.target.value })}
                      placeholder="تفاصيل طريقة الدفع، الخصومات، أو مواعيد السداد..."
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={loadingAction}
                      className="flex-1 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-105"
                    >
                      {loadingAction ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'حفظ التعديلات'}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setEditingVisit(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {message && (
          <p className="rounded-2xl bg-rose-50 p-4 text-center text-xs font-semibold text-rose-500 border border-rose-100">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
