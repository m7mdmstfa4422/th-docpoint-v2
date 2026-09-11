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
  Check,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { api } from '../../api';

// --- Validation Patterns ---
const REGEX = {
  NAME: /^([ء-ي]{2,}\s+[ء-ي]{2,}\s+[ء-ي]{2,}(\s+[ء-ي]{2,})*|[a-zA-Z]{2,}\s+[a-zA-Z]{2,}\s+[a-zA-Z]{2,}(\s+[a-zA-Z]{2,})*)$/,
  NATIONAL_ID: /^[0-9]{14}$/,
  INTERNATIONAL_PHONE: /^(\+|00)?[0-9\s\-()]{7,20}$/
};

const initialForm = {
  fullName: '',
  age: '',
  gender: 'ذكر',
  nationality: 'مصري',
  nationalId: '',
  phone: '',
  clinic: ''
};

// Custom Toast Hook
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
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border bg-white/95 px-5 py-3.5 shadow-xl shadow-slate-200/60 backdrop-blur-xl"
            style={{
              borderColor: toast.type === 'success' ? 'rgb(186 230 253)' : 'rgb(254 205 211)'
            }}
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
    hasError ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200/80 focus:border-sky-500 focus:ring-sky-100'
  } rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all focus:bg-white focus:ring-2 focus:shadow-sm`;

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
        } else if (ageNum <= 0 || ageNum >= 120) {
          error = 'يجب إدخال عمر صحيح بين 1 و 120';
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
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    validateField(name, value);
  };

  const validateAll = () => {
    const isNameValid = validateField('fullName', form.fullName);
    const isAgeValid = validateField('age', form.age);
    const isPhoneValid = validateField('phone', form.phone);
    const isNationalIdValid = validateField('nationalId', form.nationalId);

    return isNameValid && isAgeValid && isPhoneValid && isNationalIdValid;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!validateAll()) {
      showToast('يرجى مراجعة وتصحيح الحقول المميزة', 'error');
      return;
    }

    setLoading(true);
    try {
      await api('/patients', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          age: Number(form.age),
          gender: form.gender,
          nationality: form.nationality.trim(),
          phone: form.phone.trim(),
          nationalId: form.nationalId.trim() || undefined,
          clinic: form.clinic || undefined
        })
      });

      setForm({ ...initialForm, clinic: clinics[0]?._id || '' });
      setErrors({});
      showToast('✨ تم تسجيل بيانات المريض بنجاح');
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
    <div className="min-h-screen bg-slate-50/70 p-4 text-slate-800 md:p-8" dir="rtl">
      <ToastContainer />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50"
        >
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" /> تسجيل السجلات الطبية
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
              إضافة ملف مريض جديد
            </h1>
            <p className="mt-1 text-xs text-slate-500 md:text-sm">
              تسجيل البيانات الشخصية والأساسية للمريض مع التحقق الفوري من صحة المدخلات
            </p>
          </div>
        </motion.header>

        {/* Form Container */}
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={submit}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 md:p-8"
        >
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md shadow-sky-900/10"
              style={{
                background: 'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
              }}
            >
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">البيانات الشخصية والأساسية</h3>
              <p className="text-xs text-slate-500">معلومات التعريف والتواصل الخاصة بالمريض</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="اسم المريض ثلاثي" icon={User} error={errors.fullName} required>
              <input
                required
                name="fullName"
                value={form.fullName}
                onChange={update}
                onBlur={handleBlur}
                placeholder="مثال: أحمد محمد عبد الرحمن"
                className={inputClass(!!errors.fullName)}
              />
            </Field>

            <Field label="العمر" icon={Calendar} error={errors.age} required>
              <input
                required
                name="age"
                value={form.age}
                onChange={update}
                onBlur={handleBlur}
                type="number"
                min="1"
                max="120"
                placeholder="مثال: 32"
                className={inputClass(!!errors.age)}
              />
            </Field>

            <Field label="الجنس" icon={User} required>
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

            <Field label="الجنسية" icon={Globe2} required>
              <input
                required
                name="nationality"
                value={form.nationality}
                onChange={update}
                placeholder="مثال: مصري، سعودي، أردني"
                className={inputClass(false)}
              />
            </Field>

            <Field label="الرقم القومي" icon={CreditCard} error={errors.nationalId}>
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

            <Field label="رقم الهاتف" icon={Phone} error={errors.phone} required>
              <input
                required
                name="phone"
                value={form.phone}
                onChange={update}
                onBlur={handleBlur}
                type="tel"
                placeholder="+201xxxxxxxxx"
                className={inputClass(!!errors.phone)}
                dir="ltr"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="العيادة المستهدفة" icon={Building2} required>
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
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-md shadow-sky-900/15 transition-all hover:brightness-105 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
              }}
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

function Field({ label, icon: Icon, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        {Icon && <Icon className="h-3.5 w-3.5 text-sky-600" />}
        <span>{label}</span>
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-[11px] font-medium text-rose-500 flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}