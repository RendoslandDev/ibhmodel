import axios from 'axios';
import type {
  Application,
  ApplicationFormData,
  Admin,
  DashboardStats,
  PaginatedResult,
  ApplicationStatus,
} from '../types';

const api = axios.create({
  // Uses VITE_API_URL in production (set in Render dashboard), falls back to /api for local dev proxy
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 30000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ibh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('ibh_token');
      localStorage.removeItem('ibh_admin');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

// ── Public ────────────────────────────────────────────────────────────────────
export async function submitApplication(
  formData: ApplicationFormData,
  photos: File[]
): Promise<{ id: string }> {
  const body = new FormData();
  const { consent: _consent, ...rest } = formData;

  Object.entries(rest).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) body.append(k, JSON.stringify(v));
    else body.append(k, String(v));
  });

  photos.forEach((f) => body.append('photos', f));

  const { data } = await api.post<{ id: string; message: string }>('/applications', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function adminLogin(
  email: string,
  password: string
): Promise<{ token: string; admin: Admin }> {
  const { data } = await api.post<{ token: string; admin: Admin }>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function getMe(): Promise<Admin> {
  const { data } = await api.get<Admin>('/auth/me');
  return data;
}

// ── Applications (admin) ──────────────────────────────────────────────────────
export interface ListParams {
  status?: ApplicationStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listApplications(
  params: ListParams = {}
): Promise<PaginatedResult<Application>> {
  const { data } = await api.get<PaginatedResult<Application>>('/applications', { params });
  return data;
}

export async function getApplication(id: string): Promise<Application> {
  const { data } = await api.get<Application>(`/applications/${id}`);
  return data;
}

export async function updateStatus(
  id: string,
  status: ApplicationStatus,
  admin_notes?: string,
  notify_model = true
): Promise<void> {
  await api.patch(`/applications/${id}/status`, { status, admin_notes, notify_model });
}

export async function sendAgreement(id: string): Promise<void> {
  await api.post(`/applications/${id}/send-agreement`);
}

export async function deleteApplication(id: string): Promise<void> {
  await api.delete(`/applications/${id}`);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/applications/stats');
  return data;
}

export default api;
