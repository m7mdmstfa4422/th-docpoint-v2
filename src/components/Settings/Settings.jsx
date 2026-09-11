import { useEffect, useState, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ShieldCheck,
  Plus,
  MapPin,
  Stethoscope,
  Phone,
  UserPlus,
  Sparkles,
  Check,
  AlertCircle,
  X,
  Pencil,
  Loader2,
  Activity,
  Trash2,
  DollarSign,
  Bell,
  Clock,
  Mail,
  MessageSquare,
  Volume2,
  Save
} from 'lucide-react';
import { api } from '../../api';
import { AuthContext } from '../../AuthProvider';

// Settings Tabs Configuration
const SETTINGS_TABS = [
  { id: 'clinic', label: 'بيانات العيادة', icon: Building2 },
  { id: 'notifications', label: 'التنبيهات', icon: Bell },
  { id: 'admins', label: 'المشرفين', icon: ShieldCheck }
];

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

// Toggle Switch Component
function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked
          ? 'bg-gradient-to-r from-sky-600 to-cyan-500'
          : 'bg-slate-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <motion.span
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
        initial={false}
        animate={{ x: checked ? 26 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// Confirmation Modal Component
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'تأكيد', cancelText = 'إلغاء' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl"
      >
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md"
            style={{
              background: 'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
            }}
          >
            {confirmText}
          </motion.button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            {cancelText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Settings() {
  const { admin: currentAdmin } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('clinic');
  const [clinics, setClinics] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [checkupTypes, setCheckupTypes] = useState([]);
  const [loadingClinic, setLoadingClinic] = useState(false);
  const [loadingCheckup, setLoadingCheckup] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null });
  const { showToast, ToastContainer } = useToast();

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('clinic_notification_settings');
    return saved ? JSON.parse(saved) : {
      smsReminders: true,
      whatsappNotifications: true,
      audioAlerts: true,
      dailySummaryEmail: false,
      appointmentReminders: true,
      paymentReminders: true
    };
  });

  const loadClinics = useCallback(async () => {
    try {
      const data = await api('/clinics');
      setClinics(data);
    } catch (err) {
      showToast(err.message || 'فشل جلب العيادات', 'error');
    }
  }, [showToast]);

  const loadCheckupTypes = useCallback(async () => {
    try {
      const data = await api('/checkup-types');
      setCheckupTypes(data);
    } catch (err) {
      showToast(err.message || 'فشل جلب أنواع الكشف', 'error');
    }
  }, [showToast]);

  const loadAdmins = useCallback(async () => {
    try {
      const data = await api('/admins');
      setAdmins(data.filter((admin) => currentAdmin?.role === 'developer' || (admin.role !== 'developer' && admin.username !== 'developer')));
    } catch (err) {
      showToast(err.message || 'فشل جلب المشرفين', 'error');
    }
  }, [showToast, currentAdmin?.role]);

  useEffect(() => {
    loadClinics();
    loadCheckupTypes();
    loadAdmins();
  }, [loadClinics, loadCheckupTypes, loadAdmins]);

  // Save Notification Settings
  const handleSaveNotificationSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem('clinic_notification_settings', JSON.stringify(notificationSettings));
      setIsSaving(false);
      showToast('تم حفظ إعدادات التنبيهات بنجاح');
    }, 500);
  };

  // Execute confirmed action from modal
  const executeConfirmedAction = () => {
    // Stub function for future use if confirmation modals are needed
    setConfirmModal({ isOpen: false, title: '', message: '', action: null });
  };

  // Clinic Management
  const handleAddClinic = async (e) => {
    e.preventDefault();
    setLoadingClinic(true);
    const form = new FormData(e.currentTarget);
    try {
      await api('/clinics', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(form))
      });
      e.target.reset();
      showToast('تم تسجيل الفرع بنجاح');
      loadClinics();
    } catch (err) {
      showToast(err.message || 'تعذر إضافة العيادة', 'error');
    } finally {
      setLoadingClinic(false);
    }
  };

  // Checkup Types Management
  const handleAddCheckupType = async (e) => {
    e.preventDefault();
    setLoadingCheckup(true);
    const form = new FormData(e.currentTarget);
    try {
      await api('/checkup-types', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(form))
      });
      e.target.reset();
      showToast('تم إضافة نوع الكشف بنجاح');
      loadCheckupTypes();
    } catch (err) {
      showToast(err.message || 'تعذر إضافة نوع الكشف', 'error');
    } finally {
      setLoadingCheckup(false);
    }
  };

  const handleDeleteCheckupType = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف نوع الكشف (${name})؟`)) return;
    try {
      await api(`/checkup-types/${id}`, { method: 'DELETE' });
      showToast('تم حذف نوع الكشف بنجاح');
      loadCheckupTypes();
    } catch (err) {
      showToast(err.message || 'تعذر حذف نوع الكشف', 'error');
    }
  };

  // Admin Management
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api('/admins', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(form))
      });
      e.target.reset();
      showToast('تم إنشاء حساب المشرف بنجاح');
      loadAdmins();
    } catch (err) {
      showToast(err.message || 'تعذر إنشاء الحساب', 'error');
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;
    try {
      await api(`/admins/${editingAdmin._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingAdmin.name,
          username: editingAdmin.username,
          ...(editingAdmin.password ? { password: editingAdmin.password } : {})
        })
      });
      showToast('تم تحديث بيانات المشرف');
      setEditingAdmin(null);
      loadAdmins();
    } catch (err) {
      showToast(err.message || 'فشل حفظ التعديلات', 'error');
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (admin.username === 'drahmed' || !window.confirm(`هل تريد حذف حساب ${admin.name}؟`)) return;
    try {
      await api(`/admins/${admin._id}`, { method: 'DELETE' });
      showToast('تم حذف حساب المشرف.');
      loadAdmins();
    } catch (err) {
      showToast(err.message || 'تعذر حذف الحساب', 'error');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 text-slate-800 md:p-8" dir="rtl">
      <ToastContainer />

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
              إعدادات النظام
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">
              الإعدادات والتفضيلات
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              تخصيص العيادة، المواعيد، الإشعارات، والأمان
            </p>
          </div>
        </motion.header>

        {/* Settings Tabs */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm shadow-slate-200/50"
        >
          <div className="flex flex-wrap gap-2">
            {SETTINGS_TABS.map((tab) => {
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
                      layoutId="activeSettingTab"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background:
                          'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
                      }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Clinic Tab */}
            {activeTab === 'clinic' && (
              <>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
                  <div className="mb-5 flex items-center gap-2.5 font-bold text-slate-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span>إضافة منشأة طبية جديدة</span>
                  </div>

                  <form onSubmit={handleAddClinic} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative">
                      <Building2 className="absolute right-3.5 top-3.5 h-4 w-4 text-sky-700/50" />
                      <input
                        required
                        name="name"
                        placeholder="اسم العيادة"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 py-3 pr-10 pl-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:shadow-sm"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute right-3.5 top-3.5 h-4 w-4 text-sky-700/50" />
                      <input
                        required
                        name="location"
                        placeholder="الموقع / الفرع"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 py-3 pr-10 pl-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:shadow-sm"
                      />
                    </div>
                    <div className="relative">
                      <Stethoscope className="absolute right-3.5 top-3.5 h-4 w-4 text-sky-700/50" />
                      <input
                        name="specialty"
                        placeholder="التخصص الطبي"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 py-3 pr-10 pl-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:shadow-sm"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute right-3.5 top-3.5 h-4 w-4 text-sky-700/50" />
                      <input
                        name="phone"
                        placeholder="رقم التواصل"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 py-3 pr-10 pl-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:shadow-sm"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={loadingClinic}
                      className="flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white shadow-md shadow-sky-900/15 transition-all hover:brightness-105 md:col-span-2 lg:col-span-4 disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
                      }}
                    >
                      {loadingClinic ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      ) : (
                        <>
                          <span>حفظ الفرع</span>
                          <Plus className="h-4 w-4" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                      الفروع المسجلة ({clinics.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {clinics.map((clinic) => (
                      <motion.div
                        key={clinic._id}
                        whileHover={{ y: -4 }}
                        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 transition-all hover:border-sky-300 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                            <Building2 className="h-5 w-5" />
                          </div>
                          {clinic.specialty && (
                            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                              {clinic.specialty}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mb-3">{clinic.name}</h4>
                        <div className="space-y-2 text-xs text-slate-500">
                          <p className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-sky-600" />
                            <span>{clinic.location}</span>
                          </p>
                          {clinic.phone && (
                            <p className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-sky-600" />
                              <span>{clinic.phone}</span>
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Checkup Types Section */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
                  <div className="mb-5 flex items-center gap-2.5 font-bold text-slate-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                      <Activity className="h-4 w-4" />
                    </div>
                    <span>إضافة نوع كشف طبي</span>
                  </div>

                  <form onSubmit={handleAddCheckupType} className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <Stethoscope className="absolute right-3.5 top-3.5 h-4 w-4 text-sky-700/50" />
                      <input
                        required
                        name="name"
                        placeholder="نوع الكشف (مثال: كشف عام، استشارة)"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 py-3 pr-10 pl-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:shadow-sm"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={loadingCheckup}
                      className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white shadow-md shadow-sky-900/15 transition-all hover:brightness-105"
                      style={{
                        background: 'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
                      }}
                    >
                      {loadingCheckup ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      ) : (
                        <>
                          <span>إضافة</span>
                          <Plus className="h-4 w-4" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                      أنواع الكشف ({checkupTypes.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {checkupTypes.map((type) => (
                      <motion.div
                        key={type._id}
                        whileHover={{ y: -3 }}
                        className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/50 transition-all hover:border-sky-300 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                            <Activity className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-slate-800 text-sm">{type.name}</span>
                        </div>

                        <button
                          onClick={() => handleDeleteCheckupType(type._id, type.name)}
                          className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">إعدادات التنبيهات</h3>
                    <p className="text-xs text-slate-400">تخصيص الإشعارات والتذكيرات</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-sky-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">تذكيرات SMS</p>
                        <p className="text-xs text-slate-500">إرسال رسائل نصية للمرضى</p>
                      </div>
                    </div>
                    <Toggle
                      checked={notificationSettings.smsReminders}
                      onChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, smsReminders: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">إشعارات واتساب</p>
                        <p className="text-xs text-slate-500">تذكيرات عبر WhatsApp</p>
                      </div>
                    </div>
                    <Toggle
                      checked={notificationSettings.whatsappNotifications}
                      onChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, whatsappNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">تنبيهات صوتية</p>
                        <p className="text-xs text-slate-500">صوت عند الحجوزات الجديدة</p>
                      </div>
                    </div>
                    <Toggle
                      checked={notificationSettings.audioAlerts}
                      onChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, audioAlerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-violet-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">ملخص يومي بالبريد</p>
                        <p className="text-xs text-slate-500">إرسال تقرير يومي للإدارة</p>
                      </div>
                    </div>
                    <Toggle
                      checked={notificationSettings.dailySummaryEmail}
                      onChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, dailySummaryEmail: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-cyan-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">تذكيرات المواعيد</p>
                        <p className="text-xs text-slate-500">إشعار قبل الموعد بـ 24 ساعة</p>
                      </div>
                    </div>
                    <Toggle
                      checked={notificationSettings.appointmentReminders}
                      onChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, appointmentReminders: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-rose-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">تذكيرات السداد</p>
                        <p className="text-xs text-slate-500">إشعار بالمديونيات المتبقية</p>
                      </div>
                    </div>
                    <Toggle
                      checked={notificationSettings.paymentReminders}
                      onChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, paymentReminders: checked })
                      }
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3 pt-6 border-t border-slate-100">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleSaveNotificationSettings}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md shadow-sky-900/15 transition-all hover:brightness-105 disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
                    }}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>حفظ التعديلات</span>
                  </motion.button>
                </div>
              </div>
            )}

            {/* Admins Tab */}
            {activeTab === 'admins' && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">إدارة حسابات المشرفين</h3>
                    <p className="text-xs text-slate-400">التحكم في الوصول والصلاحيات</p>
                  </div>
                </div>

                <form onSubmit={handleAddAdmin} className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <input
                    required
                    name="name"
                    placeholder="اسم المشرف"
                    className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:shadow-sm"
                  />
                  <input
                    required
                    name="username"
                    placeholder="اسم المستخدم"
                    className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:shadow-sm"
                  />
                  <input
                    required
                    name="password"
                    type="password"
                    placeholder="كلمة المرور"
                    className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:shadow-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-900/15 transition-all hover:brightness-105"
                    style={{
                      background: 'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>إضافة</span>
                  </motion.button>
                </form>

                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/40">
                  {admins.map((admin) => (
                    <div key={admin._id} className="flex items-center justify-between p-4 transition-colors hover:bg-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 font-bold text-sky-800">
                          {admin.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{admin.name}</div>
                          <div className="text-xs text-slate-400">@{admin.username}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEditingAdmin({ ...admin, password: '' })}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-sky-600 hover:text-sky-700"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>تعديل</span>
                        </motion.button>
                        {admin.username !== 'drahmed' && (
                          <button
                            onClick={() => handleDeleteAdmin(admin)}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Edit Admin Modal */}
      <AnimatePresence>
        {editingAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingAdmin(null)}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="font-bold text-slate-900">تعديل بيانات الحساب</h4>
                <button
                  onClick={() => setEditingAdmin(null)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleUpdateAdmin} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">الاسم</label>
                  <input
                    value={editingAdmin.name}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 text-sm text-slate-800 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">اسم المستخدم</label>
                  <input
                    value={editingAdmin.username}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, username: e.target.value })}
                    disabled={editingAdmin.username === 'drahmed'}
                    className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 text-sm text-slate-800 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">كلمة مرور جديدة (اختياري)</label>
                  <input
                    type="password"
                    value={editingAdmin.password || ''}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value })}
                    placeholder="••••••••"
                    className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 text-sm text-slate-800 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white shadow-md shadow-sky-900/15 transition-all hover:brightness-105"
                    style={{
                      background: 'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)'
                    }}
                  >
                    حفظ التعديلات
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setEditingAdmin(null)}
                    className="rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, action: null })}
          onConfirm={executeConfirmedAction}
          title={confirmModal.title}
          message={confirmModal.message}
        />
      </AnimatePresence>
    </div>
  );
}
