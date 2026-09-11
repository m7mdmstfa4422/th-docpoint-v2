import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../AuthProvider';
import img from '../../assets/logo.png';
import { api } from '../../api';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  Stethoscope,
  HeartPulse,
  CheckCircle2,
  Code,
  Activity,
  Zap,
  Shield,
} from 'lucide-react';

/* ── small floating orb ── */
function Orb({ className, animate, transition }) {
  return (
    <motion.div
      animate={animate}
      transition={{ ...transition, repeat: Infinity, ease: 'easeInOut' }}
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
    />
  );
}

/* ── animated background particles ── */
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-sky-400/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [-20, 20, -20], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ── animated stat / feature badge for the left panel ── */
function FeatureBadge({ icon: Icon, label, value, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20">
        <Icon size={16} className="text-cyan-300" />
      </div>
      <div>
        <p className="text-[10px] text-sky-200/60">{label}</p>
        <p className="text-xs font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
}

/* ── input field ── */
function InputField({ id, name, type, value, onChange, placeholder, label, icon: Icon, right, children }) {
  return (
    <div className="space-y-1.5 text-right">
      {label && (
        <label className="text-xs font-semibold text-slate-500" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type={type}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3.5 pr-11 pl-4 text-sm text-slate-800 transition-all duration-200 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100/80"
        />
        <Icon size={17} className="absolute right-3.5 text-slate-400" />
        {children}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', rememberMe: false });
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = await api('/auth/login', { method: 'POST', body: JSON.stringify(formData) });
      auth.login({ ...result, remember: formData.rememberMe });
      navigate(result.admin.role === 'developer' ? '/developer' : '/');
    } catch (err) {
      setError(err.message || 'بيانات الدخول غير صحيحة، يرجى المحاولة مجدداً');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative flex h-screen w-screen items-center justify-center overflow-hidden p-4 antialiased"
      style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 40%, #e8f4fd 70%, #dbeafe 100%)' }}
      dir="rtl"
    >
      {/* Background orbs */}
      <Orb
        className="h-[40rem] w-[40rem] -top-32 -right-32 bg-sky-300/30"
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 18 }}
      />
      <Orb
        className="h-[36rem] w-[36rem] -bottom-32 -left-32 bg-cyan-300/25"
        animate={{ x: [0, -70, 0], y: [0, -50, 0], scale: [1, 1.3, 1] }}
        transition={{ duration: 22, delay: 2 }}
      />
      <Orb
        className="h-[20rem] w-[20rem] top-1/3 left-1/4 bg-indigo-200/20"
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 14, delay: 1 }}
      />

      {/* Floating medical cross / pattern */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px w-40 bg-gradient-to-r from-transparent via-sky-400/20 to-transparent"
            style={{ top: `${15 + i * 15}%`, left: `${i % 2 === 0 ? '-5%' : '60%'}` }}
            animate={{ x: i % 2 === 0 ? [0, 120, 0] : [0, -120, 0], opacity: [0, 0.5, 0] }}
            transition={{ duration: 8 + i * 2, delay: i * 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <Particles />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 grid h-full max-h-[660px] w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-2xl shadow-sky-900/10 backdrop-blur-2xl md:grid-cols-[1.1fr_1fr]"
      >
        {/* ── LEFT PANEL: branding ── */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0c2340] via-[#0a3a6b] to-[#041524] p-8 text-white md:flex">

          {/* subtle grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,.5) 39px,rgba(255,255,255,.5) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,.5) 39px,rgba(255,255,255,.5) 40px)`,
            }}
          />

          {/* photo overlay */}
          <img
            src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80"
            alt="العيادة الطبية"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.18] mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#041524]/95 via-[#041524]/50 to-transparent" />

          {/* glow accent top-right */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />

          {/* Header row */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative z-10 flex items-center justify-between"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold backdrop-blur-md">
              <Zap size={12} className="text-yellow-300" />
              منظومة الرعاية الذكية
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-rose-400"
            >
              <HeartPulse size={22} />
            </motion.div>
          </motion.div>

          {/* Center content */}
          <div className="relative z-10 my-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7 }}
            >
              <div className="mb-1 text-[11px] font-medium tracking-[0.2em] text-sky-400/80 uppercase">
                DocPoint System
              </div>
              <h2 className="text-4xl font-black leading-tight tracking-tight text-white">
                إدارة
                <span className="block text-transparent bg-clip-text bg-gradient-to-l from-cyan-300 to-sky-400">
                  العيادات الذكية
                </span>
              </h2>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-sky-100/60">
                منصة متكاملة لإدارة ملفات المرضى، الكشوفات، والإيرادات في بيئة آمنة ومشفرة.
              </p>
            </motion.div>

            {/* Feature badges */}
            <div className="space-y-2.5">
              <FeatureBadge icon={CheckCircle2} label="التقارير الطبية" value="حفظ تلقائي فوري" delay={0.6} />
              <FeatureBadge icon={Activity} label="الإيرادات والأداء" value="تتبع لحظي للفروع" delay={0.75} />
              <FeatureBadge icon={Shield} label="درجة التشفير" value="256-bit SSL مشفر" delay={0.9} />
            </div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="relative z-10 flex items-center gap-2 text-xs text-sky-200/50"
          >
            <Stethoscope size={15} />
            <span>نظام الإدارة الطبية الموحد v2.0</span>
          </motion.div>
        </div>

        {/* ── RIGHT PANEL: form ── */}
        <div className="flex flex-col justify-between overflow-y-auto p-7 sm:p-10">
          <div className="my-auto flex w-full max-w-sm flex-col justify-center mx-auto">

            {/* Logo + title */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.55 }}
              className="mb-8 flex items-center gap-3"
            >
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100 p-1.5 shadow-md shadow-sky-200/50">
                <img src={img} alt="Clinic Logo" className="h-full w-full object-contain" />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-sky-400/30"
                />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">تسجيل الدخول</h1>
                <p className="text-[11px] font-semibold text-sky-600">لوحة التحكم الإدارية · DocPoint</p>
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-5 flex items-center gap-2.5 overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-600"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.55 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Username */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-500" htmlFor="username">
                  اسم المستخدم
                </label>
                <div className="relative flex items-center">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Username"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3.5 pr-11 pl-4 text-sm text-slate-800 transition-all duration-200 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100/80"
                  />
                  <motion.div
                    animate={{ color: focusedField === 'username' ? '#0ea5e9' : '#94a3b8' }}
                    className="absolute right-3.5"
                  >
                    <User size={17} />
                  </motion.div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-500" htmlFor="password">
                  كلمة المرور
                </label>
                <div className="relative flex items-center">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3.5 pr-11 pl-10 text-sm text-slate-800 transition-all duration-200 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100/80"
                  />
                  <motion.div
                    animate={{ color: focusedField === 'password' ? '#0ea5e9' : '#94a3b8' }}
                    className="absolute right-3.5"
                  >
                    <Lock size={17} />
                  </motion.div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 text-slate-400 transition-colors hover:text-slate-600"
                    aria-label="تبديل ظهور كلمة المرور"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={showPassword ? 'off' : 'on'}
                        initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.7, rotate: 10 }}
                        transition={{ duration: 0.18 }}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </motion.div>
                    </AnimatePresence>
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5 pt-1 text-right">
                <div className="relative">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white checked:border-sky-500 checked:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all"
                  />
                  <CheckCircle2
                    size={12}
                    className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                  />
                </div>
                <label htmlFor="rememberMe" className="cursor-pointer select-none text-xs font-medium text-slate-500">
                  تذكر بيانات الدخول
                </label>
              </div>

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="group relative mt-2 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)' }}
              >
                {/* shimmer */}
                <motion.div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                />

                <AnimatePresence mode="wait" initial={false}>
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Loader2 size={18} className="animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2.5"
                    >
                      <span>دخول لوحة التحكم</span>
                      <ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.form>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-4 flex flex-col items-center gap-1.5 border-t border-slate-100 pt-4 text-center"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>بوابة وصول طبية مشفرة 256-bit</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Code size={12} className="text-sky-400" />
              <span>تم التطوير بواسطة</span>
              <a
                href="https://m7mdmstfa4422.github.io/MoMustafa/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sky-600 transition-colors hover:text-sky-700 hover:underline"
              >
                Mohammed Mustafa
              </a>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
