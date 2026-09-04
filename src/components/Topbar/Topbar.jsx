import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  LogOut, 
  Menu, 
  RotateCw, 
  ShieldCheck, 
  User 
} from 'lucide-react';
import { AuthContext } from '../../AuthProvider';

export default function Topbar({ onMenuClick }) {
  const { admin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-xl md:px-6"
      dir="rtl"
    >
      {/* الجزء الأيمن: زر القائمة وأزرار التنقل السريع */}
      <div className="flex items-center gap-2">
        {/* زر فتح القائمة الجانبية للشاشات الصغيرة */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onMenuClick}
          className="inline-flex size-9 items-center justify-center rounded-xl border border-sky-100 bg-sky-50/70 text-sky-800 transition hover:bg-sky-100 lg:hidden"
          aria-label="فتح القائمة"
        >
          <Menu size={19} />
        </motion.button>

        {/* مجموعة أزرار: رجوع، تقدم، إعادة تحميل */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-50/80 p-1 shadow-xs">
          {/* زر الرجوع */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => navigate(-1)}
            title="رجوع للخلف"
            aria-label="رجوع للخلف"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-sky-700 hover:shadow-xs"
          >
            <ArrowRight size={16} />
          </motion.button>

          {/* زر التقدم */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => navigate(1)}
            title="التقدم للأمام"
            aria-label="التقدم للأمام"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-sky-700 hover:shadow-xs"
          >
            <ArrowLeft size={16} />
          </motion.button>

          <span className="mx-0.5 h-4 w-px bg-slate-200" />

          {/* زر إعادة تحميل الصفحة */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9, rotate: 180 }}
            type="button"
            onClick={() => window.location.reload()}
            title="إعادة تحميل الصفحة"
            aria-label="إعادة تحميل الصفحة"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-cyan-700 hover:shadow-xs"
          >
            <RotateCw size={15} />
          </motion.button>
        </div>
      </div>

      {/* الجزء الأيسر: بيانات الحساب وتسجيل الخروج */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-1.5 pl-2 shadow-xs">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-700 to-cyan-500 font-bold text-white shadow-xs">
            {admin?.name ? admin.name.charAt(0) : <User size={15} />}
          </div>

          <div className="hidden text-right leading-tight sm:block">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-900">
                {admin?.name || 'Docpoint'}
              </span>
              {admin?.username === 'drahmed' && (
                <ShieldCheck size={13} className="text-sky-600" />
              )}
            </div>
            <span className="text-[10px] font-medium text-slate-400" dir="ltr">
              @{admin?.username || 'admin'}
            </span>
          </div>

          {logout && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={logout}
              title="تسجيل الخروج"
              className="mr-0.5 inline-flex size-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={15} />
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}