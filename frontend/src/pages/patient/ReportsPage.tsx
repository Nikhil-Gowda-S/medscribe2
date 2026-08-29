import React, { useEffect, useState } from 'react';
import client from '@/api/client';
import { Document } from '@/types';
import { FileText, Download } from 'lucide-react';

export const PatientReportsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/documents?finalized_only=true')
      .then(res => setDocuments(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (docId: string, docType: string) => {
    try {
      const res = await client.get(`/documents/${docId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docType}_${docId}.pdf`);
      window.document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      console.error(err);
      alert('Error downloading PDF. Make sure you are authorized.');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
          <FileText className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Finalized Medical Reports</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
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
                <button
                  onClick={() => handleDownload(doc.id, doc.type)}
                  className="inline-flex items-center space-x-1 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Signed PDF</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
