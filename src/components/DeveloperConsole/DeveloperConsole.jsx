import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarCheck2, 
  Ban, 
  KeyRound, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  Clock, 
  AlertCircle,
  Code2,
  Terminal,
  Cpu,
  ExternalLink
} from 'lucide-react';
import { api } from '../../api';

export default function DeveloperConsole() {
  const [subscription, setSubscription] = useState(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const data = await api('/developer/subscription');
      setSubscription(data);
    } catch (error) {
      setMessage({ text: error.message || 'فشل تحميل البيانات', type: 'error' });
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const action = async (path, successMsg, body) => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await api(path, {
        method: 'POST',
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (response.code) setCode(response.code);
      setMessage({ text: successMsg, type: 'success' });
      await load();
    } catch (error) {
      setMessage({ text: error.message || 'حدث خطأ أثناء تنفيذ العملية', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = subscription?.expiresAt && new Date(subscription.expiresAt) < new Date();
  const isActive = subscription?.active && !isExpired;

  return (
    <div className="relative min-h-screen overflow-hidden bg-white p-4 text-slate-800 antialiased md:p-10" dir="rtl">
      
      {/* هالات خلفية ناعمة بتدرج سماوي وأزرق */}
      <motion.div 
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -top-32 -right-32 h-[30rem] w-[30rem] rounded-full bg-sky-100/80 blur-3xl" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="pointer-events-none absolute -bottom-32 -left-32 h-[30rem] w-[30rem] rounded-full bg-cyan-100/70 blur-3xl" 
      />

      <div className="relative z-10 mx-auto max-w-5xl space-y-8">
        
        {/* الترويسة الرئيسية */}
        <header className="flex flex-col gap-4 rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-lg shadow-sky-600/20">
              <Terminal size={28} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">لوحة تحكم المطوّر</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                  <Sparkles size={11} className="text-sky-600" />
                  DEV CONSOLE
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">إدارة الاشتراكات السحابية، أمان التراخيص وتوليد مفاتيح التفعيل للعيادة</p>
            </div>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="flex items-center justify-center gap-2 self-start rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 sm:self-center disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-sky-600' : ''} />
            <span>تحديث البيانات</span>
          </button>
        </header>

        {/* رسائل التنبيه والنجاح */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-xs font-bold shadow-xs ${
                message.type === 'error'
                  ? 'border-rose-200 bg-rose-50/90 text-rose-600'
                  : 'border-emerald-200 bg-emerald-50/90 text-emerald-700'
              }`}
            >
              {message.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
              <span>{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* شبكة بطاقات حالة الاشتراك والعمليات */}
        <div className="grid gap-5 md:grid-cols-3">
          
          {/* بطاقة حالة الاشتراك */}
          <motion.div
            whileHover={{ y: -3 }}
            className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">حالة الاشتراك الحالي</span>
                <span className={`flex h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
              </div>

              <div className="mt-4">
                <span className={`text-2xl font-black tracking-tight ${isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isActive ? 'نشط ويعمل' : 'متوقف / منتهٍ'}
                </span>
                <p className="mt-1 text-[11px] text-slate-400">حالة الترخيص على الخادم السحابي</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <Clock size={14} className="text-sky-600" />
              <span>تاريخ الانتهاء:</span>
              <span className="font-bold text-slate-800">
                {subscription?.expiresAt
                  ? new Date(subscription.expiresAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : '—'}
              </span>
            </div>
          </motion.div>

          {/* بطاقة تفعيل وتمديد الترخيص */}
          <motion.div
            whileHover={{ y: -3 }}
            className="flex flex-col justify-between rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-600 shadow-xs">
                <CalendarCheck2 size={20} />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">تمديد التفعيل</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                اختر مدة التمديد. يُضاف الوقت إلى تاريخ الانتهاء الحالي إن كان الاشتراك نشطاً.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              {[
                { months: 1, label: 'شهر' },
                { months: 3, label: '3 شهور' },
                { months: 6, label: '6 شهور' },
                { months: 12, label: 'سنة' },
              ].map(({ months, label }) => (
                <button
                  key={months}
                  onClick={() => action('/developer/subscription/activate', `تم تفعيل وتمديد الاشتراك بنجاح لمدة ${label}.`, { months })}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-2 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                >
                  <CalendarCheck2 size={15} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* بطاقة تعطيل وإيقاف النظام */}
          <motion.div
            whileHover={{ y: -3 }}
            className="flex flex-col justify-between rounded-3xl border border-rose-100 bg-rose-50/40 p-6 shadow-sm"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-600 shadow-xs">
                <Ban size={20} />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">تعطيل النظام</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                قفل إمكانية الوصول إلى المنظومة فوراً وإيقاف الشاشات مؤقتاً.
              </p>
            </div>

            <button
              onClick={() => action('/developer/subscription/stop', 'تم إيقاف الاشتراك وقفل المنظومة.')}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50"
            >
              <Ban size={16} />
              <span>تعطيل الخدمة الآن</span>
            </button>
          </motion.div>

        </div>

        {/* قسم توليد أكواد التفعيل */}
        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                  <KeyRound size={18} />
                </div>
                <h2 className="text-base font-bold text-slate-900">توليد مفتاح ترخيص (License Code)</h2>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                يقوم هذا الإجراء بإبطال المفتاح السابق وإنشاء كود جديد مشفر يُسلّم للعيادة لتجديد الترخيص.
              </p>
            </div>

            <button
              onClick={() => action('/developer/subscription/code', 'تم إنشاء كود تفعيل جديد بنجاح.')}
              disabled={loading}
              className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-sky-600 to-indigo-900 px-6 py-3.5 text-xs font-bold text-white shadow-md shadow-sky-900/15 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles size={16} />
              <span>إصدار مفتاح جديد</span>
            </button>
          </div>

          {/* صندوق عرض المفتاح المولد */}
          {code && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-sky-200 bg-sky-50/60 p-4 sm:flex-row sm:p-5"
            >
              <div className="flex items-center gap-3">
                <Code2 className="text-sky-700" size={22} />
                <span className="font-mono text-lg font-black tracking-widest text-sky-950">
                  {code}
                </span>
              </div>

              <button
                onClick={copyToClipboard}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-xs font-bold text-sky-800 shadow-xs transition-all hover:bg-sky-600 hover:text-white active:scale-95 sm:w-auto"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-600">تم النسخ بنجاح</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>نسخ المفتاح</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </section>

        {/* تذييل المطور */}
        <footer className="flex items-center justify-center gap-1.5 pt-4 text-xs font-medium text-slate-400">
          <Cpu size={14} className="text-sky-600" />
          <span>تم التطوير بواسطة</span>
          <a
            href="https://m7mdmstfa4422.github.io/MoMustafa/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-sky-700 hover:underline"
          >
            <span>م/ محمد مصطفى</span>
            <ExternalLink size={11} />
          </a>
        </footer>

      </div>
    </div>
  );
}
