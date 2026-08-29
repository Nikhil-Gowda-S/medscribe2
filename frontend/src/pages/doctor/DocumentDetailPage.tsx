import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { Document, Prescription } from '@/types';
import { Save, CheckCircle, FileDown, Plus, Lock, AlertTriangle, Pill, X } from 'lucide-react';

export const DoctorDocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState('');
  const [addendumContent, setAddendumContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [showRxModal, setShowRxModal] = useState(false);
  const [rxForm, setRxForm] = useState({
    medication: '',
    dosage: '',
    route: 'oral',
    frequency: 'twice daily',
    duration: '7 days',
    instructions: '',
  });

  useEffect(() => {
    fetchDoc();
  }, [id]);

  const fetchDoc = async () => {
    try {
      const res = await client.get(`/documents/by-consultation/${id}`);
      setDocument(res.data);
      setContent(res.data.content);
      setNotFound(false);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      await client.put(`/documents/${document?.id}`, { content });
      alert('Draft saved successfully!');
      fetchDoc();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error saving draft');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Are you sure you want to finalize this document? Once finalized, it becomes legally immutable.')) return;
    try {
      setSaving(true);
      await client.post(`/documents/${document?.id}/finalize`);
      alert('Document finalized and signed!');
      fetchDoc();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error finalizing document');
    } finally {
      setSaving(false);
    }
  };

  const handleAddendum = async () => {
    if (!addendumContent.trim()) return;
    try {
      await client.post(`/documents/${document?.id}/addendum`, { content: addendumContent });
      alert('Addendum created!');
      setAddendumContent('');
      fetchDoc();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating addendum');
    }
  };

  const handleExportPDF = async () => {
    try {
      const res = await client.get(`/documents/${document?.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Document_${document?.id}.pdf`);
      window.document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data instanceof Blob) {
        err.response.data.text().then((text: string) => {
          try {
            const json = JSON.parse(text);
            alert(`Error downloading PDF: ${json.detail || text}`);
          } catch {
            alert(`Error downloading PDF: ${text}`);
          }
        });
      } else {
        alert(`Error downloading PDF: ${err.message || err}`);
      }
    }
  };


  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;
    try {
      await client.post('/prescriptions', {
        ...rxForm,
        patient_id: document.patient_id,
        consultation_id: document.consultation_id,
      });
      alert('Prescription created and attached to consultation!');
      setShowRxModal(false);
      setRxForm({ medication: '', dosage: '', route: 'oral', frequency: 'twice daily', duration: '7 days', instructions: '' });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create prescription');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading document...</div>;
  }

  if (notFound || !document) {
    return (
      <div className="max-w-3xl mx-auto mt-12 bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Document Generated Yet</h2>
        <p className="text-slate-500 mb-6">
          This consultation encounter does not have an AI-generated clinical note associated with it yet.
        </p>
        <button
          onClick={() => navigate('/consultations/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl shadow transition"
        >
          Go to New Encounter
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-900">{document.type}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              document.is_finalized ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {document.is_finalized ? 'FINALIZED & LOCKED' : 'EDITABLE DRAFT'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Created: {new Date(document.created_at).toLocaleString()}</p>
        </div>

        <div className="flex items-center space-x-3">
          {!document.is_finalized ? (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2 rounded-xl text-sm transition"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={handleFinalize}
                disabled={saving}
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Finalize Note</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Immutable Record</span>
            </div>
          )}

          <button
            onClick={() => setShowRxModal(true)}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3.5 py-2 rounded-xl text-sm transition"
          >
            <Pill className="w-4 h-4" />
            <span>Add Rx</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-2 rounded-xl text-sm transition"
          >
            <FileDown className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

        </div>
      </div>

      {/* Editor Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Clinical Note Content (Editable)</label>
        <textarea
          rows={16}
          disabled={document.is_finalized}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`w-full p-4 border rounded-xl font-mono text-sm leading-relaxed ${
            document.is_finalized ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500'
          }`}
        />
      </div>

      {/* Addendum Section for Finalized Docs */}
      {document.is_finalized && (
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 space-y-4">
          <h3 className="font-bold text-amber-900 text-sm flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Add Post-Finalization Correction (Addendum)</span>
          </h3>
          <textarea
            rows={3}
            value={addendumContent}
            onChange={(e) => setAddendumContent(e.target.value)}
            placeholder="Type legal addendum notes here..."
            className="w-full p-3 bg-white border border-amber-300 rounded-xl text-sm"
          />
          <button
            onClick={handleAddendum}
            className="bg-amber-700 hover:bg-amber-800 text-white font-medium px-4 py-2 rounded-xl text-sm"
          >
            Submit Addendum
          </button>
        </div>
      )}

      {document.addendums && document.addendums.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900">Record Addenda</h3>
          {document.addendums.map((addendum) => (
            <article key={addendum.id} className="border-l-4 border-amber-400 bg-amber-50 p-4 rounded-r-xl">
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{addendum.content}</p>
              <p className="text-xs text-slate-500 mt-2">Added {new Date(addendum.created_at).toLocaleString()}</p>
            </article>
          ))}
        </div>
      )}

      {/* Prescription Modal */}
      {showRxModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Issue Medication Prescription</h3>
              <button onClick={() => setShowRxModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreatePrescription} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Medication Name</label>
                <input required value={rxForm.medication} onChange={e => setRxForm({...rxForm, medication: e.target.value})} placeholder="Amoxicillin, Atorvastatin..." className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Dosage</label>
                  <input required value={rxForm.dosage} onChange={e => setRxForm({...rxForm, dosage: e.target.value})} placeholder="500mg" className="w-full p-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Route</label>
                  <select value={rxForm.route} onChange={e => setRxForm({...rxForm, route: e.target.value})} className="w-full p-2 border rounded-lg text-sm">
                    <option>oral</option>
                    <option>IV</option>
                    <option>topical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Frequency</label>
                  <input required value={rxForm.frequency} onChange={e => setRxForm({...rxForm, frequency: e.target.value})} placeholder="twice daily" className="w-full p-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Duration</label>
                  <input required value={rxForm.duration} onChange={e => setRxForm({...rxForm, duration: e.target.value})} placeholder="7 days" className="w-full p-2 border rounded-lg text-sm" />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl shadow mt-2 text-sm">Issue Prescription</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
