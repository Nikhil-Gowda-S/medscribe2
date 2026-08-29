import React from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldCheck, UserCheck, Users, FileText, Pill, BarChart3, LogOut, Eye } from 'lucide-react';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: ShieldCheck },
    { label: 'Doctors', path: '/admin/doctors', icon: UserCheck },
    { label: 'Patients', path: '/admin/patients', icon: Users },
    { label: 'Consultations', path: '/admin/consultations', icon: FileText },
    { label: 'Reports', path: '/admin/reports', icon: FileText },
    { label: 'Prescriptions', path: '/admin/prescriptions', icon: Pill },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-white flex flex-col justify-between p-4 border-r border-slate-900">
        <div>
          <div className="flex items-center space-x-3 px-2 py-4 mb-4 border-b border-slate-800">
            <div className="p-2 bg-amber-600 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">MedScribe</h1>
              <span className="text-xs text-amber-400 font-semibold tracking-wide">ADMIN OVERSIGHT</span>
            </div>
          </div>

          <div className="mb-6 p-3 bg-amber-950/50 border border-amber-800/50 rounded-lg flex items-center space-x-2 text-amber-300 text-xs">
            <Eye className="w-4 h-4 shrink-0" />
            <span>Read-Only Portal: Content edits disabled</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive ? 'bg-amber-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-semibold text-slate-200">{user.name || 'Admin User'}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-rose-400 hover:bg-slate-900 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            🔒 Hospital Governance View
          </span>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
