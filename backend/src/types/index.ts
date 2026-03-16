export type ApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'waitlisted';

export interface Application {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  nationality?: string;
  location: string;
  email: string;
  phone: string;
  instagram?: string;
  portfolio_url?: string;
  height_cm?: number;
  weight_kg?: number;
  bust_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  shoe_size_eu?: number;
  hair_color?: string;
  eye_color?: string;
  skin_tone?: string;
  categories: string[];
  experience?: string;
  prev_agency?: string;
  campaigns?: string;
  bio: string;
  availability?: string;
  travel_pref?: string;
  hear_about?: string;
  emergency_contact?: string;
  photo_keys: string[];
  photo_urls: string[];
  status: ApplicationStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  agreement_sent: boolean;
  agreement_sent_at?: string;
  agreement_signed: boolean;
  agreement_pdf_key?: string;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'super_admin' | 'reviewer';
  created_at: string;
}

export interface ActivityLog {
  id: string;
  application_id: string;
  admin_id?: string;
  action: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface JwtPayload {
  adminId: string;
  email: string;
  role: string;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
