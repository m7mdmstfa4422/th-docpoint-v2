import { useState, useContext } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

import Sidebar from './components/Sidebar/Sidebar';
import Topbar from './components/Topbar/Topbar';
import PatientRegistration from './components/PatientRegistration/PatientRegistration';
import PatientSearch from './components/PatientSearch/PatientSearch';
import FinancialDashboard from './components/FinancialDashboard/FinancialDashboard';
import PatientProfile from './components/PatientProfile/PatientProfile';
import Settings from './components/Settings/Settings';
import Reports from './components/Reports/Reports';
import Home from './components/Home/Home';
import UiFeedback from './components/UiFeedback/UiFeedback';
import Login from './components/Login/Login';
import AuthProvider, { AuthContext } from './AuthProvider';
import SubscriptionProvider, { SubscriptionContext } from './SubscriptionProvider';
import SubscriptionRenewal from './components/SubscriptionRenewal/SubscriptionRenewal';
import DeveloperConsole from './components/DeveloperConsole/DeveloperConsole';
import Appointments from './components/Appointments/Appointments';
import Indebtedness from './components/Indebtedness/Indebtedness';
import NotificationProvider from './NotificationContext';

const UnderDevelopment = () => (
  <div className="grid min-h-[45vh] place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
    <div>
      <Activity size={42} className="mx-auto mb-4 text-blue-500" />
      <h2 className="text-lg font-bold text-slate-800">هذه الصفحة قيد التطوير</h2>
      <p className="mt-2 text-sm text-slate-500">اختر إحدى الصفحات المتاحة من القائمة الجانبية.</p>
    </div>
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();
  const { isAuthenticated, admin } = useContext(AuthContext);
  const { subscription } = useContext(SubscriptionContext);
  const isDoctor = admin?.username === 'drahmed' || admin?.role === 'developer';

  if (isAuthenticated && subscription && !subscription.active) return <Routes><Route path="/developer" element={admin?.role === 'developer' ? <DeveloperConsole /> : <SubscriptionRenewal />} /><Route path="*" element={<SubscriptionRenewal />} /></Routes>;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={location}>
          <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/Login" replace />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/developer" element={admin?.role === 'developer' ? <DeveloperConsole /> : <Navigate to="/" replace />} />
          <Route path="/register" element={isAuthenticated ? <PatientRegistration /> : <Navigate to="/Login" replace />} />
          <Route path="/search" element={isAuthenticated ? <PatientSearch /> : <Navigate to="/Login" replace />} />
          <Route path="/appointments" element={isAuthenticated ? <Appointments /> : <Navigate to="/Login" replace />} />
          <Route path="/finance" element={isDoctor ? <FinancialDashboard /> : <Navigate to="/register" replace />} />
          <Route path="/Indebtedness" element={isDoctor ? <Indebtedness /> : <Navigate to="/register" replace />} />
          <Route path="/indebtedness" element={isDoctor ? <Indebtedness /> : <Navigate to="/register" replace />} />
          <Route path="/patient-profile/:id" element={isAuthenticated ? <PatientProfile /> : <Navigate to="/Login" replace />} />
          <Route path="/operations" element={isAuthenticated ? <UnderDevelopment /> : <Navigate to="/Login" replace />} />
          <Route path="/reports" element={isDoctor ? <Reports /> : <Navigate to="/register" replace />} />
          <Route path="/settings" element={isDoctor ? <Settings /> : <Navigate to="/register" replace />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/Login'} replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('clinic_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const { isAuthenticated } = useContext(AuthContext);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('clinic_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" dir="rtl">
      {isAuthenticated && (
        <Sidebar
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      )}
      <div
        className={`min-h-screen transition-[margin] duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${
          isAuthenticated ? (sidebarCollapsed ? 'lg:mr-24' : 'lg:mr-72') : ''
        }`}
      >
        {isAuthenticated && <Topbar onMenuClick={() => setMenuOpen(true)} />}
        <main className="">
          <AnimatedRoutes />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <NotificationProvider>
          <UiFeedback>
            <BrowserRouter>
              <Layout />
            </BrowserRouter>
          </UiFeedback>
        </NotificationProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
