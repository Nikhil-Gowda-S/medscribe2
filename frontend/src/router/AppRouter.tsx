import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { DoctorLayout } from '@/layouts/DoctorLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PatientLayout } from '@/layouts/PatientLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Doctor Pages
import { DoctorDashboardPage } from '@/pages/doctor/DashboardPage';
import { DoctorPatientsPage } from '@/pages/doctor/PatientsPage';
import { DoctorConsultationsPage } from '@/pages/doctor/ConsultationsPage';
import { DoctorNewConsultationPage } from '@/pages/doctor/NewConsultationPage';
import { DoctorDocumentDetailPage } from '@/pages/doctor/DocumentDetailPage';
import { DoctorTemplatesPage } from '@/pages/doctor/TemplatesPage';
import { DoctorAnalyticsPage } from '@/pages/doctor/AnalyticsPage';

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/DashboardPage';
import { AdminRecordsPage } from '@/pages/admin/RecordsPage';

// Patient Pages
import { PatientDashboardPage } from '@/pages/patient/DashboardPage';
import { PatientConsultationsPage } from '@/pages/patient/ConsultationsPage';
import { PatientReportsPage } from '@/pages/patient/ReportsPage';
import { PatientPrescriptionsPage } from '@/pages/patient/PrescriptionsPage';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return {};
  }
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: string }> = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const user = getStoredUser();

  if (!token || !user.role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Doctor Routes */}
        <Route
          element={
            <ProtectedRoute allowedRole="DOCTOR">
              <DoctorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DoctorDashboardPage />} />
          <Route path="/patients" element={<DoctorPatientsPage />} />
          <Route path="/consultations" element={<DoctorConsultationsPage />} />
          <Route path="/consultations/new" element={<DoctorNewConsultationPage />} />
          <Route path="/consultations/:id" element={<DoctorDocumentDetailPage />} />
          <Route path="/templates" element={<DoctorTemplatesPage />} />
          <Route path="/analytics" element={<DoctorAnalyticsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/doctors" element={<AdminRecordsPage kind="doctors" />} />
          <Route path="/admin/patients" element={<AdminRecordsPage kind="patients" />} />
          <Route path="/admin/consultations" element={<AdminRecordsPage kind="consultations" />} />
          <Route path="/admin/reports" element={<AdminRecordsPage kind="reports" />} />
          <Route path="/admin/prescriptions" element={<AdminRecordsPage kind="prescriptions" />} />
          <Route path="/admin/analytics" element={<AdminDashboardPage />} />
        </Route>

        {/* Patient Routes */}
        <Route
          element={
            <ProtectedRoute allowedRole="PATIENT">
              <PatientLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
          <Route path="/patient/consultations" element={<PatientConsultationsPage />} />
          <Route path="/patient/reports" element={<PatientReportsPage />} />
          <Route path="/patient/prescriptions" element={<PatientPrescriptionsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
