import React, { useEffect, useState } from 'react';
import client from '@/api/client';
import { Prescription } from '@/types';
import { Pill } from 'lucide-react';

export const PatientPrescriptionsPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/prescriptions')
      .then(res => setPrescriptions(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading prescriptions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
          <Pill className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Active Prescriptions</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        {prescriptions.length === 0 ? (
          <p className="text-slate-500 text-sm">No active prescriptions.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-4">Medication</th>
                <th className="py-3 px-4">Dosage</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {prescriptions.map((rx) => (
                <tr key={rx.id}>
                  <td className="py-3 px-4 font-semibold text-slate-900">{rx.medication}</td>
                  <td className="py-3 px-4 text-slate-600">{rx.dosage}</td>
                  <td className="py-3 px-4 text-slate-600">{rx.route}</td>
                  <td className="py-3 px-4 text-slate-600">{rx.frequency}</td>
                  <td className="py-3 px-4 text-slate-600">{rx.duration}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      {rx.status}
                    </span>
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
