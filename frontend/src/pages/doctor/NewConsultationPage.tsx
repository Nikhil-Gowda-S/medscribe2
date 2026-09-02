import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { Patient, DocumentTemplate } from '@/types';
import { Mic, Square, Upload, Sparkles, Loader2, RotateCcw, Volume2 } from 'lucide-react';

export const DoctorNewConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [docType, setDocType] = useState('SOAP Note');
  const [transcript, setTranscript] = useState('');
  // Audio transcription is saved to a consultation immediately. Keep that ID so
  // the generated document is attached to the same encounter rather than a new one.
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [transcriptionWarning, setTranscriptionWarning] = useState('');
  const [activeOperation, setActiveOperation] = useState<'transcribing' | 'generating' | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingSecondsRef = useRef(0);
  const audioPreviewUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (recordingTimerRef.current !== null) window.clearInterval(recordingTimerRef.current);
    if (audioPreviewUrlRef.current) URL.revokeObjectURL(audioPreviewUrlRef.current);
  }, []);

  const showAudioPreview = (audio: Blob) => {
    if (audioPreviewUrlRef.current) URL.revokeObjectURL(audioPreviewUrlRef.current);
    const nextUrl = URL.createObjectURL(audio);
    audioPreviewUrlRef.current = nextUrl;
    setAudioPreviewUrl(nextUrl);
  };

  useEffect(() => {
    client.get('/patients').then(res => setPatients(res.data));
    client.get('/templates').then(res => setTemplates(res.data));
  }, []);

  const handleStartRecord = async () => {
    if (activeOperation) return;
    if (!selectedPatientId) {
      alert('Please select a patient before recording');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      const preferredMimeType = 'audio/webm;codecs=opus';
      const mediaRecorder = MediaRecorder.isTypeSupported(preferredMimeType)
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        showAudioPreview(audioBlob);
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        if (recordingTimerRef.current !== null) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setIsRecording(false);

        if (audioBlob.size < 2_000 || recordingSecondsRef.current < 1) {
          alert('Recording was too short. Please record for at least a few seconds before stopping.');
          return;
        }
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        
        try {
          setActiveOperation('transcribing');
          const cRes = await client.post('/consultations', { patient_id: selectedPatientId, transcript: '' });
          const cons = cRes.data;
          
          const uRes = await client.post(`/consultations/${cons.id}/audio`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setTranscript(uRes.data.transcript);
          setConsultationId(cons.id);
          setTranscriptionWarning(
            uRes.data.transcript.trim().split(/\s+/).filter(Boolean).length <= 2
              ? 'The transcript is unusually short. Play the recording below to confirm the correct microphone was captured, then record again if needed.'
              : ''
          );
        } catch (err: any) {
          alert(err.response?.data?.detail || 'Error uploading recorded audio');
        } finally {
          setActiveOperation(null);
        }
      };

      // Request periodic chunks so the browser preserves the full recording,
      // including speech immediately before the Stop button is pressed.
      mediaRecorder.start(1000);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      setTranscriptionWarning('');
      recordingTimerRef.current = window.setInterval(() => {
        recordingSecondsRef.current += 1;
        setRecordingSeconds(recordingSecondsRef.current);
      }, 1000);
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or not available');
    }
  };

  const handleStopRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      if (recordingTimerRef.current !== null) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeOperation) return;
    if (!e.target.files || e.target.files.length === 0) return;
    if (!selectedPatientId) {
      alert('Please select a patient before uploading audio');
      e.target.value = '';
      return;
    }
    const file = e.target.files[0];
    showAudioPreview(file);
    const formData = new FormData();
    formData.append('file', file);

    try {
      setActiveOperation('transcribing');
      // Create initial consultation first
      const cRes = await client.post('/consultations', { patient_id: selectedPatientId, transcript: '' });
      const cons = cRes.data;
      // Upload audio
      const uRes = await client.post(`/consultations/${cons.id}/audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTranscript(uRes.data.transcript);
      setConsultationId(cons.id);
      setTranscriptionWarning(
        uRes.data.transcript.trim().split(/\s+/).filter(Boolean).length <= 2
          ? 'The transcript is unusually short. Play the audio below to verify the source before generating a report.'
          : ''
      );
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error uploading audio file');
    } finally {
      setActiveOperation(null);
    }
  };

  const handleGenerate = async () => {
    if (activeOperation) return;
    if (!selectedPatientId) {
      alert('Please select a patient');
      return;
    }
    if (!transcript) {
      alert('Please record or provide a consultation transcript');
      return;
    }

    try {
      setActiveOperation('generating');
      // Reuse the consultation created during audio transcription. For a pasted
      // transcript, create the consultation here.
      let targetConsultationId = consultationId;
      if (!targetConsultationId) {
        const cRes = await client.post('/consultations', { patient_id: selectedPatientId, transcript });
        targetConsultationId = cRes.data.id;
      } else {
        // Persist any corrections made in the transcript editor before asking AI
        // to generate the report for this consultation.
        await client.put(`/consultations/${targetConsultationId}`, { transcript });
      }

      await client.post('/documents/generate', {
        consultation_id: targetConsultationId,
        template_id: selectedTemplateId || null,
        document_type: docType,
      });

      navigate(`/consultations/${targetConsultationId}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error generating document draft');
    } finally {
      setActiveOperation(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Patient Encounter</h1>
        <p className="text-slate-500 text-sm">Record ambient audio or upload audio file to generate clinical documentation.</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        {/* Patient Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Select Patient</label>
          <select
            value={selectedPatientId}
            disabled={Boolean(activeOperation) || isRecording}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              setTranscript('');
              setConsultationId(null);
            }}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 text-sm"
          >
            <option value="">-- Choose Patient --</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} ({p.medical_record_number || 'No MRN'})
              </option>
            ))}
          </select>
        </div>

        {/* Template & Document Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            >
              <option>SOAP Note</option>
              <option>Discharge Summary</option>
              <option>Case Sheet</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Select Template</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            >
              <option value="">Standard Built-in Template</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Audio Recording Controls */}
        <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center space-x-4">
            {!isRecording ? (
              <button
                onClick={handleStartRecord}
                disabled={Boolean(activeOperation)}
                className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 px-6 py-3 rounded-xl font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mic className="w-5 h-5" />
                <span>Start Live Recording</span>
              </button>
            ) : (
              <button
                onClick={handleStopRecord}
                className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition animate-pulse"
              >
                <Square className="w-5 h-5" />
                <span>Stop Recording</span>
              </button>
            )}

            <label className={`flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl font-semibold border border-slate-700 transition ${activeOperation || isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <Upload className="w-5 h-5 text-blue-400" />
              <span>Upload Audio File</span>
              <input type="file" accept="audio/*" disabled={Boolean(activeOperation) || isRecording} onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          {isRecording && <p className="text-xs text-rose-400 animate-pulse font-mono">● Recording {recordingSeconds}s — speak normally, then press Stop when finished.</p>}
          {activeOperation === 'transcribing' && <p className="text-xs text-blue-300 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Transcribing audio. This can take up to a minute; please keep this page open.</p>}
        </div>

        {audioPreviewUrl && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Volume2 className="w-4 h-4 text-blue-600" />Recording check</p>
              <button
                type="button"
                disabled={Boolean(activeOperation) || isRecording}
                onClick={handleStartRecord}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" /> Record again
              </button>
            </div>
            <audio controls src={audioPreviewUrl} className="w-full" />
            <p className="text-xs text-slate-500">Play this before generating the report. If it does not contain your voice clearly, select the correct input microphone in your browser or Windows sound settings and record again.</p>
          </div>
        )}

        {transcriptionWarning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{transcriptionWarning}</div>
        )}

        {/* Transcript Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Encounter Transcript</label>
          <textarea
            rows={6}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Live audio transcript will appear here or paste clinical encounter text..."
            className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-800"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={Boolean(activeOperation) || !selectedPatientId || !transcript}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {activeOperation ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          <span>{activeOperation === 'transcribing' ? 'Transcribing Audio...' : activeOperation === 'generating' ? 'Generating AI Clinical Note...' : 'Generate AI Clinical Draft'}</span>
        </button>
      </div>
    </div>
  );
};
