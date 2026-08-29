export type Role = 'DOCTOR' | 'ADMIN' | 'PATIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialty?: string;
  patient_id?: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  medical_record_number?: string;
  has_portal_account: boolean;
  created_at: string;
}

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  transcript?: string;
  audio_url?: string;
  transcription_status: string;
  has_critical_flag: boolean;
  critical_flags?: string;
  status: string;
  consultation_date: string;
  created_at: string;
}

export interface Document {
  id: string;
  consultation_id: string;
  patient_id: string;
  doctor_id: string;
  template_id?: string;
  type: string;
  content: string;
  metadata_json?: string;
  accepted_icd10_codes?: string;
  accepted_cpt_codes?: string;
  pdf_url?: string;
  status: string;
  is_finalized: boolean;
  finalized_at?: string;
  created_at: string;
  updated_at: string;
  addendums?: Array<{
    id: string;
    author_id: string;
    content: string;
    created_at: string;
  }>;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  consultation_id?: string;
  medication: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  instructions?: string;
  status: string;
  created_at: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  specialty?: string;
  body: string;
  variables?: string;
  status: string;
  created_at: string;
}

export interface DoctorAnalytics {
  total_consultations: number;
  total_documents: number;
  finalized_documents: number;
  total_prescriptions: number;
  estimated_hours_saved: number;
}
