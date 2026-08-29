import React from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { HeartPulse, Calendar, FileText, Pill, LogOut } from 'lucide-react';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export const PatientLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/patient/dashboard', icon: HeartPulse },
    { label: 'My Consultations', path: '/patient/consultations', icon: Calendar },
    { label: 'My Reports', path: '/patient/reports', icon: FileText },
    { label: 'My Prescriptions', path: '/patient/prescriptions', icon: Pill },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-700 rounded-lg">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">MedScribe Patient Portal</h1>
              <span className="text-xs text-emerald-200">Personal Health Records</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">{user.name || 'Patient'}</span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-xs bg-emerald-900 hover:bg-emerald-950 px-3 py-1.5 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <div className="bg-emerald-900 text-emerald-100 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto px-6 flex space-x-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition ${
                  isActive ? 'border-white text-white bg-emerald-800/50' : 'border-transparent text-emerald-200 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content Body */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
};
