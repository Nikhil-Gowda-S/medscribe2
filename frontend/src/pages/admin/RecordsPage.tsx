import React, { useEffect, useState } from 'react';
import client from '@/api/client';
import { FileText, Pill, Stethoscope, Users } from 'lucide-react';

type RecordKind = 'doctors' | 'patients' | 'consultations' | 'reports' | 'prescriptions';

const pageConfig: Record<RecordKind, { title: string; description: string; icon: React.ElementType }> = {
  doctors: { title: 'Doctors', description: 'Read-only directory of clinical staff.', icon: Stethoscope },
  patients: { title: 'Patients', description: 'Read-only patient registry.', icon: Users },
  consultations: { title: 'Consultations', description: 'All recorded patient encounters.', icon: FileText },
  reports: { title: 'Clinical Reports', description: 'Generated and finalized clinical documents.', icon: FileText },
  prescriptions: { title: 'Prescriptions', description: 'All prescriptions issued by clinicians.', icon: Pill },
};

export const AdminRecordsPage: React.FC<{ kind: RecordKind }> = ({ kind }) => {
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const config = pageConfig[kind];
  const Icon = config.icon;

  useEffect(() => {
    setLoading(true);
    client.get(`/admin/${kind === 'reports' ? 'documents' : kind}`)
      .then(res => setRecords(res.data))
      .finally(() => setLoading(false));
  }, [kind]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading {config.title.toLowerCase()}...</div>;

  const columns: Record<RecordKind, Array<{ label: string; value: (record: any) => string }>> = {
    doctors: [
      { label: 'Name', value: r => r.name || '—' }, { label: 'Email', value: r => r.email || '—' },
      { label: 'Specialty', value: r => r.specialty || 'General Medicine' },
    ],
    patients: [
      { label: 'Name', value: r => `${r.first_name || ''} ${r.last_name || ''}`.trim() || '—' },
      { label: 'MRN', value: r => r.medical_record_number || '—' }, { label: 'Email', value: r => r.email || '—' },
    ],
    consultations: [
      { label: 'Date', value: r => r.consultation_date ? new Date(r.consultation_date).toLocaleDateString() : '—' },
      { label: 'Status', value: r => r.status || '—' }, { label: 'Transcription', value: r => r.transcription_status || '—' },
    ],
    reports: [
      { label: 'Report Type', value: r => r.type || '—' }, { label: 'Status', value: r => r.status || '—' },
      { label: 'Created', value: r => r.created_at ? new Date(r.created_at).toLocaleDateString() : '—' },
    ],
    prescriptions: [
      { label: 'Medication', value: r => r.medication || '—' }, { label: 'Dosage', value: r => r.dosage || '—' },
      { label: 'Frequency', value: r => r.frequency || '—' }, { label: 'Status', value: r => r.status || '—' },
    ],
  };
  const visibleColumns = columns[kind];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-amber-100 text-amber-800 rounded-xl"><Icon className="w-6 h-6" /></div>
        <div><h1 className="text-2xl font-bold text-slate-900">{config.title}</h1><p className="text-sm text-slate-500">{config.description}</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            {visibleColumns.map(column => <th key={column.label} className="py-3 px-5">{column.label}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {records.length === 0 ? <tr><td colSpan={visibleColumns.length} className="p-8 text-center text-slate-500">No records found.</td></tr> : records.map((record: any) => (
              <tr key={record.id} className="hover:bg-slate-50">{visibleColumns.map(column => <td key={column.label} className="py-4 px-5 text-slate-700">{column.value(record)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
