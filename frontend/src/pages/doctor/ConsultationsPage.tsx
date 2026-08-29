import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '@/api/client';
import { Consultation } from '@/types';
import { FileText, ArrowRight, Plus } from 'lucide-react';

export const DoctorConsultationsPage: React.FC = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/consultations').then(res => setConsultations(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultation Encounters</h1>
          <p className="text-slate-500 text-sm">View past audio recordings, transcripts, and generated clinical notes.</p>
        </div>
        <Link
          to="/consultations/new"
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Encounter</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <th className="py-3 px-6">Date</th>
              <th className="py-3 px-6">Consultation ID</th>
              <th className="py-3 px-6">Transcript Snippet</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {consultations.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="py-4 px-6 text-slate-600">{new Date(c.consultation_date).toLocaleDateString()}</td>
                <td className="py-4 px-6 font-mono text-slate-700">{c.id.substring(0, 8)}...</td>
                <td className="py-4 px-6 text-slate-600 truncate max-w-xs">{c.transcript || 'No transcript'}</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {c.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <Link to={`/consultations/${c.id}`} className="inline-flex items-center space-x-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
                    <span>View Note</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
