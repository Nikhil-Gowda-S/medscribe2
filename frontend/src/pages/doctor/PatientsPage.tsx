import React, { useEffect, useState } from 'react';
import client from '@/api/client';
import { Patient } from '@/types';
import { Plus, Search, UserCheck, X } from 'lucide-react';

export const DoctorPatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Male',
    phone: '',
    email: '',
    medical_record_number: '',
  });

  const [actForm, setActForm] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await client.get('/patients');
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    try {
      setIsSaving(true);
      const payload: any = { ...form };
      payload.date_of_birth = payload.date_of_birth ? new Date(payload.date_of_birth).toISOString() : null;
      payload.email = payload.email || null;
      payload.phone = payload.phone || null;
      payload.medical_record_number = payload.medical_record_number || null;

      await client.post('/patients', payload);
      setShowModal(false);
      setForm({ first_name: '', last_name: '', date_of_birth: '', gender: 'Male', phone: '', email: '', medical_record_number: '' });
      await fetchPatients();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating patient');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isActivating) return;
    try {
      setIsActivating(true);
      await client.post('/patients/activate-account', {
        patient_id: selectedPatientId,
        email: actForm.email,
        password: actForm.password,
      });
      alert('Patient login account created successfully!');
      setShowActivateModal(false);
      setActForm({ email: '', password: '' });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to activate account');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Directory</h1>
          <p className="text-slate-500 text-sm">Manage assigned patient profiles and portal account activations.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Patient</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <th className="py-3 px-6">Name</th>
              <th className="py-3 px-6">MRN</th>
              <th className="py-3 px-6">Gender</th>
              <th className="py-3 px-6">Phone</th>
              <th className="py-3 px-6">Email</th>
              <th className="py-3 px-6 text-right">Portal Account</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="py-4 px-6 font-semibold text-slate-900">{p.first_name} {p.last_name}</td>
                <td className="py-4 px-6 font-mono text-slate-600">{p.medical_record_number || 'N/A'}</td>
                <td className="py-4 px-6 text-slate-600">{p.gender || 'N/A'}</td>
                <td className="py-4 px-6 text-slate-600">{p.phone || 'N/A'}</td>
                <td className="py-4 px-6 text-slate-600">{p.email || 'N/A'}</td>
                <td className="py-4 px-6 text-right">
                  {p.has_portal_account ? (
                    <span className="inline-flex items-center space-x-1 text-xs text-slate-500 font-semibold px-3 py-1.5 border border-transparent">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Account Active</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setActForm({ email: p.email || '', password: '' });
                        setShowActivateModal(true);
                      }}
                      className="inline-flex items-center space-x-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 transition"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Create Login</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Add Patient Record</h3>
              <button type="button" disabled={isSaving} onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">First Name</label>
                  <input required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Last Name</label>
                  <input required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Email (Required for Login)</label>
                  <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">MRN Number</label>
                <input value={form.medical_record_number} onChange={e => setForm({...form, medical_record_number: e.target.value})} placeholder="MRN-1002" className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Gender</label>
                  <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full p-2 border rounded-lg text-sm">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">DOB</label>
                  <input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl shadow mt-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? 'Saving Patient...' : 'Save Patient'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Activate Portal Account Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Provision Patient Login</h3>
              <button type="button" disabled={isActivating} onClick={() => setShowActivateModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleActivate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Portal Email</label>
                <input type="email" required readOnly value={actForm.email} className="w-full p-2 border rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed" title="Email is synced with patient record" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Initial Password</label>
                <input type="password" required value={actForm.password} onChange={e => setActForm({...actForm, password: e.target.value})} placeholder="••••••••" className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <button type="submit" disabled={isActivating} className="w-full bg-emerald-600 text-white font-semibold py-2.5 rounded-xl shadow mt-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">{isActivating ? 'Creating Account...' : 'Create Patient Portal Account'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
