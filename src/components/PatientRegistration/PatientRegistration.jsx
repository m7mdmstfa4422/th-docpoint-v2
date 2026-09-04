import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  User, 
  Calendar, 
  Phone, 
  Globe2, 
  CreditCard, 
  Building2, 
  FileText, 
  Wallet, 
  Check, 
  AlertCircle, 
  X, 
  Loader2, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { api } from '../../api';

// --- أنماط التحقق (Regular Expressions) ---
const REGEX = {
  // اسم ثلاثي على الأقل (عربي فقط أو إنجليزي فقط مع مسافات فاصلة)
  NAME: /^([\u0621-\u064A]{2,}\s+[\u0621-\u064A]{2,}\s+[\u0621-\u064A]{2,}(\s+[\u0621-\u064A]{2,})*|[a-zA-Z]{2,}\s+[a-zA-Z]{2,}\s+[a-zA-Z]{2,}(\s+[a-zA-Z]{2,})*)$/,
  // الرقم القومي: 14 رقم بالضبط (اختياري، أو 14 رقم إذا تم إدخاله)
  NATIONAL_ID: /^[0-9]{14}$/,
  // رقم هاتف دولي ومحلي يدعم مفاتيح الدول (+ / 00) وأرقام من 7 إلى 15 خانة
  INTERNATIONAL_PHONE: /^(\+|00)?[0-9\s\-()]{7,20}$/
};

const initialForm = { 
  fullName: '', 
  age: '', 
  gender: 'ذكر', 
  nationality: 'مصري', 
  nationalId: '', 
  birthDate: '', 
  phone: '', 
  medicalNotes: '', 
  clinic: '', 
  initialFee: '' 
};

// Custom Toast Hook لإدارة التنبيهات
function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const ToastContainer = () => (
    <div className="fixed bottom-6 left-6 z-50 pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-sky-100 bg-white/95 px-5 py-3.5 text-slate-800 shadow-xl shadow-slate-200/60 backdrop-blur-xl"
          >
            {toast.type === 'success' ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 text-sky-600 border border-sky-200">
                <Check className="h-3.5 w-3.5" />
              </span>
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-500 border border-rose-200">
                <AlertCircle className="h-3.5 w-3.5" />
              </span>
            )}
            <p className="text-xs font-semibold text-slate-700">{toast.msg}</p>
            <button
              onClick={() => setToast(null)}
              className="mr-2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return { showToast, ToastContainer };
}

const inputClass = (hasError) => 
  `w-full text-sm px-3.5 py-3 bg-slate-50/60 border ${
    hasError ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-sky-600 focus:ring-sky-100'
  } rounded-2xl text-slate-800 placeholder-slate-400 outline-none transition-all focus:bg-white focus:ring-2`;

