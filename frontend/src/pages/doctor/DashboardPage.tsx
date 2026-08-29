import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '@/api/client';
import { Patient, Consultation, Document } from '@/types';
import { Users, FileText, Plus, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

export const DoctorDashboardPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          client.get('/patients'),
          client.get('/consultations')
        ]);
        setPatients(pRes.data);
        setConsultations(cRes.data);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h1>
        <p className="text-slate-500 text-sm">Welcome back. Manage your clinical encounters and patient documentation.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{patients.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consultations</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{consultations.length}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Time Saved</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{roundTimeSaved(consultations.length)} hrs</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Recent Encounters</h2>
        <Link
          to="/consultations/new"
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Encounter</span>
        </Link>
      </div>

      {/* Consultations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {consultations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No consultations created yet. Click "New Encounter" to begin.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-6">Consultation ID</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {consultations.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-4 px-6 font-mono text-slate-700">{c.id.substring(0, 8)}...</td>
                  <td className="py-4 px-6 text-slate-600">{new Date(c.consultation_date).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {c.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      to={`/consultations/${c.id}`}
                      className="inline-flex items-center space-x-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <span>View & Edit</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

function roundTimeSaved(count: number): number {
  return Math.round(count * 0.25 * 10) / 10;
}
