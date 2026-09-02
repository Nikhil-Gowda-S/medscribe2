import React, { useEffect, useState } from 'react';
import client from '@/api/client';
import { DocumentTemplate } from '@/types';
import { Plus, Upload, Trash2, Copy, LayoutTemplate, X, Code } from 'lucide-react';

export const DoctorTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'SOAP Note',
    specialty: 'General Medicine',
    body: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await client.get('/templates');
      setTemplates(res.data);
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
      await client.post('/templates', {
        ...form,
        variables: ["{{patientName}}", "{{consultationDate}}", "{{doctorName}}", "{{chiefComplaint}}", "{{historyOfPresentIllness}}"],
      });
      setShowModal(false);
      setForm({ name: '', description: '', type: 'SOAP Note', specialty: 'General Medicine', body: '' });
      fetchTemplates();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tmplId: string) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await client.delete(`/templates/${tmplId}`);
      fetchTemplates();
    } catch (err) {
      alert('Error deleting template');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isImporting) return;
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsImporting(true);
      await client.post('/templates/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Template imported successfully!');
      fetchTemplates();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error importing template file');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Custom Document Templates</h1>
          <p className="text-slate-500 text-sm">Create, import, and organize clinical report templates with dynamic variables.</p>
        </div>

        <div className="flex items-center space-x-3">
          <label className={`inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition shadow-sm ${isImporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <Upload className="w-4 h-4 text-blue-400" />
            <span>{isImporting ? 'Importing...' : 'Import Template'}</span>
            <input type="file" accept=".txt,.docx,.html" disabled={isImporting} onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {/* Available Variables Guide */}
      <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center space-x-3 text-xs">
        <Code className="w-5 h-5 text-blue-400 shrink-0" />
        <div>
          <span className="font-semibold text-blue-300">Supported Template Variables:</span>{' '}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">&#123;&#123;patientName&#125;&#125;</code>,{' '}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">&#123;&#123;consultationDate&#125;&#125;</code>,{' '}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">&#123;&#123;doctorName&#125;&#125;</code>,{' '}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">&#123;&#123;chiefComplaint&#125;&#125;</code>,{' '}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">&#123;&#123;historyOfPresentIllness&#125;&#125;</code>,{' '}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">&#123;&#123;examination&#125;&#125;</code>,{' '}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">&#123;&#123;diagnosis&#125;&#125;</code>,{' '}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">&#123;&#123;plan&#125;&#125;</code>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">{t.type}</span>
                <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-rose-600 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mt-2">{t.name}</h3>
              <p className="text-xs text-slate-500">{t.description || 'Custom template body layout.'}</p>
              <pre className="mt-3 p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-700 max-h-36 overflow-y-auto border border-slate-100">
                {t.body}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Create Custom Template</h3>
              <button type="button" disabled={isSaving} onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Template Name</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="General SOAP Note" className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-2 border rounded-lg text-sm">
                    <option>SOAP Note</option>
                    <option>Discharge Summary</option>
                    <option>Case Sheet</option>
                    <option>Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Specialty</label>
                  <input value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Template Structure Body</label>
                <textarea required rows={6} value={form.body} onChange={e => setForm({...form, body: e.target.value})} placeholder="SUBJECTIVE:\nChief Complaint: {{chiefComplaint}}..." className="w-full p-2 border rounded-lg text-sm font-mono" />
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl shadow mt-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? 'Saving Template...' : 'Save Template'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
