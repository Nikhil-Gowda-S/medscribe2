import React, { useEffect, useState } from 'react';
import client from '@/api/client';
import { Patient, Consultation, Document, Prescription } from '@/types';
import { HeartPulse, Calendar, FileText, Pill, ShieldCheck, Download } from 'lucide-react';

export const PatientDashboardPage: React.FC = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, dRes, rRes] = await Promise.all([
          client.get('/consultations'),
          client.get('/documents?finalized_only=true'),
          client.get('/prescriptions')
        ]);
        setConsultations(cRes.data);
        setDocuments(dRes.data.filter((d: any) => d.is_finalized));
        setPrescriptions(rRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading patient portal...</div>;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-emerald-900 text-white p-8 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-semibold text-emerald-300 tracking-wider">Patient Access Portal</span>
          <h1 className="text-3xl font-bold mt-1">Welcome, {user.name || 'Patient'}</h1>
          <p className="text-emerald-100 text-sm mt-2">View your official medical consultations, signed clinical reports, and prescriptions.</p>
        </div>
        <div className="p-4 bg-emerald-800 rounded-2xl border border-emerald-700">
          <ShieldCheck className="w-10 h-10 text-emerald-300" />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Consultations</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{consultations.length}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Calendar className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Finalized Reports</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{documents.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FileText className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Prescriptions</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{prescriptions.length}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Pill className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Active Prescriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">My Prescriptions</h2>
        {prescriptions.length === 0 ? (
          <p className="text-slate-500 text-sm">No active prescriptions.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-4">Medication</th>
                <th className="py-3 px-4">Dosage</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {prescriptions.map((rx) => (
                <tr key={rx.id}>
                  <td className="py-3 px-4 font-semibold text-slate-900">{rx.medication}</td>
                  <td className="py-3 px-4 text-slate-600">{rx.dosage}</td>
                  <td className="py-3 px-4 text-slate-600">{rx.frequency}</td>
                  <td className="py-3 px-4 text-slate-600">{rx.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Finalized Reports */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Finalized Medical Reports</h2>
        {documents.length === 0 ? (
          <p className="text-slate-500 text-sm">No finalized medical reports available.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">{doc.type}</h4>
                  <p className="text-xs text-slate-500">Date: {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
                <a
                  href={`/api/v1/documents/${doc.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Signed PDF</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
