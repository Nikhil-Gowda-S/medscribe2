import React, { useEffect, useState } from 'react';
import client from '@/api/client';
import { Consultation } from '@/types';
import { Calendar } from 'lucide-react';

export const PatientConsultationsPage: React.FC = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/consultations')
      .then(res => setConsultations(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading consultations...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
          <Calendar className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">My Consultations</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <th className="py-3 px-6">Date</th>
              <th className="py-3 px-6">Consultation ID</th>
              <th className="py-3 px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {consultations.length === 0 ? (
              <tr><td colSpan={3} className="py-8 text-center text-slate-500">No consultations found.</td></tr>
            ) : consultations.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="py-4 px-6 font-medium text-slate-900">{new Date(c.consultation_date).toLocaleDateString()}</td>
                <td className="py-4 px-6 font-mono text-slate-500">{c.id}</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
