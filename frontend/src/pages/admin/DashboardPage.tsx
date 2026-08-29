import React, { useEffect, useState } from 'react';
import client from '@/api/client';
import { ShieldCheck, UserCheck, Users, FileText, Pill, Eye, AlertCircle } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    client.get('/analytics/admin').then(res => setData(res.data));
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-500">Loading admin analytics...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between bg-amber-50 p-6 rounded-2xl border border-amber-200">
        <div>
          <h1 className="text-2xl font-bold text-amber-950">Hospital Oversight & Governance</h1>
          <p className="text-amber-800 text-sm mt-1">Hospital-wide clinical documentation metrics and doctor activity audit oversight.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-amber-200 text-amber-900 font-bold px-3 py-1.5 rounded-xl border border-amber-300">
          <Eye className="w-4 h-4" />
          <span>READ-ONLY VIEW</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Doctors</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.total_doctors}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Patients</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.total_patients}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Consultations</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.total_consultations}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Reports Generated</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.total_reports}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Prescriptions</p>
          <h3 className="text-3xl font-bold text-indigo-600 mt-2">{data.total_prescriptions}</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 text-lg mb-2">Hospital Productivity Metrics</h3>
        <p className="text-slate-500 text-sm">Average Encounters Per Doctor: <span className="font-bold text-slate-900">{data.average_consultations_per_doctor}</span></p>
      </div>
    </div>
  );
};