export default function PatientRegistration() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    api('/clinics')
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setClinics(list);
        if (list.length > 0) {
          setForm((prev) => ({ ...prev, clinic: prev.clinic || list[0]._id }));
        }
      })
      .catch(() => showToast('تعذر تحميل قائمة العيادات. تأكد من تشغيل الخادم.', 'error'));
  }, [showToast]);

  const validateField = (name, value) => {
    let error = '';
    const trimmed = typeof value === 'string' ? value.trim() : value;

    switch (name) {
      case 'fullName':
        if (!trimmed) {
          error = 'اسم المريض مطلوب';
        } else if (!REGEX.NAME.test(trimmed)) {
          error = 'يجب إدخال اسم ثلاثي صحيح (عربي فقط أو إنجليزي فقط)';
        }
        break;

      case 'age': {
        const ageNum = Number(value);
        if (!value || isNaN(ageNum)) {
          error = 'العمر مطلوب';
        } else if (ageNum < 0 || ageNum >= 100) {
          error = 'يجب أن يكون العمر أقل من 100 سنة وأكبر من 0';
        }
        break;
      }

      case 'nationalId':
        if (trimmed && !REGEX.NATIONAL_ID.test(trimmed)) {
          error = 'الرقم القومي يجب أن يتكون من 14 رقم بالضبط';
        }
        break;

      case 'phone':
        if (!trimmed) {
          error = 'رقم الهاتف مطلوب';
        } else if (!REGEX.INTERNATIONAL_PHONE.test(trimmed)) {
          error = 'رقم الهاتف غير صالح (يدعم الأرقام الدولية والمحلية)';
        }
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const update = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    validateField(name, value);
  };

  const submit = async (event) => {
    event.preventDefault();

    // التحقق من كافة الحقول المشروطة
    const isNameValid = validateField('fullName', form.fullName);
    const isAgeValid = validateField('age', form.age);
    const isPhoneValid = validateField('phone', form.phone);
    const isNationalIdValid = validateField('nationalId', form.nationalId);

    if (!isNameValid || !isAgeValid || !isPhoneValid || !isNationalIdValid) {
      showToast('يرجى مراجعة وتصحيح الحقول المميزة باللون الأحمر', 'error');
      return;
    }

    setLoading(true);
    try {
      await api('/patients', { 
        method: 'POST', 
        body: JSON.stringify({ 
          ...form, 
          fullName: form.fullName.trim(),
          age: Number(form.age),
          phone: form.phone.trim(),
          nationalId: form.nationalId.trim() || undefined,
          initialFee: Number(form.initialFee || 0)
        }) 
      });
      setForm({ ...initialForm, clinic: clinics[0]?._id || '' });
      setErrors({});
      showToast('✨ تم تسجيل بيانات المريض بنجاح وفق المعايير');
    } catch (error) {
      if (error.field === 'nationalId') setErrors((prev) => ({ ...prev, nationalId: error.message }));
      if (error.field === 'patientDuplicate') {
        setErrors((prev) => ({ ...prev, fullName: error.message, phone: error.message }));
      }
      showToast(error.message || 'تعذر حفظ البيانات. تأكد من تشغيل الخادم.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 text-slate-800 md:p-8" dir="rtl">
      <ToastContainer />

      <div className="mx-auto max-w-5xl space-y-8">
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
                <Sparkles className="h-3.5 w-3.5 text-sky-600" /> تسجيل السجلات الطبية
              </div>
              <h1 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
                إضافة ملف مريض جديد
              </h1>
              <p className="mt-1 text-xs text-slate-500 md:text-sm">
                تسجيل البيانات الشخصية والطبية مع التحقق التلقائي من صحة المدخلات
              </p>
            </div>
          </div>
        </motion.header>

        {/* Registration Form */}
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={submit}
          className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm space-y-8 md:p-8"
        >
          {/* Personal Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                <User className="h-4 w-4" />
              </div>
              <span>البيانات الشخصية والأساسية</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="اسم المريض ثلاثي " icon={User} error={errors.fullName}>
                <input 
                  required 
                  name="fullName" 
                  value={form.fullName} 
                  onChange={update} 
                  onBlur={handleBlur}
                  placeholder="مثال: أحمد محمد عبد الرحمن / John David Smith" 
                  className={inputClass(!!errors.fullName)} 
                />
              </Field>

              <Field label="العمر " icon={Calendar} error={errors.age}>
                <input 
                  required 
                  name="age" 
                  value={form.age} 
                  onChange={update} 
                  onBlur={handleBlur}
                  type="number" 
                  min="0" 
                  max="99" 
                  placeholder="مثال: 32" 
                  className={inputClass(!!errors.age)} 
                />
              </Field>

              <Field label="الجنس" icon={User}>
                <div className="relative">
                  <select 
                    name="gender" 
                    value={form.gender} 
                    onChange={update} 
                    className={`${inputClass(false)} appearance-none pr-3.5 pl-10`}
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </Field>

              <Field label="الجنسية" icon={Globe2}>
                <input 
                  required 
                  name="nationality" 
                  value={form.nationality} 
                  onChange={update} 
                  placeholder="مثال: مصري، سعودي، أردني..." 
                  className={inputClass(false)} 
                />
              </Field>

              <Field label="الرقم القومي (14 رقم)" icon={CreditCard} error={errors.nationalId}>
                <input 
                  name="nationalId" 
                  value={form.nationalId} 
                  onChange={update} 
                  onBlur={handleBlur}
                  placeholder="14 رقم قومي" 
                  maxLength={14}
                  className={inputClass(!!errors.nationalId)} 
                />
              </Field>

             

              <Field label="العيادة المستهدفة" icon={Building2}>
                <div className="relative">
                  <select
                    required
                    name="clinic"
                    value={form.clinic}
                    onChange={update}
                    className={`${inputClass(false)} appearance-none pr-3.5 pl-10`}
                  >
                    <option value="" disabled>اختر العيادة...</option>
                    {clinics.map((clinic) => (
                      <option key={clinic._id} value={clinic._id}>
                        {clinic.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </Field>

             
            </div>
          </section>

          {/* Contact Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                <Phone className="h-4 w-4" />
              </div>
              <span>بيانات التواصل والاتصال</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="رقم الهاتف (دولي أو محلي)" icon={Phone} error={errors.phone}>
                <input 
                  required 
                  name="phone" 
                  value={form.phone} 
                  onChange={update} 
                  onBlur={handleBlur}
                  type="tel" 
                  placeholder="+201xxxxxxxxx / 05xxxxxxx" 
                  className={inputClass(!!errors.phone)} 
                  dir="ltr" 
                />
              </Field>
            </div>
          </section>

          {/* Medical Notes */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                <FileText className="h-4 w-4" />
              </div>
              <span>البيانات والملاحظات الطبية</span>
            </div>

            <div>
              <Field label="ملاحظات طبية أولية (حساسية، أمراض مزمنة، شكوى رئيسية)">
                <textarea 
                  name="medicalNotes" 
                  value={form.medicalNotes} 
                  onChange={update} 
                  rows={3} 
                  placeholder="اكتب هنا أي تفاصيل طبية أولية للمريض..." 
                  className={inputClass(false)} 
                />
              </Field>
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-sky-900/15 transition-all hover:brightness-105 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span>حفظ وتسجيل المريض</span>
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, error, children }) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        {Icon && <Icon className="h-3.5 w-3.5 text-sky-600" />}
        <span>{label}</span>
      </label>
      {children}
      {error && (
        <p className="text-[11px] font-medium text-rose-500 animate-in fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
