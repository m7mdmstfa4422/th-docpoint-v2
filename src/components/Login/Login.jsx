import { useState, useContext } from 'react';
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
  AlertCircle,
  Check,
  Code,
} from 'lucide-react';

/* ─── Calmer, Dreamy Ambient Floating Particles ─── */
function CalmAmbientParticles() {
  const particles = [
    { id: 1, x: 12, y: 20, size: 4, duration: 18, delay: 0 },
    { id: 2, x: 82, y: 25, size: 5, duration: 22, delay: 2 },
    { id: 3, x: 22, y: 70, size: 3.5, duration: 16, delay: 1 },
    { id: 4, x: 75, y: 78, size: 4.5, duration: 20, delay: 3 },
    { id: 5, x: 48, y: 15, size: 3, duration: 19, delay: 1.5 },
    { id: 6, x: 88, y: 60, size: 4, duration: 24, delay: 2.5 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-sky-400/20 blur-[1px]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-12, 12, -12],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Soft Pastel 3D Organic Waves (Light & Calm) ─── */
function CalmOrganicShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* ── Soft Ambient Radial Blooms ── */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.45, 0.3],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 left-1/2 -translate-x-1/2 h-[34rem] w-[34rem] rounded-full bg-sky-300/30 blur-[130px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute -bottom-36 left-1/4 h-[32rem] w-[32rem] rounded-full bg-cyan-200/35 blur-[140px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute top-1/3 -right-24 h-[30rem] w-[30rem] rounded-full bg-blue-200/30 blur-[130px]"
      />

      {/* ── Top Floating Torus Ring ── */}
      <motion.div
        animate={{
          y: [-14, 14, -14],
          rotate: [0, 12, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 sm:w-64 sm:h-64 opacity-40"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_20px_35px_rgba(3,105,161,0.12)]">
          <defs>
            <linearGradient id="lightTorus" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <path
            d="M 100 35 C 142 35 165 68 165 100 C 165 132 142 165 100 165 C 58 165 35 132 35 100 C 35 68 58 35 100 35 Z"
            fill="none"
            stroke="url(#lightTorus)"
            strokeWidth="28"
            strokeLinecap="round"
          />
          <path
            d="M 75 45 C 105 45 138 60 148 85"
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      </motion.div>

      {/* ── Left Soft Floating Curve ── */}
      <motion.div
        animate={{
          x: [-15, 12, -15],
          y: [-8, 14, -8],
          rotate: [-4, 5, -4],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-1/4 -left-14 sm:left-8 w-44 h-44 sm:w-56 sm:h-56 opacity-35"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_15px_30px_rgba(3,105,161,0.1)]">
          <defs>
            <linearGradient id="lightZig" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="60%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <path
            d="M 40 120 Q 75 75 105 120 T 165 120"
            fill="none"
            stroke="url(#lightZig)"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d="M 40 65 Q 75 20 105 65 T 165 65"
            fill="none"
            stroke="url(#lightZig)"
            strokeWidth="26"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {/* ── Right Soft Wave Ribbon ── */}
      <motion.div
        animate={{
          y: [14, -18, 14],
          rotate: [4, -8, 4],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/5 -right-16 sm:right-6 w-56 h-72 sm:w-68 sm:h-88 opacity-35"
      >
        <svg viewBox="0 0 240 320" className="w-full h-full drop-shadow-[0_20px_35px_rgba(3,105,161,0.1)]">
          <defs>
            <linearGradient id="lightSpiral" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <path
            d="M 175 45 C 215 90 215 155 160 195 C 105 235 70 270 120 300"
            fill="none"
            stroke="url(#lightSpiral)"
            strokeWidth="28"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {/* ── Bottom Ambient Loop ── */}
      <motion.div
        animate={{
          y: [-10, 10, -10],
          x: [8, -8, 8],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute -bottom-16 left-8 sm:left-24 w-48 h-48 sm:w-60 sm:h-60 opacity-35"
      >
        <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-[0_15px_30px_rgba(3,105,161,0.1)]">
          <defs>
            <linearGradient id="lightBottom" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="60%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
          </defs>
          <path
            d="M 65 155 C 25 110 50 45 115 45 C 180 45 190 125 135 165 C 100 190 55 165 75 110"
            fill="none"
            stroke="url(#lightBottom)"
            strokeWidth="26"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
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
      className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden p-4 sm:p-6 lg:p-8 antialiased selection:bg-sky-200 selection:text-sky-900"
      style={{
        background: 'radial-gradient(ellipse at 50% 15%, #e0f2fe 0%, #f0f9ff 45%, #f8fafc 100%)',
      }}
      dir="rtl"
    >
      {/* ── Dreamy Pastel 3D Shapes & Ambient Floating Lights ── */}
      <CalmOrganicShapes />
      <CalmAmbientParticles />

      {/* ── Calming Secondary Glass Aura Sheet ── */}
      <div className="pointer-events-none absolute inset-4 sm:inset-10 lg:inset-16 rounded-[2.5rem] sm:rounded-[3.5rem] bg-white/40 border border-white/80 backdrop-blur-3xl shadow-xl shadow-sky-900/5" />

      {/* ── Main Frosted Velvet Glass Card (Light Glassmorphism) ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-[420px] overflow-hidden rounded-[2.2rem] border border-white/90 bg-white/75 p-7 sm:p-9 text-slate-800 shadow-[0_20px_60px_rgba(15,23,42,0.07),inset_0_1px_2px_rgba(255,255,255,0.9)] backdrop-blur-2xl ring-1 ring-slate-900/5"
      >
        {/* Soft internal light bloom */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-sky-300/20 blur-2xl" />

        {/* ── Brand & Logo (Centered & Serene) ── */}
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.55 }}
            className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white bg-white/90 p-2.5 shadow-md shadow-sky-200/50 backdrop-blur-md"
          >
            <img src={img} alt="DocPoint Logo" className="h-full w-full object-contain" />
            <motion.span
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.5, 0.9, 0.5],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-[#38C698]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              تسجيل الدخول
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-semibold">
              لوحة التحكم الإدارية · DocPoint
            </p>
          </motion.div>
        </div>

        {/* ── Error Banner ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.22 }}
              className="mt-4 flex items-center gap-2.5 overflow-hidden rounded-2xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-semibold text-rose-700 shadow-2xs"
            >
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Login Form ── */}
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          {/* Username Input */}
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-bold text-slate-700" htmlFor="username">
              اسم المستخدم أو البريد الإلكتروني
            </label>
            <div className="relative flex items-center">
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                placeholder="username أو dr.ahmed"
                className="w-full rounded-2xl border border-slate-200/80 bg-white/85 py-3.5 pr-11 pl-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-2xs transition-all duration-200 hover:bg-white hover:border-slate-300 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
              <User
                size={18}
                className={`pointer-events-none absolute right-3.5 transition-colors duration-200 ${
                  focusedField === 'username' ? 'text-sky-600' : 'text-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-bold text-slate-700" htmlFor="password">
              كلمة المرور
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-200/80 bg-white/85 py-3.5 pr-11 pl-11 text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-2xs transition-all duration-200 hover:bg-white hover:border-slate-300 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
              <Lock
                size={18}
                className={`pointer-events-none absolute right-3.5 transition-colors duration-200 ${
                  focusedField === 'password' ? 'text-sky-600' : 'text-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="تبديل ظهور كلمة المرور"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={showPassword ? 'off' : 'on'}
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.75 }}
                    transition={{ duration: 0.15 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>

          {/* Options Row: Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label
              htmlFor="rememberMe"
              className="group flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
            >
              <div className="relative flex items-center justify-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="peer sr-only"
                />
                <div className="h-4.5 w-4.5 rounded-lg border border-slate-300 bg-white transition-all peer-checked:border-sky-600 peer-checked:bg-sky-600 group-hover:border-slate-400" />
                <Check
                  size={12}
                  strokeWidth={3}
                  className="pointer-events-none absolute text-white opacity-0 transition-opacity peer-checked:opacity-100"
                />
              </div>
              <span>تذكر بيانات الدخول</span>
            </label>

            <span className="text-[11px] font-medium text-slate-400 hover:text-sky-600 transition cursor-pointer">
              نسيت كلمة المرور؟
            </span>
          </div>

          {/* Submit Action Button (Signature Clinical Sky/Blue Gradient) */}
          <motion.button
            whileHover={{ scale: 1.015, y: -1 }}
            whileTap={{ scale: 0.985 }}
            type="submit"
            disabled={isLoading}
            className="group relative mt-2 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/25 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-65 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgb(3, 105, 161) 0%, rgb(2, 132, 199) 50%, rgb(14, 165, 233) 100%)',
            }}
          >
            {/* Soft Shimmer Light Sweep */}
            <motion.div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
            />

            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 size={17} className="animate-spin" />
                  <span>جاري الدخول...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <span>دخول لوحة التحكم</span>
                  <ArrowLeft
                    size={16}
                    className="transition-transform duration-200 group-hover:-translate-x-1"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.form>

        {/* ── Footer: Minimal Security & Developer Attribution ── */}
        <div className="mt-7 flex flex-col items-center gap-1.5 border-t border-slate-200/60 pt-4 text-center text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-medium text-slate-500">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>بوابة وصول آمنة ومشفرة</span>
          </div>

          <div className="flex items-center gap-1">
            <Code size={12} className="text-sky-600" />
            <span>تم التطوير بواسطة</span>
            <a
              href="https://m7mdmstfa4422.github.io/MoMustafa/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-sky-700 transition hover:underline hover:text-sky-800"
            >
              Mohammed Mustafa
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
